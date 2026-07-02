#!/usr/bin/env tsx
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

import { eq, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";
import {
  SAMPLE_CUSTOMERS,
  SAMPLE_ORDERS,
  SAMPLE_OPENING_TODAY,
  SAMPLE_SOCIAL_THREADS,
  SAMPLE_ORDER_PREFIX,
  SAMPLE_RETAIL_PREFIX,
  buildSampleCashHistory,
  occurredAtFromSeed,
  dateString,
  todayNoon,
  sampleRetailNumber,
} from "../apps/web/src/lib/data/sample-dashboard";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const existing = await db
    .select()
    .from(schema.bridalOrders)
    .where(ilike(schema.bridalOrders.orderNumber, `${SAMPLE_ORDER_PREFIX}%`))
    .limit(1);
  if (existing.length) {
    console.log("Sample data already seeded — skipping.");
    await client.end();
    return;
  }

  const [supplier] = await db.select().from(schema.suppliers).limit(1);
  if (!supplier) {
    console.error("Run npm run db:seed first (supplier missing).");
    process.exit(1);
  }

  const users = await db.select().from(schema.users);
  const staffUser = users.find((u) => u.role === "staff") ?? users[0];

  const customerIds: string[] = [];
  for (const c of SAMPLE_CUSTOMERS) {
    const [existingCust] = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.phone, c.phone))
      .limit(1);
    if (existingCust) {
      customerIds.push(existingCust.id);
      continue;
    }
    const [row] = await db
      .insert(schema.customers)
      .values({ name: c.name, phone: c.phone, email: c.email, address: c.address })
      .returning();
    customerIds.push(row.id);
  }
  console.log(`Seeded ${customerIds.length} sample customers.`);

  const orderIds: string[] = [];
  for (const o of SAMPLE_ORDERS) {
    const booking = new Date();
    booking.setUTCDate(booking.getUTCDate() - o.bookingDaysAgo);
    const delivery = new Date();
    delivery.setUTCDate(delivery.getUTCDate() + o.deliveryDaysFromNow);

    const [row] = await db
      .insert(schema.bridalOrders)
      .values({
        orderNumber: o.orderNumber,
        customerId: customerIds[o.customerIndex]!,
        supplierId: supplier.id,
        status: o.status as typeof schema.bridalOrders.$inferInsert.status,
        bookingDate: booking,
        deliveryDate: delivery,
        totalPrice: o.totalPrice,
        depositPaid: o.depositPaid,
        remainingBalance: o.remainingBalance,
        dressType: o.dressType,
        colour: o.colour ?? null,
        size: o.size ?? null,
        customisationNotes: o.customisationNotes ?? null,
        createdById: staffUser?.id ?? null,
      })
      .returning();
    orderIds.push(row.id);

    if (parseFloat(o.depositPaid) > 0) {
      await db.insert(schema.bridalPayments).values({
        orderId: row.id,
        type: "deposit",
        amount: o.depositPaid,
        method: "card",
      });
    }

    await db.insert(schema.orderTimelineEvents).values({
      orderId: row.id,
      eventType: "order_created",
      performedByName: "Staff",
      performedByRole: "staff",
    });
  }
  console.log(`Seeded ${orderIds.length} sample bridal orders.`);

  const flagshipId = orderIds[0];
  if (flagshipId) {
    await db.insert(schema.orderFiles).values([
      { orderId: flagshipId, category: "design", fileName: "design-front.jpg", url: "/catalog/mahnoorz/1.png" },
      { orderId: flagshipId, category: "measurements", fileName: "measurements.pdf", url: "/catalog/guldaan/1.png" },
    ]);
    await db.insert(schema.orderTimelineEvents).values([
      { orderId: flagshipId, eventType: "sent_to_supplier", performedByName: "Staff", performedByRole: "staff" },
      { orderId: flagshipId, eventType: "accepted", performedByName: supplier.name, performedByRole: "supplier" },
      { orderId: flagshipId, eventType: "stage_update", comment: "Embroidery in progress", performedByName: supplier.name, performedByRole: "supplier" },
    ]);
  }

  const refundedIdx = SAMPLE_ORDERS.findIndex((o) => o.status === "refunded");
  if (refundedIdx >= 0) {
    await db.insert(schema.orderRefunds).values({
      orderId: orderIds[refundedIdx]!,
      reason: "Customer changed plans",
      amount: "400.00",
      paymentMethod: "original",
      refundDate: new Date(),
    });
  }

  const redesignIdx = SAMPLE_ORDERS.findIndex((o) => o.status === "stitching");
  if (redesignIdx >= 0) {
    await db.insert(schema.orderRedesigns).values({
      orderId: orderIds[redesignIdx]!,
      reason: "Sleeve length adjustment",
      comment: "Customer requested longer sleeves",
    });
  }

  const today = dateString(todayNoon());
  await db.insert(schema.cashOpeningBalances).values({
    businessDate: today,
    cashInHand: SAMPLE_OPENING_TODAY.cashInHand,
    onlineBank: SAMPLE_OPENING_TODAY.onlineBank,
    isSample: true,
    setByUserId: staffUser?.id ?? null,
  });

  for (const tx of buildSampleCashHistory()) {
    const { businessDate, occurredAt } = occurredAtFromSeed(tx);
    await db.insert(schema.cashTransactions).values({
      direction: tx.direction,
      type: tx.type as typeof schema.cashTransactions.$inferInsert.type,
      amount: tx.amount,
      method: tx.method,
      reference: tx.reference,
      description: tx.description,
      businessDate,
      occurredAt,
      source: "manual",
      isSample: true,
      createdByUserId: staffUser?.id ?? null,
    });
  }
  console.log("Seeded sample cash ledger.");

  for (const t of SAMPLE_SOCIAL_THREADS) {
    const lastAt = new Date(Date.now() - t.hoursAgo * 3600000);
    const [thread] = await db
      .insert(schema.socialThreads)
      .values({
        platform: t.platform,
        externalThreadId: t.externalThreadId,
        contactName: t.contactName,
        contactHandle: "contactHandle" in t ? t.contactHandle : null,
        contactPhone: "contactPhone" in t ? t.contactPhone : null,
        subject: t.subject,
        status: "open",
        unreadCount: 1,
        lastMessageAt: lastAt,
        lastMessagePreview: t.preview,
        updatedAt: lastAt,
      })
      .returning();
    await db.insert(schema.socialMessages).values({
      threadId: thread.id,
      direction: "inbound",
      body: t.preview,
    });
  }
  console.log("Seeded sample social inbox threads.");

  for (const n of [
    { title: "[Sample] New Instagram message", body: "Guldaan size M enquiry", href: "/admin/inbox" },
    { title: "[Sample] Order due this week", body: SAMPLE_ORDERS[3]!.orderNumber, href: "/admin/orders", orderId: orderIds[3] },
    { title: "[Sample] Overdue delivery", body: SAMPLE_ORDERS[6]!.orderNumber, href: "/admin/orders", orderId: orderIds[6] },
  ]) {
    await db.insert(schema.notifications).values({
      title: n.title,
      body: n.body,
      href: n.href,
      orderId: n.orderId ?? null,
      read: false,
    });
  }
  console.log("Seeded sample notifications.");

  const [product] = await db.select().from(schema.products).limit(1);
  const [retail] = await db
    .insert(schema.retailOrders)
    .values({
      orderNumber: sampleRetailNumber(1046),
      customerEmail: "shopper@example.com",
      customerName: "Online Customer",
      status: "paid",
      subtotal: "500.00",
      total: "500.00",
    })
    .returning();
  await db.insert(schema.retailOrderItems).values({
    orderId: retail.id,
    title: product?.title ?? "Maxi Dress",
    quantity: 1,
    price: "500.00",
    productId: product?.id ?? null,
  });
  console.log("Seeded sample retail order.");

  console.log("Done. Open /admin/dashboard and /admin/cash to view sample data.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
