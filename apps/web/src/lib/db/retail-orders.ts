import { desc, eq } from "drizzle-orm";
import type { RetailOrder } from "@/lib/data/seed";
import { getDb, schema } from "./index";

export async function findRetailOrderByStripeSession(sessionId: string): Promise<RetailOrder | null> {
  const db = getDb();
  if (!db) return null;

  const [order] = await db
    .select()
    .from(schema.retailOrders)
    .where(eq(schema.retailOrders.stripeSessionId, sessionId))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(schema.retailOrderItems)
    .where(eq(schema.retailOrderItems.orderId, order.id));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName ?? undefined,
    status: order.status,
    total: order.total,
    items: items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: i.price,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

export async function createRetailOrderDb(input: {
  customerEmail: string;
  customerName?: string;
  items: { title: string; quantity: number; price: string; variantId?: string; productId?: string }[];
  stripeSessionId?: string;
}): Promise<RetailOrder | null> {
  const db = getDb();
  if (!db) return null;

  if (input.stripeSessionId) {
    const existing = await findRetailOrderByStripeSession(input.stripeSessionId);
    if (existing) return existing;
  }

  const subtotal = input.items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const total = subtotal.toFixed(2);
  const orderNumber = `RT-${Date.now().toString().slice(-8)}`;

  const [order] = await db
    .insert(schema.retailOrders)
    .values({
      orderNumber,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      status: "paid",
      subtotal: total,
      total,
      stripeSessionId: input.stripeSessionId,
    })
    .returning();

  if (input.items.length) {
    await db.insert(schema.retailOrderItems).values(
      input.items.map((item) => ({
        orderId: order.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        variantId: item.variantId ?? null,
        productId: item.productId ?? null,
      }))
    );
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName ?? undefined,
    status: order.status,
    total: order.total,
    items: input.items,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function listRetailOrdersDb(): Promise<RetailOrder[]> {
  const db = getDb();
  if (!db) return [];

  const orders = await db.select().from(schema.retailOrders).orderBy(desc(schema.retailOrders.createdAt));

  const result: RetailOrder[] = [];
  for (const order of orders) {
    const items = await db
      .select()
      .from(schema.retailOrderItems)
      .where(eq(schema.retailOrderItems.orderId, order.id));
    result.push({
      id: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName ?? undefined,
      status: order.status,
      total: order.total,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
      createdAt: order.createdAt.toISOString(),
    });
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
