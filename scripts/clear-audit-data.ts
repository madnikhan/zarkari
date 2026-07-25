#!/usr/bin/env tsx
/**
 * Delete identifiable audit/smoke marker rows only.
 * Keeps real ops data, users, suppliers, catalog, and non-audit cargo companies.
 *
 * Usage: CONFIRM=1 npm run db:clear-audit
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

import { eq, ilike, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

const AUDIT_EMAILS = [
  "audit-customer@example.com",
  "audit@test.com",
  "voice-audit@test.com",
];

const AUDIT_NAMES = [
  "Audit Customer",
  "Audit Walk-in",
  "Audit Test",
  "Voice Audit",
  "TCs Test",
];

const AUDIT_CASH_REFS = ["SMOKE-AUDIT", "AUDIT-TEST"];
const AUDIT_CASH_DESCS = [
  "Audit expense",
  "Audit test transaction",
  "Audit payment",
  "Audit bill",
];
const AUDIT_KHATA_DESCS = ["Audit bill", "Audit payment"];
const AUDIT_CARGO_COMPANY = "Audit Cargo Co";

async function main() {
  if (process.env.CONFIRM !== "1" && !process.argv.includes("--yes")) {
    console.error("Refusing to clear audit data without CONFIRM=1 or --yes");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const safeUrl = url.replace(/:[^:@/]+@/, ":***@");
  console.log(`Clearing audit marker data on: ${safeUrl}\n`);

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  async function countDelete(label: string, rows: unknown[]) {
    console.log(`  ${label}: deleted ${rows.length}`);
  }

  const auditCustomers = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(
      or(
        inArray(schema.customers.email, AUDIT_EMAILS),
        inArray(schema.customers.name, AUDIT_NAMES)
      )
    );
  const customerIds = auditCustomers.map((c) => c.id);

  const bridalByCustomer =
    customerIds.length > 0
      ? await db
          .select({ id: schema.bridalOrders.id })
          .from(schema.bridalOrders)
          .where(inArray(schema.bridalOrders.customerId, customerIds))
      : [];
  const orderIds = bridalByCustomer.map((o) => o.id);

  const retailOrders = await db
    .select({ id: schema.retailOrders.id })
    .from(schema.retailOrders)
    .where(
      or(
        inArray(schema.retailOrders.customerEmail, AUDIT_EMAILS),
        inArray(schema.retailOrders.customerName, AUDIT_NAMES)
      )
    );
  const retailIds = retailOrders.map((o) => o.id);

  const auditCompanies = await db
    .select({ id: schema.cargoCompanies.id })
    .from(schema.cargoCompanies)
    .where(
      or(eq(schema.cargoCompanies.name, AUDIT_CARGO_COMPANY), ilike(schema.cargoCompanies.name, "Audit%"))
    );
  const companyIds = auditCompanies.map((c) => c.id);

  const boxesByCompany =
    companyIds.length > 0
      ? await db
          .select({ id: schema.cargoBoxes.id })
          .from(schema.cargoBoxes)
          .where(inArray(schema.cargoBoxes.cargoCompanyId, companyIds))
      : [];
  const boxesByMarker = await db
    .select({ id: schema.cargoBoxes.id })
    .from(schema.cargoBoxes)
    .where(or(eq(schema.cargoBoxes.notes, "Audit box"), ilike(schema.cargoBoxes.trackingNumber, "AUD-%")));
  const boxIds = [...new Set([...boxesByCompany, ...boxesByMarker].map((b) => b.id))];

  console.log("Deleting cargo audit boxes…");
  if (boxIds.length) {
    await countDelete(
      "cargo_box_items (by box)",
      await db.delete(schema.cargoBoxItems).where(inArray(schema.cargoBoxItems.boxId, boxIds)).returning()
    );
    await countDelete(
      "cargo_boxes",
      await db.delete(schema.cargoBoxes).where(inArray(schema.cargoBoxes.id, boxIds)).returning()
    );
  } else {
    console.log("  cargo boxes: deleted 0");
  }

  if (orderIds.length) {
    await countDelete(
      "cargo_box_items (by bridal order)",
      await db
        .delete(schema.cargoBoxItems)
        .where(inArray(schema.cargoBoxItems.bridalOrderId, orderIds))
        .returning()
    );
  }

  if (companyIds.length) {
    await countDelete(
      "cargo_companies",
      await db.delete(schema.cargoCompanies).where(inArray(schema.cargoCompanies.id, companyIds)).returning()
    );
  }

  console.log("Deleting khata / stock / cash markers…");
  await countDelete(
    "supplier_ledger_entries",
    await db
      .delete(schema.supplierLedgerEntries)
      .where(inArray(schema.supplierLedgerEntries.description, AUDIT_KHATA_DESCS))
      .returning()
  );

  await countDelete(
    "stock_movements",
    await db
      .delete(schema.stockMovements)
      .where(eq(schema.stockMovements.notes, "Audit stock receive"))
      .returning()
  );

  const cashConds = [
    inArray(schema.cashTransactions.reference, AUDIT_CASH_REFS),
    inArray(schema.cashTransactions.description, AUDIT_CASH_DESCS),
  ];
  if (orderIds.length) {
    cashConds.push(inArray(schema.cashTransactions.orderId, orderIds));
  }
  await countDelete(
    "cash_transactions",
    await db.delete(schema.cashTransactions).where(or(...cashConds)).returning()
  );

  console.log("Deleting inbox audit threads…");
  const threadsByContact = await db
    .select({ id: schema.socialThreads.id })
    .from(schema.socialThreads)
    .where(inArray(schema.socialThreads.contactName, AUDIT_NAMES));
  const msgHits = await db
    .select({ threadId: schema.socialMessages.threadId })
    .from(schema.socialMessages)
    .where(
      or(
        ilike(schema.socialMessages.body, "%Audit manual inquiry%"),
        ilike(schema.socialMessages.body, "%Audit customer hello%"),
        ilike(schema.socialMessages.body, "%Audit staff update%"),
        ilike(schema.socialMessages.body, "%Audit customer message%")
      )
    );
  const threadIds = [...new Set([...threadsByContact.map((t) => t.id), ...msgHits.map((m) => m.threadId)])];
  if (threadIds.length) {
    await countDelete(
      "social_messages",
      await db.delete(schema.socialMessages).where(inArray(schema.socialMessages.threadId, threadIds)).returning()
    );
    await countDelete(
      "social_threads",
      await db.delete(schema.socialThreads).where(inArray(schema.socialThreads.id, threadIds)).returning()
    );
  } else {
    console.log("  social threads: deleted 0");
  }

  console.log("Deleting bridal / retail audit orders…");
  if (orderIds.length) {
    await countDelete(
      "notifications (by order)",
      await db.delete(schema.notifications).where(inArray(schema.notifications.orderId, orderIds)).returning()
    );
    await countDelete(
      "order_timeline_events",
      await db
        .delete(schema.orderTimelineEvents)
        .where(inArray(schema.orderTimelineEvents.orderId, orderIds))
        .returning()
    );
    await countDelete(
      "order_files",
      await db.delete(schema.orderFiles).where(inArray(schema.orderFiles.orderId, orderIds)).returning()
    );
    await countDelete(
      "order_redesigns",
      await db.delete(schema.orderRedesigns).where(inArray(schema.orderRedesigns.orderId, orderIds)).returning()
    );
    await countDelete(
      "order_cancellations",
      await db
        .delete(schema.orderCancellations)
        .where(inArray(schema.orderCancellations.orderId, orderIds))
        .returning()
    );
    await countDelete(
      "order_refunds",
      await db.delete(schema.orderRefunds).where(inArray(schema.orderRefunds.orderId, orderIds)).returning()
    );
    await countDelete(
      "order_collections",
      await db.delete(schema.orderCollections).where(inArray(schema.orderCollections.orderId, orderIds)).returning()
    );
    await countDelete(
      "supplier_completions",
      await db
        .delete(schema.supplierCompletions)
        .where(inArray(schema.supplierCompletions.orderId, orderIds))
        .returning()
    );
    await countDelete(
      "bridal_payments",
      await db.delete(schema.bridalPayments).where(inArray(schema.bridalPayments.orderId, orderIds)).returning()
    );
    await countDelete(
      "customer_messages",
      await db.delete(schema.customerMessages).where(inArray(schema.customerMessages.orderId, orderIds)).returning()
    );
    await countDelete(
      "bridal_orders",
      await db.delete(schema.bridalOrders).where(inArray(schema.bridalOrders.id, orderIds)).returning()
    );
  } else {
    console.log("  bridal_orders: deleted 0");
  }

  if (retailIds.length) {
    await countDelete(
      "retail_order_items",
      await db.delete(schema.retailOrderItems).where(inArray(schema.retailOrderItems.orderId, retailIds)).returning()
    );
    await countDelete(
      "retail_orders",
      await db.delete(schema.retailOrders).where(inArray(schema.retailOrders.id, retailIds)).returning()
    );
  } else {
    console.log("  retail_orders: deleted 0");
  }

  if (customerIds.length) {
    const stillLinked = await db
      .select({ customerId: schema.bridalOrders.customerId })
      .from(schema.bridalOrders)
      .where(inArray(schema.bridalOrders.customerId, customerIds));
    const linked = new Set(stillLinked.map((r) => r.customerId));
    const orphanIds = customerIds.filter((id) => !linked.has(id));
    if (orphanIds.length) {
      await countDelete(
        "customers",
        await db.delete(schema.customers).where(inArray(schema.customers.id, orphanIds)).returning()
      );
    } else {
      console.log("  customers: deleted 0 (still linked)");
    }
  } else {
    console.log("  customers: deleted 0");
  }

  console.log("\nAudit marker data removed.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
