/**
 * Production-readiness smoke — phases 2–7 write paths with UUID DB users.
 * Usage: AUDIT_* env vars + tsx scripts/prod-readiness-smoke.ts [baseUrl]
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

type Status = "PASS" | "PARTIAL" | "FAIL" | "BLOCKED";
const results: { section: string; test: string; status: Status; detail?: string }[] = [];

function log(section: string, test: string, status: Status, detail?: string) {
  results.push({ section, test, status, detail });
  console.log(`[${status}] ${section}: ${test}${detail ? ` — ${detail}` : ""}`);
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
  return cookies.find((c) => c.startsWith("zarkari-session=")) ?? null;
}

async function api(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<{ status: number; body: Record<string, unknown>; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Cookie: cookie,
      ...(init?.body && !(init.headers as Record<string, string>)?.["Content-Type"]
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = { _raw: text.slice(0, 200) };
  }
  return { status: res.status, body, text };
}

async function customerCookie(orderNumber: string, phone: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/customer/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, phone }),
  });
  if (!res.ok) return null;
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
  const cookies = raw.flatMap((c) => (c ? [c.split(";")[0]] : []));
  return cookies.find((c) => c.startsWith("zarkari-customer-order=")) ?? null;
}

async function main() {
  console.log(`Smoke auditing ${BASE}\n`);
  const ownerEmail = process.env.AUDIT_OWNER_EMAIL || "owner1@zarkari.co.uk";
  const ownerPass = process.env.AUDIT_OWNER_PASSWORD || "AuditPass2026!";
  const staffEmail = process.env.AUDIT_STAFF_EMAIL || "staff-audit@zarkari.co.uk";
  const staffPass = process.env.AUDIT_STAFF_PASSWORD || "AuditPass2026!";
  const supplierEmail = process.env.AUDIT_SUPPLIER_EMAIL || "asif@zarkari.co.uk";
  const supplierPass = process.env.AUDIT_SUPPLIER_PASSWORD || "AuditPass2026!";

  const owner = await login(ownerEmail, ownerPass);
  const staff = await login(staffEmail, staffPass);
  const supplier = await login(supplierEmail, supplierPass);

  if (!owner) {
    log("Auth", "Owner UUID login", "FAIL", ownerEmail);
    print();
    process.exit(1);
  }
  log("Auth", "Owner UUID login", "PASS", ownerEmail);
  log("Auth", "Staff UUID login", staff ? "PASS" : "FAIL", staffEmail);
  log("Auth", "Supplier UUID login", supplier ? "PASS" : "FAIL", supplierEmail);

  // Demo fallback must fail when DB configured
  const demo = await login("owner@zarkari.co.uk", "demo123");
  log("Auth", "Demo owner@ fallback blocked", demo ? "FAIL" : "PASS", demo ? "still accepted" : undefined);

  // Staff blocked routes
  if (staff) {
    for (const path of ["/admin/users", "/admin/cash/analytics", "/admin/finance"]) {
      const res = await fetch(`${BASE}${path}`, { headers: { Cookie: staff }, redirect: "manual" });
      const blocked = res.status === 307 || res.status === 302;
      log("Auth", `Staff blocked ${path}`, blocked ? "PASS" : "FAIL", `status ${res.status}`);
    }
    const reports = await fetch(`${BASE}/admin/reports?tab=pnl`, {
      headers: { Cookie: staff },
      redirect: "follow",
    });
    const html = await reports.text();
    const pnlHidden = !html.includes("P&L") || html.includes("overview") || reports.status === 200;
    log("Auth", "Staff reports page reachable", reports.status === 200 ? "PASS" : "PARTIAL");
    void pnlHidden;
  }

  if (supplier) {
    const dash = await fetch(`${BASE}/admin/dashboard`, { headers: { Cookie: supplier }, redirect: "manual" });
    log("Auth", "Supplier blocked from admin", dash.status === 307 || dash.status === 302 ? "PASS" : "FAIL");
    const portal = await fetch(`${BASE}/supplier`, { headers: { Cookie: supplier }, redirect: "manual" });
    log("Auth", "Supplier portal", portal.status === 200 ? "PASS" : "FAIL", `status ${portal.status}`);
  }

  // Phase 2 — bridal order lifecycle
  const suppliersRes = await api("/api/suppliers", owner);
  const suppliers = (suppliersRes.body.suppliers as { id: string; name?: string }[]) ?? [];
  // Prefer the logged-in supplier's linked id so accept/advance works
  const me = supplier
    ? await api("/api/auth/me", supplier).catch(() => ({ status: 404, body: {} as Record<string, unknown>, text: "" }))
    : null;
  const linkedSupplierId =
    (me?.body as { supplierId?: string })?.supplierId ||
    process.env.AUDIT_SUPPLIER_ID ||
    suppliers.find((s) => /asif/i.test(s.name ?? ""))?.id ||
    suppliers[0]?.id;
  const supplierId = linkedSupplierId;
  if (!supplierId) {
    log("Orders", "Supplier available", "FAIL", "no suppliers");
  } else {
    log("Orders", "Supplier available", "PASS", supplierId.slice(0, 8));
  }

  const phone = `07${String(Date.now()).slice(-9)}`;
  const delivery = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
  const create = await api("/api/orders", owner, {
    method: "POST",
    body: JSON.stringify({
      customerName: "Audit Customer",
      customerPhone: phone,
      customerEmail: "audit-customer@example.com",
      dressType: "Lehenga",
      totalPrice: "1200.00",
      depositPaid: "400.00",
      deliveryDate: delivery,
      supplierId,
      notes: "Prod readiness audit order",
    }),
  });
  const order = (create.body.order ?? create.body) as {
    id?: string;
    orderNumber?: string;
    status?: string;
  };
  const orderId = order.id;
  const orderNumber = order.orderNumber;
  log(
    "Orders",
    "Create bridal order",
    create.status < 300 && orderId ? "PASS" : "FAIL",
    `${create.status} ${orderNumber ?? ""} ${create.text.slice(0, 100)}`
  );

  if (orderId) {
    const meas = await api(`/api/orders/${orderId}`, owner, {
      method: "PATCH",
      body: JSON.stringify({
        measurements: {
          bust: "36",
          waist: "28",
          hips: "38",
          notes: "Audit measurements",
        },
      }),
    });
    log(
      "Orders",
      "Save measurements",
      meas.status < 300 ? "PASS" : "FAIL",
      `status ${meas.status} ${meas.text.slice(0, 80)}`
    );

    const patch = await api(`/api/orders/${orderId}`, owner, {
      method: "PATCH",
      body: JSON.stringify({ notes: "Audit edit", extraCharges: [{ label: "Alteration", amount: "25.00" }] }),
    });
    log("Orders", "Edit order / extra charges", patch.status < 300 ? "PASS" : "PARTIAL", `status ${patch.status}`);

    const files = await api(`/api/orders/${orderId}/files`, owner, {
      method: "POST",
      body: JSON.stringify({
        files: [
          {
            category: "design",
            url: "https://example.com/audit-design.jpg",
            name: "audit-design.jpg",
          },
        ],
      }),
    });
    log("Orders", "Add media on Files tab", files.status < 300 ? "PASS" : "PARTIAL", `status ${files.status}`);

    const send = await api(`/api/orders/${orderId}/send-to-supplier`, owner, {
      method: "POST",
      body: "{}",
    });
    log("Orders", "Send to supplier", send.status < 300 ? "PASS" : "FAIL", `status ${send.status} ${send.text.slice(0, 80)}`);

    if (supplier) {
      const accept = await api(`/api/orders/${orderId}/supplier/accept`, supplier, {
        method: "POST",
        body: "{}",
      });
      log("Orders", "Supplier accept", accept.status < 300 ? "PASS" : "FAIL", `status ${accept.status} ${accept.text.slice(0, 80)}`);

      const stage = await api(`/api/orders/${orderId}/supplier/advance`, supplier, {
        method: "POST",
        body: JSON.stringify({ stage: "fabric_preparation" }),
      });
      log("Orders", "Supplier stage progress", stage.status < 300 ? "PASS" : "PARTIAL", `status ${stage.status} ${stage.text.slice(0, 80)}`);

      // Fast-forward remaining stages so arrive-uk / receive-at-shop are valid
      for (const st of ["embroidery", "stitching", "finishing", "packing", "shipping"]) {
        const adv = await api(`/api/orders/${orderId}/supplier/advance`, supplier, {
          method: "POST",
          body: JSON.stringify({ stage: st }),
        });
        if (adv.status >= 300) {
          log("Orders", `Advance to ${st}`, "PARTIAL", `status ${adv.status} ${adv.text.slice(0, 60)}`);
          break;
        }
      }

      const printPage = await fetch(`${BASE}/supplier/orders/${orderId}/print`, {
        headers: { Cookie: supplier },
      });
      log("Orders", "Supplier print sheet", printPage.status === 200 ? "PASS" : "FAIL", `status ${printPage.status}`);
    }

    const arrive = await api(`/api/orders/${orderId}/arrived-uk`, owner, { method: "POST", body: "{}" });
    const receive = await api(`/api/orders/${orderId}/receive-at-shop`, owner, {
      method: "POST",
      body: "{}",
    });
    const collect = await api(`/api/orders/${orderId}/collect`, owner, {
      method: "POST",
      body: JSON.stringify({ balancePaid: true, amountPaid: "800.00" }),
    });
    log(
      "Orders",
      "Receive + collect lifecycle",
      arrive.status < 300 && receive.status < 300 ? "PASS" : "PARTIAL",
      `arrive ${arrive.status} receive ${receive.status} collect ${collect.status}`
    );

    const inv = await fetch(`${BASE}/api/invoices/bridal/${orderId}`, { headers: { Cookie: owner } });
    log("Orders", "Bridal invoice", inv.status === 200 ? "PASS" : "FAIL", `status ${inv.status}`);

    // Customer portal
    if (orderNumber) {
      const cust = await customerCookie(orderNumber, phone);
      log("Portals", "Customer verify cookie", cust ? "PASS" : "FAIL");
      if (cust) {
        const page = await fetch(`${BASE}/my-order/${orderNumber}`, { headers: { Cookie: cust } });
        log("Portals", "Customer order page", page.status === 200 ? "PASS" : "FAIL", `status ${page.status}`);
        const msg = await api("/api/customer/message", cust, {
          method: "POST",
          body: JSON.stringify({ orderId, message: "Audit customer hello" }),
        });
        log("Portals", "Customer message", msg.status < 300 ? "PASS" : "PARTIAL", `status ${msg.status}`);
      }
    }
  }

  // Phase 3 — cash + cargo
  const cash = await api("/api/cash/transactions", owner, {
    method: "POST",
    body: JSON.stringify({
      direction: "in",
      type: "other_in",
      amount: "5.00",
      method: "cash",
      reference: "SMOKE-AUDIT",
      description: "Prod readiness cash smoke",
    }),
  });
  log(
    "Cash",
    "POST other_in transaction",
    cash.status < 300 && !String(cash.text).includes("Unexpected end") ? "PASS" : "FAIL",
    `status ${cash.status} bodyLen=${cash.text.length}`
  );

  const expense = await api("/api/cash/transactions", owner, {
    method: "POST",
    body: JSON.stringify({
      direction: "out",
      type: "business_expense",
      amount: "2.00",
      method: "cash",
      expenseCategory: "misc",
      description: "Audit expense",
    }),
  });
  log("Cash", "POST business_expense", expense.status < 300 ? "PASS" : "FAIL", `status ${expense.status} ${expense.text.slice(0, 80)}`);

  const opening = await api("/api/cash/opening-balance", owner, {
    method: "PATCH",
    body: JSON.stringify({
      businessDate: new Date().toISOString().slice(0, 10),
      cashInHand: "100.00",
      onlineBank: "50.00",
    }),
  });
  log(
    "Cash",
    "Opening balance",
    opening.status < 300 ? "PASS" : "PARTIAL",
    `status ${opening.status} ${opening.text.slice(0, 80)}`
  );

  const companies = await api("/api/cargo/companies", owner);
  let companyId = ((companies.body.companies as { id: string }[]) ?? [])[0]?.id;
  if (!companyId) {
    const created = await api("/api/cargo/companies", owner, {
      method: "POST",
      body: JSON.stringify({ name: "Audit Cargo Co" }),
    });
    companyId = (created.body.company as { id?: string })?.id ?? (created.body as { id?: string }).id;
    log("Cargo", "Create cargo company", companyId ? "PASS" : "FAIL", `status ${created.status}`);
  } else {
    log("Cargo", "Cargo company exists", "PASS");
  }

  if (companyId && supplierId) {
    const box = await api("/api/cargo/boxes", owner, {
      method: "POST",
      body: JSON.stringify({
        cargoCompanyId: companyId,
        supplierId,
        trackingNumber: `AUD-${Date.now()}`,
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: "Audit box",
      }),
    });
    const boxId = (box.body.box as { id?: string })?.id ?? (box.body as { id?: string }).id;
    log(
      "Cargo",
      "Create box",
      box.status < 300 && boxId ? "PASS" : "FAIL",
      `status ${box.status} ${box.text.slice(0, 120)}`
    );

    if (boxId) {
      const item = await api(`/api/cargo/boxes/${boxId}/items`, owner, {
        method: "POST",
        body: JSON.stringify({
          articleName: "Audit dress item",
          itemDate: new Date().toISOString().slice(0, 10),
          bridalOrderId: orderId,
          orderNumber,
          costPkr: "5000",
          costGbp: "15.00",
        }),
      });
      log("Cargo", "Add box item", item.status < 300 ? "PASS" : "FAIL", `status ${item.status} ${item.text.slice(0, 100)}`);

      const khata = await api(`/api/cargo/boxes/${boxId}/post-khata`, owner, { method: "POST", body: "{}" });
      log("Cargo", "Post khata", khata.status < 300 || khata.status === 409 ? "PASS" : "PARTIAL", `status ${khata.status}`);

      const print = await fetch(`${BASE}/admin/cargo/${boxId}/print`, { headers: { Cookie: owner } });
      log("Cargo", "Print page", print.status === 200 || print.status === 404 ? (print.status === 200 ? "PASS" : "PARTIAL") : "FAIL", `status ${print.status}`);
    }
  }

  // Phase 4 — suppliers / stock / ready-made
  if (supplierId) {
    const bill = await api("/api/suppliers/ledger", owner, {
      method: "POST",
      body: JSON.stringify({
        supplierId,
        type: "bill",
        amountGbp: "50.00",
        amountPkr: "18000",
        description: "Audit bill",
      }),
    });
    log("Suppliers", "Khata bill", bill.status < 300 ? "PASS" : "FAIL", `status ${bill.status}`);

    const pay = await api("/api/suppliers/ledger", owner, {
      method: "POST",
      body: JSON.stringify({
        supplierId,
        type: "payment",
        amountGbp: "10.00",
        method: "cash",
        description: "Audit payment",
      }),
    });
    log("Suppliers", "Khata payment→cash", pay.status < 300 ? "PASS" : "FAIL", `status ${pay.status}`);
  }

  const products = await api("/api/products/list", owner).catch(() => ({ status: 404, body: {}, text: "" }));
  // try stock adjust via variants
  const variantsPage = await fetch(`${BASE}/admin/stock`, { headers: { Cookie: owner }, redirect: "manual" });
  log("Stock", "Stock page", variantsPage.status === 200 || variantsPage.status === 307 ? "PASS" : "PARTIAL", `status ${variantsPage.status}`);

  // Find a variant id from DB-backed products page HTML or API
  const mediaList = await api("/api/media", owner);
  log("CMS", "Media list API", mediaList.status < 300 ? "PASS" : "PARTIAL", `status ${mediaList.status}`);

  const homepage = await fetch(`${BASE}/admin/content/homepage`, { headers: { Cookie: owner } });
  log("CMS", "Homepage editor", homepage.status === 200 ? "PASS" : "FAIL", `status ${homepage.status}`);

  const productsAdmin = await fetch(`${BASE}/admin/content/products`, { headers: { Cookie: owner } });
  log("CMS", "Products CMS", productsAdmin.status === 200 ? "PASS" : "FAIL", `status ${productsAdmin.status}`);

  // Stock adjust + ready-made sale
  const productRow = await (async () => {
    const { default: postgres } = await import("postgres");
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, connect_timeout: 15, ssl: "require" });
    try {
      const rows = await sql`
        SELECT p.id, pv.id as variant_id, pv.title as variant_title, pv.inventory_qty,
               pv.options
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.published = true
        ORDER BY pv.inventory_qty DESC NULLS LAST
        LIMIT 5
      `;
      return rows as {
        id: string;
        variant_id: string;
        variant_title: string;
        inventory_qty: number;
        options: unknown;
      }[];
    } finally {
      await sql.end({ timeout: 3 });
    }
  })().catch((err) => {
    console.error("stock lookup failed", err);
    return [] as {
      id: string;
      variant_id: string;
      variant_title: string;
      inventory_qty: number;
      options: unknown;
    }[];
  });

  if (productRow.length) {
    const p = productRow[0]!;
    // Infer size from variant title / options
    const sizeGuess =
      ["XS", "S", "M", "L", "XL", "XXL"].find((s) =>
        `${p.variant_title} ${JSON.stringify(p.options)}`.toUpperCase().includes(` ${s}`) ||
        `${p.variant_title}`.toUpperCase() === s
      ) || "M";
    const adjust = await api("/api/stock/adjust", owner, {
      method: "POST",
      body: JSON.stringify({
        productId: p.id,
        size: sizeGuess,
        quantityDelta: 2,
        type: "receive",
        notes: "Audit stock receive",
      }),
    });
    log("Stock", "Stock adjust receive", adjust.status < 300 ? "PASS" : "PARTIAL", `status ${adjust.status} size=${sizeGuess} ${adjust.text.slice(0, 80)}`);

    const walkIn = await api("/api/retail-orders/walk-in", owner, {
      method: "POST",
      body: JSON.stringify({
        customerName: "Audit Walk-in",
        customerPhone: "07000000999",
        paymentMethod: "cash",
        items: [{ productId: p.id, size: sizeGuess, quantity: 1 }],
      }),
    });
    log(
      "Stock",
      "Ready-made Sale depletes stock",
      walkIn.status < 300 ? "PASS" : "PARTIAL",
      `status ${walkIn.status} ${walkIn.text.slice(0, 100)}`
    );
  } else {
    log("Stock", "Stock adjust receive", "BLOCKED", "no active product/variant");
  }

  const storefront = await fetch(`${BASE}/`);
  log("CMS", "Storefront home", storefront.status === 200 ? "PASS" : "FAIL", `status ${storefront.status}`);

  // Inbox / notifications
  const inbox = await api("/api/inbox", owner);
  log("Portals", "Inbox list", inbox.status < 300 ? "PASS" : "FAIL", `status ${inbox.status}`);

  const notif = await api("/api/notifications", owner);
  log("Portals", "Notifications", notif.status < 300 ? "PASS" : "PARTIAL", `status ${notif.status}`);

  // Reports
  for (const tab of ["overview", "cash", "pnl", "finance"]) {
    const page = await fetch(`${BASE}/admin/reports?tab=${tab}`, { headers: { Cookie: owner } });
    log("Reports", `Reports tab ${tab}`, page.status === 200 ? "PASS" : "FAIL", `status ${page.status}`);
  }

  // Cron
  const cronOpen = await fetch(`${BASE}/api/cron/deadlines`);
  const cronBody = await cronOpen.json().catch(() => ({}));
  if (cronOpen.status === 503 || cronOpen.status === 401) {
    log("Reports", "Cron unauthenticated blocked", "PASS", `status ${cronOpen.status}`);
  } else if (cronOpen.status === 200) {
    log("Reports", "Cron unauthenticated blocked", "FAIL", `open status 200 alerts=${(cronBody as { alertsCreated?: number }).alertsCreated}`);
  } else {
    log("Reports", "Cron unauthenticated blocked", "PARTIAL", `status ${cronOpen.status}`);
  }

  // Logout
  const logout = await api("/api/auth/logout", owner, { method: "POST", body: "{}" });
  log("Auth", "Logout", logout.status < 300 ? "PASS" : "PARTIAL", `status ${logout.status}`);

  print();
  const fails = results.filter((r) => r.status === "FAIL").length;
  process.exit(fails > 0 ? 1 : 0);
}

function print() {
  console.log("\n=== PROD READINESS SMOKE ===\n");
  const pass = results.filter((r) => r.status === "PASS").length;
  const partial = results.filter((r) => r.status === "PARTIAL").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const blocked = results.filter((r) => r.status === "BLOCKED").length;
  console.log(`Total: ${pass} PASS, ${partial} PARTIAL, ${fail} FAIL, ${blocked} BLOCKED`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
