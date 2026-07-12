#!/usr/bin/env tsx
/**
 * Wipe all operational/test data for live cutover.
 * Keeps: users, suppliers, CMS/catalog, shop settings, cargo companies, media, blog.
 *
 * Usage: CONFIRM=1 npm run db:wipe-ops
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

async function main() {
  if (process.env.CONFIRM !== "1" && !process.argv.includes("--yes")) {
    console.error("Refusing to wipe ops data without CONFIRM=1 or --yes");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const safeUrl = url.replace(/:[^:@/]+@/, ":***@");
  console.log(`Wiping operational data on: ${safeUrl}`);
  console.log("Keeping: users, suppliers, catalog, CMS, settings, cargo companies, media, blog\n");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  async function wipe(label: string, table: Parameters<typeof db.delete>[0]) {
    const deleted = await db.delete(table).returning();
    console.log(`  ${label}: deleted ${deleted.length}`);
  }

  console.log("Deleting cargo box contents…");
  await wipe("cargo_box_items", schema.cargoBoxItems);
  await wipe("cargo_boxes", schema.cargoBoxes);

  console.log("Deleting supplier ledger…");
  await wipe("supplier_ledger_entries", schema.supplierLedgerEntries);

  console.log("Deleting cash ledger…");
  await wipe("cash_transactions", schema.cashTransactions);
  await wipe("cash_opening_balances", schema.cashOpeningBalances);

  console.log("Deleting notifications & inbox…");
  await wipe("notifications", schema.notifications);
  await wipe("social_messages", schema.socialMessages);
  await wipe("social_threads", schema.socialThreads);

  console.log("Deleting bridal order children…");
  await wipe("customer_messages", schema.customerMessages);
  await wipe("order_timeline_events", schema.orderTimelineEvents);
  await wipe("order_files", schema.orderFiles);
  await wipe("order_redesigns", schema.orderRedesigns);
  await wipe("order_cancellations", schema.orderCancellations);
  await wipe("order_refunds", schema.orderRefunds);
  await wipe("order_collections", schema.orderCollections);
  await wipe("supplier_completions", schema.supplierCompletions);
  await wipe("bridal_payments", schema.bridalPayments);

  console.log("Deleting bridal & retail orders…");
  await wipe("bridal_orders", schema.bridalOrders);
  await wipe("retail_order_items", schema.retailOrderItems);
  await wipe("retail_orders", schema.retailOrders);

  console.log("Deleting customers…");
  await wipe("customers", schema.customers);

  console.log("Deleting stock movements, audit logs, upload relays…");
  await wipe("stock_movements", schema.stockMovements);
  await wipe("audit_logs", schema.auditLogs);
  await wipe("upload_relay_sessions", schema.uploadRelaySessions);

  const [users] = await db.select({ c: sql<number>`count(*)` }).from(schema.users);
  const [suppliers] = await db.select({ c: sql<number>`count(*)` }).from(schema.suppliers);
  const [products] = await db.select({ c: sql<number>`count(*)` }).from(schema.products);
  console.log(
    `\nKept: ${Number(users?.c ?? 0)} users, ${Number(suppliers?.c ?? 0)} suppliers, ${Number(products?.c ?? 0)} products`
  );
  console.log("Operational wipe complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
