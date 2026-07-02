#!/usr/bin/env tsx
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

import { eq, ilike, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";
import {
  SAMPLE_ORDER_PREFIX,
  SAMPLE_RETAIL_PREFIX,
  SAMPLE_THREAD_PREFIX,
  SAMPLE_CUSTOMER_PHONES,
} from "../apps/web/src/lib/data/sample-dashboard";

async function main() {
  if (process.env.CONFIRM !== "1" && !process.argv.includes("--yes")) {
    console.error("Refusing to clear sample data without CONFIRM=1 or --yes");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const sampleOrders = await db
    .select({ id: schema.bridalOrders.id })
    .from(schema.bridalOrders)
    .where(ilike(schema.bridalOrders.orderNumber, `${SAMPLE_ORDER_PREFIX}%`));
  const orderIds = sampleOrders.map((o) => o.id);

  const sampleRetail = await db
    .select({ id: schema.retailOrders.id })
    .from(schema.retailOrders)
    .where(ilike(schema.retailOrders.orderNumber, `${SAMPLE_RETAIL_PREFIX}%`));
  const retailIds = sampleRetail.map((o) => o.id);

  const sampleThreads = await db
    .select({ id: schema.socialThreads.id })
    .from(schema.socialThreads)
    .where(ilike(schema.socialThreads.externalThreadId, `${SAMPLE_THREAD_PREFIX}%`));
  const threadIds = sampleThreads.map((t) => t.id);

  await db.delete(schema.cashTransactions).where(eq(schema.cashTransactions.isSample, true));
  await db.delete(schema.cashOpeningBalances).where(eq(schema.cashOpeningBalances.isSample, true));
  console.log("Cleared sample cash rows.");

  if (threadIds.length) {
    await db.delete(schema.socialMessages).where(inArray(schema.socialMessages.threadId, threadIds));
    await db.delete(schema.socialThreads).where(inArray(schema.socialThreads.id, threadIds));
    console.log("Cleared sample social threads.");
  }

  if (orderIds.length) {
    await db.delete(schema.notifications).where(inArray(schema.notifications.orderId, orderIds));
    await db.delete(schema.orderTimelineEvents).where(inArray(schema.orderTimelineEvents.orderId, orderIds));
    await db.delete(schema.orderFiles).where(inArray(schema.orderFiles.orderId, orderIds));
    await db.delete(schema.orderRedesigns).where(inArray(schema.orderRedesigns.orderId, orderIds));
    await db.delete(schema.orderCancellations).where(inArray(schema.orderCancellations.orderId, orderIds));
    await db.delete(schema.orderRefunds).where(inArray(schema.orderRefunds.orderId, orderIds));
    await db.delete(schema.orderCollections).where(inArray(schema.orderCollections.orderId, orderIds));
    await db.delete(schema.supplierCompletions).where(inArray(schema.supplierCompletions.orderId, orderIds));
    await db.delete(schema.bridalPayments).where(inArray(schema.bridalPayments.orderId, orderIds));
    await db.delete(schema.customerMessages).where(inArray(schema.customerMessages.orderId, orderIds));
    await db.delete(schema.bridalOrders).where(inArray(schema.bridalOrders.id, orderIds));
    console.log(`Cleared ${orderIds.length} sample bridal orders.`);
  }

  await db.delete(schema.notifications).where(ilike(schema.notifications.title, "[Sample]%"));

  if (retailIds.length) {
    await db.delete(schema.retailOrderItems).where(inArray(schema.retailOrderItems.orderId, retailIds));
    await db.delete(schema.retailOrders).where(inArray(schema.retailOrders.id, retailIds));
    console.log("Cleared sample retail orders.");
  }

  for (const phone of SAMPLE_CUSTOMER_PHONES) {
    const [cust] = await db.select().from(schema.customers).where(eq(schema.customers.phone, phone)).limit(1);
    if (!cust) continue;
    const [remaining] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.bridalOrders)
      .where(eq(schema.bridalOrders.customerId, cust.id));
    if (Number(remaining?.count ?? 0) === 0) {
      await db.delete(schema.customers).where(eq(schema.customers.id, cust.id));
    }
  }
  console.log("Cleared orphan sample customers.");

  console.log("Sample data removed.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
