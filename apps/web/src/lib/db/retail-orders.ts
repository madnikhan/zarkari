import { desc, eq, inArray, or, ilike } from "drizzle-orm";
import type { RetailOrder } from "@/lib/data/seed";
import { getDb, schema } from "./index";

type OrderItemInput = {
  title: string;
  quantity: number;
  price: string;
  variantId?: string;
  productId?: string;
  sizeSelection?: {
    mode: "standard" | "custom";
    label: string;
    measurements: Record<string, number>;
  };
};

function mapDbOrder(
  order: typeof schema.retailOrders.$inferSelect,
  items: (typeof schema.retailOrderItems.$inferSelect)[]
): RetailOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail ?? undefined,
    customerName: order.customerName ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    source: (order.source as RetailOrder["source"]) ?? "online",
    paymentMethod: (order.paymentMethod as RetailOrder["paymentMethod"]) ?? undefined,
    status: order.status,
    total: order.total,
    subtotal: order.subtotal,
    items: items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: i.price,
      productId: i.productId ?? undefined,
      variantId: i.variantId ?? undefined,
      ...(i.measurements ? { sizeSelection: i.measurements } : {}),
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

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

  return mapDbOrder(order, items);
}

export async function getRetailOrderByIdDb(id: string): Promise<RetailOrder | null> {
  const db = getDb();
  if (!db) return null;

  const [order] = await db.select().from(schema.retailOrders).where(eq(schema.retailOrders.id, id)).limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(schema.retailOrderItems)
    .where(eq(schema.retailOrderItems.orderId, order.id));

  return mapDbOrder(order, items);
}

export async function createRetailOrderDb(input: {
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  source?: "online" | "walk_in";
  paymentMethod?: "stripe" | "cash" | "card";
  items: OrderItemInput[];
  stripeSessionId?: string;
  status?: string;
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
      customerEmail: input.customerEmail ?? null,
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      source: input.source ?? "online",
      paymentMethod: input.paymentMethod ?? (input.stripeSessionId ? "stripe" : null),
      status: input.status ?? "paid",
      subtotal: total,
      total,
      stripeSessionId: input.stripeSessionId ?? null,
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
        measurements: item.sizeSelection ?? null,
      }))
    );
  }

  return getRetailOrderByIdDb(order.id);
}

export async function listRetailOrdersDb(filters?: {
  source?: "online" | "walk_in";
}): Promise<RetailOrder[]> {
  const db = getDb();
  if (!db) return [];

  const orders = filters?.source
    ? await db
        .select()
        .from(schema.retailOrders)
        .where(eq(schema.retailOrders.source, filters.source))
        .orderBy(desc(schema.retailOrders.createdAt))
    : await db.select().from(schema.retailOrders).orderBy(desc(schema.retailOrders.createdAt));

  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const allItems = await db
    .select()
    .from(schema.retailOrderItems)
    .where(inArray(schema.retailOrderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orders.map((order) => mapDbOrder(order, itemsByOrder.get(order.id) ?? []));
}

export async function searchRetailOrdersDb(query: string): Promise<RetailOrder[]> {
  const db = getDb();
  if (!db || !query.trim()) return [];

  const q = `%${query.trim()}%`;
  const orders = await db
    .select()
    .from(schema.retailOrders)
    .where(
      or(
        ilike(schema.retailOrders.orderNumber, q),
        ilike(schema.retailOrders.customerEmail, q),
        ilike(schema.retailOrders.customerName, q),
        ilike(schema.retailOrders.customerPhone, q)
      )
    )
    .orderBy(desc(schema.retailOrders.createdAt))
    .limit(20);

  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const allItems = await db
    .select()
    .from(schema.retailOrderItems)
    .where(inArray(schema.retailOrderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orders.map((order) => mapDbOrder(order, itemsByOrder.get(order.id) ?? []));
}

export async function updateRetailOrderStatusDb(id: string, status: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const [row] = await db
    .update(schema.retailOrders)
    .set({ status })
    .where(eq(schema.retailOrders.id, id))
    .returning();
  return Boolean(row);
}

export async function getRetailOrderStatusDb(id: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({ status: schema.retailOrders.status })
    .from(schema.retailOrders)
    .where(eq(schema.retailOrders.id, id))
    .limit(1);
  return row?.status ?? null;
}
