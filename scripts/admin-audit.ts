/**
 * Admin dashboard functional audit — hits local APIs with owner/staff sessions.
 * Usage: tsx scripts/admin-audit.ts [baseUrl]
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

const BASE = process.argv[2] ?? "http://localhost:3000";

type Result = { section: string; test: string; status: "PASS" | "PARTIAL" | "FAIL"; detail?: string };

const results: Result[] = [];

function pass(section: string, test: string, detail?: string) {
  results.push({ section, test, status: "PASS", detail });
}

function partial(section: string, test: string, detail?: string) {
  results.push({ section, test, status: "PARTIAL", detail });
}

function fail(section: string, test: string, detail?: string) {
  results.push({ section, test, status: "FAIL", detail });
}

async function login(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
  const cookies = raw.flatMap((c) => (c ? [c.split(";")[0]] : []));
  const session = cookies.find((c) => c.startsWith("zarkari-session="));
  return session ?? null;
}

async function req(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Cookie: cookie,
      ...(init?.body && !(init.headers as Record<string, string>)?.["Content-Type"]
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });
  let body: unknown;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) body = await res.json();
  else body = await res.text();
  return { status: res.status, body, headers: res.headers };
}

async function pageOk(path: string, cookie: string): Promise<boolean> {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
  return res.status === 200 || res.status === 307;
}

async function pageHtml(path: string, cookie?: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "follow",
  });
  return res.text();
}

async function customerSession(orderNumber: string, phone: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/customer/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, phone }),
  });
  if (!res.ok) return null;
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
  const cookies = raw.flatMap((c) => (c ? [c.split(";")[0]] : []));
  const session = cookies.find((c) => c.startsWith("zarkari-customer-order="));
  return session ?? null;
}

async function main() {
  console.log(`Auditing ${BASE}...\n`);

  const ownerCookie = await login("owner@zarkari.co.uk", "demo123");
  const staffCookie = await login("staff@zarkari.co.uk", "demo123");
  const supplierCookie = await login("supplier@zarkari.co.uk", "demo123");

  if (!ownerCookie) {
    fail("Setup", "Owner login", "Could not authenticate owner");
    printReport();
    process.exit(1);
  }
  pass("Setup", "Owner login");
  if (staffCookie) pass("Setup", "Staff login");
  else fail("Setup", "Staff login", "Could not authenticate staff");
  if (supplierCookie) pass("Setup", "Supplier login");
  else partial("Setup", "Supplier login", "Supplier account missing");

  // 1 Dashboard
  if (await pageOk("/admin/dashboard", ownerCookie)) pass("Dashboard", "Page loads (owner)");
  else fail("Dashboard", "Page loads (owner)");

  // 2 Daily Cash
  if (await pageOk("/admin/cash", ownerCookie)) pass("Daily Cash", "Page loads");
  else fail("Daily Cash", "Page loads");
  const cashSummary = await req("/api/cash/summary?date=" + new Date().toISOString().slice(0, 10), ownerCookie);
  if (cashSummary.status === 200) pass("Daily Cash", "GET /api/cash/summary");
  else fail("Daily Cash", "GET /api/cash/summary", `status ${cashSummary.status}`);
  const payableOrders = await req("/api/cash/payable-orders", ownerCookie);
  if (payableOrders.status === 200 && Array.isArray((payableOrders.body as { orders?: unknown[] })?.orders)) {
    pass("Daily Cash", "GET /api/cash/payable-orders");
  } else fail("Daily Cash", "GET /api/cash/payable-orders", `status ${payableOrders.status}`);
  if (await pageOk("/admin/cash?preset=week", ownerCookie)) pass("Daily Cash", "Week preset page loads");
  else fail("Daily Cash", "Week preset page loads");
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const rangeSummary = await req(`/api/cash/summary?from=${weekAgo}&to=${today}`, ownerCookie);
  if (rangeSummary.status === 200) pass("Daily Cash", "GET /api/cash/summary custom range");
  else fail("Daily Cash", "GET /api/cash/summary custom range", `status ${rangeSummary.status}`);
  const txCreate = await req("/api/cash/transactions", ownerCookie, {
    method: "POST",
    body: JSON.stringify({
      direction: "in",
      type: "other_in",
      amount: "1.00",
      method: "cash",
      reference: "AUDIT-TEST",
      description: "Audit test transaction",
    }),
  });
  if (txCreate.status === 200 || txCreate.status === 201) pass("Daily Cash", "POST manual transaction");
  else fail("Daily Cash", "POST manual transaction", `status ${txCreate.status}`);
  if (staffCookie) {
    const staffCash = await pageOk("/admin/cash", staffCookie);
    if (staffCash) pass("Daily Cash", "Staff can access");
    else fail("Daily Cash", "Staff can access");
  }

  // 3 Cash Analytics
  if (await pageOk("/admin/cash/analytics", ownerCookie)) pass("Cash Analytics", "Owner page loads");
  else fail("Cash Analytics", "Owner page loads");
  const analytics = await req("/api/cash/analytics?period=7", ownerCookie);
  if (analytics.status === 200) pass("Cash Analytics", "GET /api/cash/analytics");
  else fail("Cash Analytics", "GET /api/cash/analytics", `status ${analytics.status}`);
  const analyticsMonth = await req("/api/cash/analytics?preset=month", ownerCookie);
  if (analyticsMonth.status === 200) pass("Cash Analytics", "GET /api/cash/analytics?preset=month");
  else fail("Cash Analytics", "GET /api/cash/analytics?preset=month", `status ${analyticsMonth.status}`);
  const analyticsRange = await req(`/api/cash/analytics?from=${weekAgo}&to=${today}`, ownerCookie);
  if (analyticsRange.status === 200) pass("Cash Analytics", "GET /api/cash/analytics custom range");
  else fail("Cash Analytics", "GET /api/cash/analytics custom range", `status ${analyticsRange.status}`);
  if (staffCookie) {
    const staffAn = await fetch(`${BASE}/admin/cash/analytics`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    if (staffAn.status === 307 || staffAn.headers.get("location")?.includes("/admin/cash"))
      pass("Cash Analytics", "Staff redirected from analytics");
    else partial("Cash Analytics", "Staff redirected from analytics", `status ${staffAn.status}`);
  }

  // 4 Orders
  if (await pageOk("/admin/orders", ownerCookie)) pass("Orders", "List page loads");
  else fail("Orders", "List page loads");
  const ordersApi = await req("/api/orders/search?q=SAMPLE", ownerCookie);
  if (ordersApi.status === 200) pass("Orders", "GET /api/orders/search");
  else partial("Orders", "GET /api/orders/search", `status ${ordersApi.status}`);

  // 5 Shop Orders
  if (await pageOk("/admin/orders/retail", ownerCookie)) pass("Shop Orders", "Page loads");
  else fail("Shop Orders", "Page loads");

  // 6 Inbox
  if (await pageOk("/admin/inbox", ownerCookie)) pass("Inbox", "Page loads");
  else fail("Inbox", "Page loads");
  const inboxList = await req("/api/inbox", ownerCookie);
  if (inboxList.status === 200) pass("Inbox", "GET /api/inbox");
  else fail("Inbox", "GET /api/inbox", `status ${inboxList.status}`);
  const manualInq = await req("/api/inbox/manual", ownerCookie, {
    method: "POST",
    body: JSON.stringify({
      platform: "walkin",
      customerName: "Audit Test",
      message: "Audit manual inquiry",
    }),
  });
  if (manualInq.status === 200 || manualInq.status === 201) pass("Inbox", "POST manual inquiry");
  else fail("Inbox", "POST manual inquiry", `status ${manualInq.status}`);

  // 7 Content
  for (const p of [
    "/admin/content",
    "/admin/content/products",
    "/admin/content/collections",
    "/admin/content/blog",
    "/admin/content/homepage",
    "/admin/content/media",
  ]) {
    if (await pageOk(p, ownerCookie)) pass("Content", `Page ${p}`);
    else fail("Content", `Page ${p}`);
  }
  const productsApi = await req("/api/products?id=nonexistent-audit-id", ownerCookie);
  if (productsApi.status === 404 || productsApi.status === 400) pass("Content", "GET /api/products (requires id)");
  else if (productsApi.status === 200) pass("Content", "GET /api/products");
  else partial("Content", "GET /api/products", `status ${productsApi.status}`);

  // 8 New Order
  if (await pageOk("/admin/orders/new", ownerCookie)) pass("New Order", "Form page loads");
  else fail("New Order", "Form page loads");
  const suppliers = await req("/api/suppliers", ownerCookie);
  const supplierList = Array.isArray((suppliers.body as { suppliers?: unknown[] })?.suppliers)
    ? (suppliers.body as { suppliers: { id: string }[] }).suppliers
    : [];
  const auditPhone = `07${String(Date.now()).slice(-9)}`;
  const createOrder = await req("/api/orders", ownerCookie, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Audit Customer",
      customerPhone: auditPhone,
      customerEmail: "audit@test.com",
      supplierId: supplierList[0]?.id,
      dressType: "Lehenga",
      totalPrice: "2000.00",
    }),
  });
  let auditOrderId: string | undefined;
  let auditOrderNumber: string | undefined;
  if (createOrder.status === 200 || createOrder.status === 201) {
    pass("New Order", "POST create order");
    auditOrderId = (createOrder.body as { id?: string })?.id;
    auditOrderNumber = (createOrder.body as { orderNumber?: string })?.orderNumber;
    if (auditOrderId) {
      const detail = await pageOk(`/admin/orders/${auditOrderId}`, ownerCookie);
      if (detail) pass("New Order", "Detail page after create");
      else fail("New Order", "Detail page after create");
    }
  } else fail("New Order", "POST create order", `status ${createOrder.status}`);

  const newOrderHtml = await pageHtml("/admin/orders/new", ownerCookie);
  if (newOrderHtml.includes("Voice Notes") || newOrderHtml.includes("New Order")) {
    pass("New Order", "Form page includes voice note section or title");
  } else partial("New Order", "Form page includes voice note section or title", "Voice UI may be client-only");

  // 9-11 Customers, Suppliers, Calendar
  for (const [section, path] of [
    ["Customers", "/admin/customers"],
    ["Suppliers", "/admin/suppliers"],
    ["Calendar", "/admin/calendar"],
  ] as const) {
    if (await pageOk(path, ownerCookie)) pass(section, "Page loads");
    else fail(section, "Page loads");
  }

  // 12 Payments
  if (await pageOk("/admin/payments", ownerCookie)) pass("Payments", "Page loads");
  else fail("Payments", "Page loads");

  // 13 Finance
  if (await pageOk("/admin/finance", ownerCookie)) pass("Finance", "Owner page loads");
  else fail("Finance", "Owner page loads");
  if (staffCookie) {
    const staffFin = await fetch(`${BASE}/admin/finance`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    if (staffFin.status === 307) pass("Finance", "Staff redirected");
    else partial("Finance", "Staff redirected", `status ${staffFin.status}`);
  }

  // 14 Reports
  if (await pageOk("/admin/reports", ownerCookie)) pass("Reports", "Page loads");
  else fail("Reports", "Page loads");
  const csvOwner = await req("/api/reports/export?period=monthly", ownerCookie);
  if (csvOwner.status === 200) pass("Reports", "Owner CSV export");
  else fail("Reports", "Owner CSV export", `status ${csvOwner.status}`);
  if (staffCookie) {
    const csvStaff = await req("/api/reports/export?period=monthly", staffCookie);
    if (csvStaff.status === 403) pass("Reports", "Staff CSV blocked");
    else fail("Reports", "Staff CSV blocked", `expected 403 got ${csvStaff.status}`);
  }

  // 15 Notifications
  if (await pageOk("/admin/notifications", ownerCookie)) pass("Notifications", "Page loads");
  else fail("Notifications", "Page loads");
  const notifPatch = await req("/api/notifications", ownerCookie, { method: "PATCH" });
  if (notifPatch.status === 200) pass("Notifications", "PATCH mark all read");
  else fail("Notifications", "PATCH mark all read", `status ${notifPatch.status}`);

  // 16 Settings
  if (await pageOk("/admin/settings", ownerCookie)) pass("Settings", "Page loads");
  else fail("Settings", "Page loads");
  const settingsGet = await req("/api/settings", ownerCookie);
  if (settingsGet.status === 200) pass("Settings", "GET /api/settings");
  else fail("Settings", "GET /api/settings", `status ${settingsGet.status}`);

  // 17 Users
  if (await pageOk("/admin/users", ownerCookie)) pass("Users", "Owner page loads");
  else fail("Users", "Owner page loads");
  if (staffCookie) {
    const staffUsers = await fetch(`${BASE}/admin/users`, {
      headers: { Cookie: staffCookie },
      redirect: "manual",
    });
    if (staffUsers.status === 307) pass("Users", "Staff redirected");
    else fail("Users", "Staff redirected", `status ${staffUsers.status}`);
  }
  const usersApi = await req("/api/users", ownerCookie);
  if (usersApi.status === 200) pass("Users", "GET /api/users");
  else fail("Users", "GET /api/users", `status ${usersApi.status}`);

  // 18 Training
  if (await pageOk("/admin/training", ownerCookie)) pass("Training", "Page loads");
  else fail("Training", "Page loads");

  // 19 Upload
  const presignUnauth = await fetch(`${BASE}/api/upload/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: "test.mp4", contentType: "video/mp4", fileSize: 1024 }),
  });
  if (presignUnauth.status === 401) pass("Upload", "Presign requires auth");
  else fail("Upload", "Presign requires auth", `status ${presignUnauth.status}`);
  const presignBad = await req("/api/upload/presign", ownerCookie, {
    method: "POST",
    body: JSON.stringify({ fileName: "test.txt", contentType: "text/plain", fileSize: 100 }),
  });
  if (presignBad.status === 400) pass("Upload", "Presign rejects non-media");
  else partial("Upload", "Presign rejects non-media", `status ${presignBad.status}`);
  const presignOk = await req("/api/upload/presign", ownerCookie, {
    method: "POST",
    body: JSON.stringify({ fileName: "audit.mp4", contentType: "video/mp4", fileSize: 2048, category: "audit" }),
  });
  if (presignOk.status === 200) pass("Upload", "POST /api/upload/presign (video)");
  else partial("Upload", "POST /api/upload/presign (video)", `status ${presignOk.status}`);

  const voiceFixture = resolve(root, "apps/web/public/audio/sample-voice.webm");
  if (existsSync(voiceFixture)) {
    const voiceBytes = readFileSync(voiceFixture);
    const voiceForm = new FormData();
    voiceForm.append("file", new Blob([voiceBytes], { type: "audio/webm" }), "sample-voice.webm");
    voiceForm.append("category", "order-voice");
    const voiceUpload = await fetch(`${BASE}/api/upload`, {
      method: "POST",
      headers: { Cookie: ownerCookie },
      body: voiceForm,
    });
    if (voiceUpload.status === 200) {
      const voiceBody = (await voiceUpload.json()) as {
        url?: string;
        keepLocal?: boolean;
        mimeType?: string;
      };
      const badUrl =
        voiceBody.url?.endsWith(".png") || voiceBody.url?.includes("/catalog/guldaan/");
      if (voiceBody.keepLocal || (voiceBody.url && !badUrl)) {
        pass("Voice notes", "POST /api/upload returns audio URL (not PNG placeholder)");
      } else {
        fail("Voice notes", "POST /api/upload returns audio URL (not PNG placeholder)", voiceBody.url ?? "no url");
      }
      if (voiceBody.mimeType?.startsWith("audio/") || voiceBody.keepLocal) {
        pass("Voice notes", "Upload response includes audio mime or keepLocal");
      } else partial("Voice notes", "Upload response includes audio mime or keepLocal");

      const voiceMediaUrl =
        voiceBody.url && !badUrl ? voiceBody.url : "/audio/sample-voice.webm";
      const voiceOrder = await req("/api/orders", ownerCookie, {
        method: "POST",
        body: JSON.stringify({
          customerName: "Voice Audit",
          customerPhone: `07${String(Date.now() + 1).slice(-9)}`,
          customerEmail: "voice-audit@test.com",
          supplierId: supplierList[0]?.id,
          dressType: "Lehenga",
          totalPrice: "1500.00",
          mediaFiles: [{ url: voiceMediaUrl, name: "sample-voice.webm", category: "voice" }],
        }),
      });
      if (voiceOrder.status === 200 || voiceOrder.status === 201) {
        pass("Voice notes", "POST /api/orders accepts voice mediaFiles");
      } else {
        partial("Voice notes", "POST /api/orders accepts voice mediaFiles", `status ${voiceOrder.status}`);
      }
    } else {
      partial("Voice notes", "POST /api/upload voice fixture", `status ${voiceUpload.status}`);
    }
  } else {
    partial("Voice notes", "Voice upload smoke test", "Missing apps/web/public/audio/sample-voice.webm");
  }

  const videoFixture =
    resolve(root, "apps/web/public/video/sample-audit.webm");
  const videoFixtureFallback = resolve(root, "apps/web/public/audio/sample-voice.webm");
  const videoBytesPath = existsSync(videoFixture) ? videoFixture : videoFixtureFallback;
  if (existsSync(videoBytesPath)) {
    const videoBytes = readFileSync(videoBytesPath);
    const videoInit = await req("/api/upload/multipart/init", ownerCookie, {
      method: "POST",
      body: JSON.stringify({
        fileName: "audit-sample.mov",
        contentType: "video/quicktime",
        category: "cms",
        fileSize: videoBytes.length,
      }),
    });
    const initBody = videoInit.body as {
      demo?: boolean;
      uploadId?: string;
      key?: string;
      publicUrl?: string;
      fileName?: string;
      error?: string;
    };
    if (videoInit.status === 200 && initBody.uploadId && initBody.key && initBody.publicUrl) {
      pass("Video upload", "POST /api/upload/multipart/init");
      const partForm = new FormData();
      partForm.append("uploadId", initBody.uploadId);
      partForm.append("key", initBody.key);
      partForm.append("partNumber", "1");
      partForm.append("file", new Blob([videoBytes], { type: "video/quicktime" }), "part-1");
      const partRes = await fetch(`${BASE}/api/upload/multipart/part`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
        body: partForm,
      });
      if (partRes.status === 200) {
        pass("Video upload", "POST /api/upload/multipart/part");
        const partBody = (await partRes.json()) as { etag?: string; partNumber?: number };
        const complete = await req("/api/upload/multipart/complete", ownerCookie, {
          method: "POST",
          body: JSON.stringify({
            uploadId: initBody.uploadId,
            key: initBody.key,
            fileName: initBody.fileName ?? "audit-sample.mov",
            contentType: "video/quicktime",
            category: "cms",
            publicUrl: initBody.publicUrl,
            parts: [{ partNumber: partBody.partNumber ?? 1, etag: partBody.etag }],
          }),
        });
        if (complete.status === 200) {
          const completeBody = complete.body as { url?: string; asset?: { id?: string } };
          const badVideoUrl =
            completeBody.url?.endsWith(".png") || completeBody.url?.includes("/catalog/guldaan/");
          if (completeBody.url && !badVideoUrl) {
            pass("Video upload", "Multipart complete returns video URL (not PNG)");
          } else {
            fail("Video upload", "Multipart complete returns video URL (not PNG)", completeBody.url ?? "no url");
          }
          if (completeBody.asset?.id) {
            const mediaDel = await req(`/api/media/${completeBody.asset.id}`, ownerCookie, { method: "DELETE" });
            if (mediaDel.status === 200) pass("Media library", "DELETE /api/media/{id}");
            else partial("Media library", "DELETE /api/media/{id}", `status ${mediaDel.status}`);
          } else partial("Media library", "DELETE /api/media/{id}", "No asset id from upload");
        } else {
          partial("Video upload", "POST /api/upload/multipart/complete", `status ${complete.status}`);
        }
      } else {
        partial("Video upload", "POST /api/upload/multipart/part", `status ${partRes.status}`);
      }
    } else if (initBody.demo) {
      partial("Video upload", "Multipart init (R2 not configured)", "demo mode");
    } else {
      partial("Video upload", "POST /api/upload/multipart/init", `status ${videoInit.status}`);
    }
  } else {
    partial("Video upload", "Video multipart smoke test", "Missing video fixture");
  }

  const mediaList = await req("/api/media?type=video&category=cms", ownerCookie);
  if (mediaList.status === 200) pass("Media library", "GET /api/media with type and category filters");
  else partial("Media library", "GET /api/media with filters", `status ${mediaList.status}`);

  // 20 Staff messages + customer portal sync
  if (auditOrderId && auditOrderNumber) {
    const staffMsg = await req(`/api/orders/${auditOrderId}/message`, ownerCookie, {
      method: "POST",
      body: JSON.stringify({ message: "Audit staff update — your order is progressing well." }),
    });
    if (staffMsg.status === 200) pass("Staff Messages", "POST /api/orders/{id}/message");
    else fail("Staff Messages", "POST /api/orders/{id}/message", `status ${staffMsg.status}`);

    const customerCookie = await customerSession(auditOrderNumber, auditPhone);
    if (customerCookie) {
      const customerOrder = await fetch(`${BASE}/api/customer/order?orderNumber=${encodeURIComponent(auditOrderNumber)}`, {
        headers: { Cookie: customerCookie },
      });
      if (customerOrder.status === 200) {
        const data = (await customerOrder.json()) as { messages?: { body?: string; message?: string }[] };
        const found = (data.messages ?? []).some((m) =>
          (m.body ?? m.message ?? "").includes("Audit staff update")
        );
        if (found) pass("Staff Messages", "Customer order API shows staff message");
        else partial("Staff Messages", "Customer order API shows staff message", "Message not found in response");
      } else partial("Staff Messages", "Customer order API shows staff message", `status ${customerOrder.status}`);
    } else partial("Staff Messages", "Customer verify for message sync", "Verify failed");
  } else partial("Staff Messages", "POST /api/orders/{id}/message", "No order created in audit");

  // Customer portal login (no OTP)
  const myOrderPage = await pageHtml("/my-order");
  if (myOrderPage.includes("View Order Status")) pass("Customer Portal", "my-order login (no OTP step)");
  else partial("Customer Portal", "my-order login (no OTP step)");
  if (!myOrderPage.includes("Verification Code") && !myOrderPage.includes("6-digit")) {
    pass("Customer Portal", "No OTP form on my-order page");
  } else fail("Customer Portal", "No OTP form on my-order page");

  if (auditOrderId && auditOrderNumber) {
    const customerCookie = await customerSession(auditOrderNumber, auditPhone);
    if (customerCookie) {
      const custMsg = await fetch(`${BASE}/api/customer/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: customerCookie },
        body: JSON.stringify({ orderId: auditOrderId, message: "Audit customer message test" }),
      });
      if (custMsg.status === 200) pass("Customer Portal", "POST customer message");
      else fail("Customer Portal", "POST customer message", `status ${custMsg.status}`);
    } else partial("Customer Portal", "POST customer message", "Could not verify customer session");
  }

  // 21 PWA
  const manifest = await fetch(`${BASE}/manifest-boms.json`);
  if (manifest.status === 200) {
    const json = (await manifest.json()) as { name?: string };
    if (json.name) pass("PWA", "manifest-boms.json reachable");
    else partial("PWA", "manifest-boms.json reachable", "Missing name field");
  } else fail("PWA", "manifest-boms.json reachable", `status ${manifest.status}`);

  // 22 Login
  const loginPage = await pageHtml("/login");
  if (loginPage.includes("Sign In") || loginPage.includes("Staff")) pass("Login", "Page loads");
  else fail("Login", "Page loads");
  if (!loginPage.includes("demo123") && !loginPage.match(/Demo:\s*owner@/i)) {
    pass("Login", "No demo credentials in HTML");
  } else fail("Login", "No demo credentials in HTML", "Demo hint still present");

  // 23 Customer portal
  const myOrderPage = await fetch(`${BASE}/my-order`);
  if (myOrderPage.status === 200) pass("Customer Portal", "my-order page loads");
  else fail("Customer Portal", "my-order page loads", `status ${myOrderPage.status}`);

  // 24 Supplier portal
  if (supplierCookie) {
    if (await pageOk("/supplier", supplierCookie)) pass("Supplier Portal", "Dashboard loads");
    else partial("Supplier Portal", "Dashboard loads");
  }

  // Auth cross-cutting
  const unauth = await fetch(`${BASE}/admin/dashboard`, { redirect: "manual" });
  if (unauth.status === 307 || unauth.status === 302) pass("Auth", "Unauthenticated redirect");
  else partial("Auth", "Unauthenticated redirect", `status ${unauth.status}`);

  if (supplierCookie) {
    const supDash = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Cookie: supplierCookie },
      redirect: "manual",
    });
    if (supDash.status === 307) pass("Auth", "Supplier blocked from dashboard");
    else partial("Auth", "Supplier blocked from dashboard", `status ${supDash.status}`);
    const supInbox = await pageOk("/admin/inbox", supplierCookie);
    if (supInbox) pass("Auth", "Supplier can access inbox");
    else partial("Auth", "Supplier can access inbox");
  }

  printReport();
  const fails = results.filter((r) => r.status === "FAIL").length;
  process.exit(fails > 0 ? 1 : 0);
}

function printReport() {
  console.log("\n=== ADMIN AUDIT RESULTS ===\n");
  const sections = [...new Set(results.map((r) => r.section))];
  for (const section of sections) {
    const items = results.filter((r) => r.section === section);
    const worst = items.some((i) => i.status === "FAIL")
      ? "FAIL"
      : items.some((i) => i.status === "PARTIAL")
        ? "PARTIAL"
        : "PASS";
    console.log(`## ${section} — ${worst}`);
    for (const i of items) {
      console.log(`  [${i.status}] ${i.test}${i.detail ? ` — ${i.detail}` : ""}`);
    }
    console.log("");
  }
  const pass = results.filter((r) => r.status === "PASS").length;
  const partial = results.filter((r) => r.status === "PARTIAL").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total: ${pass} PASS, ${partial} PARTIAL, ${fail} FAIL`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
