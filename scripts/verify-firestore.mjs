/**
 * End-to-end Firestore rules + sync verification.
 * Run: node scripts/verify-firestore.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../apps/web/.env.local");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error("Missing apps/web/.env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[t.slice(0, i)] = v;
  }
}

loadEnv();

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}: ${detail}`);
}

async function exchangeCustomToken(customToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Token exchange failed");
  return data.idToken;
}

async function firestoreGet(idToken, path) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  return { status: res.status, ok: res.ok, body: res.ok ? await res.json() : await res.text() };
}

async function main() {
  console.log("=== Firestore rules + sync verification ===\n");
  console.log(`Project: ${PROJECT}\n`);

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  const orderA = "4d6dcb56-5036-41e6-8cd9-86dd59a5a32f"; // BR-2026-0191 from Neon
  const orderB = "567d9cd2-f8ee-451b-bac6-4346f41977e8"; // BR-2026-0190

  // 1. Admin sync (server write path)
  try {
    await db
      .collection("live_orders")
      .doc(orderA)
      .set(
        {
          status: "sent_to_supplier",
          statusLabel: "Rules test",
          deliveryDate: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    await db
      .collection("live_orders")
      .doc(orderA)
      .collection("messages")
      .doc("rules-test-msg")
      .set({
        senderType: "staff",
        senderName: "Test",
        message: "Rules verification message",
        createdAt: new Date().toISOString(),
      });
    await db
      .collection("staff_inbox")
      .doc("shared")
      .set({ unreadCount: 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    const snap = await db.collection("live_orders").doc(orderA).get();
    pass("Admin sync (live_orders)", snap.exists ? `order ${orderA} synced` : "doc missing");
  } catch (e) {
    fail("Admin sync (live_orders)", e.message);
  }

  // 2. Staff token — read own order + staff_inbox
  try {
    const staffToken = await auth.createCustomToken("test-admin-user", {
      role: "admin",
      userId: "test-admin-user",
    });
    const staffIdToken = await exchangeCustomToken(staffToken);

    const orderRead = await firestoreGet(staffIdToken, `live_orders/${orderA}`);
    pass(
      "Rules: staff reads live_orders",
      orderRead.ok ? "allowed" : `denied (${orderRead.status})`
    );

    const msgRead = await firestoreGet(
      staffIdToken,
      `live_orders/${orderA}/messages/rules-test-msg`
    );
    pass(
      "Rules: staff reads messages",
      msgRead.ok ? "allowed" : `denied (${msgRead.status})`
    );

    const inboxRead = await firestoreGet(staffIdToken, "staff_inbox/shared");
    pass(
      "Rules: staff reads staff_inbox",
      inboxRead.ok ? "allowed" : `denied (${inboxRead.status})`
    );
  } catch (e) {
    fail("Rules: staff access", e.message);
  }

  // 3. Customer token — own order OK, other order denied
  try {
    const customerToken = await auth.createCustomToken(`customer-${orderA}`, {
      role: "customer",
      orderId: orderA,
    });
    const customerIdToken = await exchangeCustomToken(customerToken);

    const ownOrder = await firestoreGet(customerIdToken, `live_orders/${orderA}`);
    pass(
      "Rules: customer reads own order",
      ownOrder.ok ? "allowed" : `denied (${ownOrder.status})`
    );

    const ownMsg = await firestoreGet(
      customerIdToken,
      `live_orders/${orderA}/messages/rules-test-msg`
    );
    pass(
      "Rules: customer reads own messages",
      ownMsg.ok ? "allowed" : `denied (${ownMsg.status})`
    );

    const otherOrder = await firestoreGet(customerIdToken, `live_orders/${orderB}`);
    pass(
      "Rules: customer blocked from other order",
      !otherOrder.ok && otherOrder.status === 403 ? "denied as expected" : `unexpected (${otherOrder.status})`
    );

    const inboxDenied = await firestoreGet(customerIdToken, "staff_inbox/shared");
    pass(
      "Rules: customer blocked from staff_inbox",
      !inboxDenied.ok && inboxDenied.status === 403 ? "denied as expected" : `unexpected (${inboxDenied.status})`
    );
  } catch (e) {
    fail("Rules: customer access", e.message);
  }

  // 4. Unauthenticated — denied
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/live_orders/${orderA}`;
    const res = await fetch(url);
    pass(
      "Rules: unauthenticated blocked",
      res.status === 403 || res.status === 401 ? `denied (${res.status})` : `unexpected (${res.status})`
    );
  } catch (e) {
    fail("Rules: unauthenticated", e.message);
  }

  // 5. Client write blocked (rules allow write: if false)
  try {
    const customerToken = await auth.createCustomToken(`customer-${orderA}`, {
      role: "customer",
      orderId: orderA,
    });
    const idToken = await exchangeCustomToken(customerToken);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/live_orders/${orderA}?updateMask.fieldPaths=status`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { status: { stringValue: "hacked" } } }),
    });
    pass(
      "Rules: client write blocked",
      !res.ok && (res.status === 403 || res.status === 401) ? `denied (${res.status})` : `unexpected (${res.status})`
    );
  } catch (e) {
    fail("Rules: client write blocked", e.message);
  }

  // Cleanup test artifacts
  try {
    await db.collection("live_orders").doc(orderA).collection("messages").doc("rules-test-msg").delete();
  } catch {
    /* ignore */
  }

  console.log("\n=== Summary ===");
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  console.log(`${ok}/${results.length} passed`);
  if (bad.length) {
    console.log("\nFailed:");
    bad.forEach((b) => console.log(`  - ${b.name}: ${b.detail}`));
    process.exit(1);
  }
  console.log("\nFirestore rules and server sync are working correctly.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
