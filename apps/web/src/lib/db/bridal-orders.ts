import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  BridalOrder,
  BridalStatus,
  Customer,
  Supplier,
  TimelineEvent,
  OrderFile,
  OrderRedesign,
  OrderCancellation,
  OrderRefund,
  OrderCollection,
} from "@/lib/data/seed";
import { getDb, schema } from "./index";

function mapOrder(row: typeof schema.bridalOrders.$inferSelect): BridalOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.customerId,
    supplierId: row.supplierId ?? undefined,
    status: row.status as BridalStatus,
    bookingDate: row.bookingDate.toISOString(),
    deliveryDate: row.deliveryDate.toISOString(),
    totalPrice: row.totalPrice,
    depositPaid: row.depositPaid ?? "0",
    remainingBalance: row.remainingBalance,
    dressType: row.dressType ?? undefined,
    colour: row.colour ?? undefined,
    size: row.size ?? undefined,
    comments: row.comments ?? undefined,
    customisationNotes: row.customisationNotes ?? undefined,
    filesUnlockedAt: row.filesUnlockedAt?.toISOString(),
    supplierLocked: row.supplierLocked,
    createdById: row.createdById ?? undefined,
  };
}

export async function listBridalOrdersDb(filters?: {
  supplierId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BridalOrder[]> {
  const db = getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.supplierId) conditions.push(eq(schema.bridalOrders.supplierId, filters.supplierId));
  if (filters?.status) conditions.push(eq(schema.bridalOrders.status, filters.status as BridalStatus));

  let query = db
    .select()
    .from(schema.bridalOrders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.bridalOrders.bookingDate));

  if (filters?.limit) query = query.limit(filters.limit) as typeof query;
  if (filters?.offset) query = query.offset(filters.offset) as typeof query;

  const rows = await query;
  return rows.map(mapOrder);
}

export async function getBridalOrderDb(id: string): Promise<BridalOrder | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.bridalOrders).where(eq(schema.bridalOrders.id, id)).limit(1);
  return row ? mapOrder(row) : null;
}

export async function getBridalOrderByNumberDb(orderNumber: string): Promise<BridalOrder | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.bridalOrders)
    .where(eq(schema.bridalOrders.orderNumber, orderNumber))
    .limit(1);
  return row ? mapOrder(row) : null;
}

export async function nextBridalOrderNumberDb(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `BR-${year}-`;
  if (!db) return `${prefix}${String(Date.now()).slice(-4)}`;

  const [latest] = await db
    .select({ orderNumber: schema.bridalOrders.orderNumber })
    .from(schema.bridalOrders)
    .where(ilike(schema.bridalOrders.orderNumber, `${prefix}%`))
    .orderBy(desc(schema.bridalOrders.orderNumber))
    .limit(1);

  if (!latest) return `${prefix}0001`;
  const seq = parseInt(latest.orderNumber.slice(prefix.length), 10);
  const next = Number.isFinite(seq) ? seq + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function searchBridalOrdersDb(query: string): Promise<BridalOrder[]> {
  const db = getDb();
  if (!db) return [];
  const q = `%${query.trim()}%`;
  const rows = await db
    .select({ order: schema.bridalOrders })
    .from(schema.bridalOrders)
    .leftJoin(schema.customers, eq(schema.bridalOrders.customerId, schema.customers.id))
    .where(
      or(
        ilike(schema.bridalOrders.orderNumber, q),
        ilike(schema.customers.name, q),
        ilike(schema.customers.phone, q),
        ilike(sql`${schema.bridalOrders.status}::text`, q)
      )
    )
    .orderBy(desc(schema.bridalOrders.bookingDate))
    .limit(50);
  return rows.map((r) => mapOrder(r.order));
}

export async function createBridalOrderDb(input: {
  orderNumber: string;
  customerId: string;
  supplierId?: string;
  dressType?: string;
  colour?: string;
  size?: string;
  totalPrice: string;
  depositPaid: string;
  remainingBalance: string;
  deliveryDate: string;
  customisationNotes?: string;
  createdById?: string;
}): Promise<BridalOrder | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.bridalOrders)
    .values({
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      supplierId: input.supplierId ?? null,
      status: "order_created",
      deliveryDate: new Date(input.deliveryDate),
      totalPrice: input.totalPrice,
      depositPaid: input.depositPaid,
      remainingBalance: input.remainingBalance,
      dressType: input.dressType ?? null,
      colour: input.colour ?? null,
      size: input.size ?? null,
      customisationNotes: input.customisationNotes ?? null,
      createdById: input.createdById ?? null,
    })
    .returning();
  return row ? mapOrder(row) : null;
}

export async function countBridalOrdersDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(schema.bridalOrders);
  return Number(rows[0]?.count ?? 0);
}

export async function countSampleOrdersDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.bridalOrders)
    .where(ilike(schema.bridalOrders.orderNumber, "SAMPLE-%"));
  return Number(rows[0]?.count ?? 0);
}

export async function getOrderFilesDb(orderId: string): Promise<OrderFile[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.orderFiles).where(eq(schema.orderFiles.orderId, orderId));
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    category: row.category,
    fileName: row.fileName,
    url: row.url,
  }));
}

export async function addOrderFileDb(
  orderId: string,
  input: { category: string; fileName: string; url: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderFiles).values({
    orderId,
    category: input.category,
    fileName: input.fileName,
    url: input.url,
  });
}

export async function listRedesignsDb(): Promise<OrderRedesign[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.orderRedesigns).orderBy(desc(schema.orderRedesigns.createdAt));
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    reason: row.reason,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getRedesignsDb(orderId: string): Promise<OrderRedesign[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.orderRedesigns).where(eq(schema.orderRedesigns.orderId, orderId));
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    reason: row.reason,
    comment: row.comment ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addRedesignDb(
  orderId: string,
  input: { reason: string; comment?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderRedesigns).values({
    orderId,
    reason: input.reason,
    comment: input.comment ?? null,
  });
}

export async function getCancellationsDb(orderId?: string): Promise<OrderCancellation[]> {
  const db = getDb();
  if (!db) return [];
  const rows = orderId
    ? await db.select().from(schema.orderCancellations).where(eq(schema.orderCancellations.orderId, orderId))
    : await db.select().from(schema.orderCancellations);
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    reason: row.reason,
    comment: row.comment ?? undefined,
    cancelledByRole: row.cancelledByRole,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addCancellationDb(
  orderId: string,
  input: { reason: string; comment?: string; cancelledByRole: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderCancellations).values({
    orderId,
    reason: input.reason,
    comment: input.comment ?? null,
    cancelledByRole: input.cancelledByRole,
  });
}

export async function getRefundsDb(orderId?: string): Promise<OrderRefund[]> {
  const db = getDb();
  if (!db) return [];
  const rows = orderId
    ? await db.select().from(schema.orderRefunds).where(eq(schema.orderRefunds.orderId, orderId))
    : await db.select().from(schema.orderRefunds);
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    reason: row.reason,
    amount: row.amount,
    paymentMethod: row.paymentMethod ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addRefundDb(
  orderId: string,
  input: { reason: string; amount: string; paymentMethod?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderRefunds).values({
    orderId,
    reason: input.reason,
    amount: input.amount,
    paymentMethod: input.paymentMethod ?? null,
    refundDate: new Date(),
  });
}

export async function getCollectionRecordDb(orderId: string): Promise<OrderCollection | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.orderCollections)
    .where(eq(schema.orderCollections.orderId, orderId))
    .limit(1);
  return row
    ? {
        id: row.id,
        orderId: row.orderId,
        collectionDate: row.collectionDate.toISOString(),
        balancePaid: row.balancePaid,
        amountPaid: row.amountPaid ?? undefined,
        alterationNotes: row.alterationNotes ?? undefined,
      }
    : null;
}

export async function addCollectionDb(
  orderId: string,
  input: { balancePaid: boolean; amountPaid?: string; alterationNotes?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderCollections).values({
    orderId,
    collectionDate: new Date(),
    balancePaid: input.balancePaid,
    amountPaid: input.amountPaid ?? null,
    alterationNotes: input.alterationNotes ?? null,
  });
}

export async function addSupplierCompletionDb(
  orderId: string,
  input: { deliveryDate: string; billNumber: string; courierName?: string; trackingNumber?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.supplierCompletions).values({
    orderId,
    deliveryDate: new Date(input.deliveryDate),
    billNumber: input.billNumber,
    courierName: input.courierName ?? null,
    trackingNumber: input.trackingNumber ?? null,
  });
}

export async function updateBridalOrderDb(
  id: string,
  patch: Partial<{
    status: BridalStatus;
    filesUnlockedAt: Date;
    supplierLocked: boolean;
    remainingBalance: string;
    depositPaid: string;
  }>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(schema.bridalOrders)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.bridalOrders.id, id));
}

export async function createCustomerDb(input: Omit<Customer, "id">): Promise<Customer | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.customers)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? null,
    })
    .returning();
  return row
    ? { id: row.id, name: row.name, phone: row.phone, email: row.email ?? undefined, address: row.address ?? undefined }
    : null;
}

export async function getCustomerDb(id: string): Promise<Customer | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
  return row
    ? { id: row.id, name: row.name, phone: row.phone, email: row.email ?? undefined, address: row.address ?? undefined }
    : null;
}

export async function listCustomersDb(): Promise<Customer[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.customers).orderBy(schema.customers.name);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
  }));
}

export async function listSuppliersDb(): Promise<Supplier[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.suppliers).where(eq(schema.suppliers.active, true));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
  }));
}

export async function getSupplierDb(id: string): Promise<Supplier | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
  return row
    ? { id: row.id, name: row.name, email: row.email ?? undefined, phone: row.phone ?? undefined }
    : null;
}

export async function getTimelineDb(orderId: string): Promise<TimelineEvent[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.orderTimelineEvents)
    .where(eq(schema.orderTimelineEvents.orderId, orderId))
    .orderBy(schema.orderTimelineEvents.createdAt);
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    eventType: row.eventType,
    comment: row.comment ?? undefined,
    performedByName: row.performedByName ?? undefined,
    performedByRole: row.performedByRole ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addTimelineDb(
  orderId: string,
  eventType: string,
  opts?: { comment?: string; performedByName?: string; performedByRole?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.orderTimelineEvents).values({
    orderId,
    eventType: eventType as typeof schema.orderTimelineEvents.$inferInsert.eventType,
    comment: opts?.comment ?? null,
    performedByName: opts?.performedByName ?? null,
    performedByRole: opts?.performedByRole ?? null,
  });
}

export async function addPaymentDb(
  orderId: string,
  input: { type: string; amount: string; method?: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.bridalPayments).values({
    orderId,
    type: input.type,
    amount: input.amount,
    method: input.method ?? null,
  });
}

export async function getPaymentsDb(orderId: string) {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.bridalPayments)
    .where(eq(schema.bridalPayments.orderId, orderId));
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    type: row.type,
    amount: row.amount,
    method: row.method ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addMessageDb(
  orderId: string,
  input: { senderType: string; senderName?: string; message: string }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.customerMessages).values({
    orderId,
    senderType: input.senderType,
    senderName: input.senderName ?? null,
    message: input.message,
  });
}

export async function getMessagesDb(orderId: string) {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.customerMessages)
    .where(eq(schema.customerMessages.orderId, orderId))
    .orderBy(schema.customerMessages.createdAt);
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    senderType: row.senderType as "customer" | "staff",
    senderName: row.senderName ?? undefined,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  }));
}
