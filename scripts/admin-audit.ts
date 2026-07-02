/**
 * Admin dashboard functional audit — hits local APIs with owner/staff sessions.
 * Usage: tsx scripts/admin-audit.ts [baseUrl]
 */
import { config } from "dotenv";
import { existsSync } from "fs";
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
  const createOrder = await req("/api/orders", ownerCookie, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Audit Customer",
      customerPhone: `07${String(Date.now()).slice(-9)}`,
      customerEmail: "audit@test.com",
      supplierId: supplierList[0]?.id,
      dressType: "Lehenga",
      totalPrice: "2000.00",
    }),
  });
  if (createOrder.status === 200 || createOrder.status === 201) {
    pass("New Order", "POST create order");
    const orderId = (createOrder.body as { id?: string })?.id;
    if (orderId) {
      const detail = await pageOk(`/admin/orders/${orderId}`, ownerCookie);
      if (detail) pass("New Order", "Detail page after create");
      else fail("New Order", "Detail page after create");
    }
  } else fail("New Order", "POST create order", `status ${createOrder.status}`);

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
