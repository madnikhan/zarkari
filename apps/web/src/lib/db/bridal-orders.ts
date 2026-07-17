import { and, count, desc, eq, gte, ilike, inArray, lt, lte, notInArray, or, sql } from "drizzle-orm";
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
import {
  normalizeBridalMeasurements,
  type BridalMeasurements,
} from "@/lib/measurements/bridal-form";
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
    measurements: normalizeBridalMeasurements(row.measurements),
    filesUnlockedAt: row.filesUnlockedAt?.toISOString(),
    lastSupplierActionAt: row.lastSupplierActionAt?.toISOString(),
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

const TERMINAL_STATUSES: BridalStatus[] = ["collected", "cancelled", "refunded"];

export async function listActiveBridalOrdersForDeadlinesDb(): Promise<BridalOrder[]> {
  const db = getDb();
  if (!db) return [];

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 86400000);

  const rows = await db
    .select()
    .from(schema.bridalOrders)
    .where(
      and(
        notInArray(schema.bridalOrders.status, TERMINAL_STATUSES),
        lte(schema.bridalOrders.deliveryDate, weekAhead)
      )
    )
    .orderBy(desc(schema.bridalOrders.deliveryDate))
    .limit(200);

  return rows.map(mapOrder);
}

export type BridalOrderWithRelations = BridalOrder & {
  customerName?: string;
  customerPhone?: string;
  supplierName?: string;
};

export type OrdersTab = "active" | "overdue" | "due-week" | "completed" | "cancelled" | "refunded";

function ordersTabCondition(tab: OrdersTab = "active") {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  if (tab === "completed") return eq(schema.bridalOrders.status, "collected");
  if (tab === "cancelled") return eq(schema.bridalOrders.status, "cancelled");
  if (tab === "refunded") return eq(schema.bridalOrders.status, "refunded");
  if (tab === "overdue") {
    return and(
      lte(schema.bridalOrders.deliveryDate, now),
      notInArray(schema.bridalOrders.status, TERMINAL_STATUSES)
    );
  }
  if (tab === "due-week") {
    return and(
      gte(schema.bridalOrders.deliveryDate, now),
      lte(schema.bridalOrders.deliveryDate, weekEnd),
      notInArray(schema.bridalOrders.status, TERMINAL_STATUSES)
    );
  }
  return notInArray(schema.bridalOrders.status, TERMINAL_STATUSES);
}

function mapOrderWithRelations(row: {
  order: typeof schema.bridalOrders.$inferSelect;
  customerName: string | null;
  customerPhone: string | null;
  supplierName: string | null;
}): BridalOrderWithRelations {
  return {
    ...mapOrder(row.order),
    customerName: row.customerName ?? undefined,
    customerPhone: row.customerPhone ?? undefined,
    supplierName: row.supplierName ?? undefined,
  };
}

export type SupplierTab = "new" | "in-progress" | "completed" | "cancelled";

function supplierTabCondition(tab: SupplierTab) {
  if (tab === "new") return eq(schema.bridalOrders.status, "sent_to_supplier");
  if (tab === "completed") return eq(schema.bridalOrders.status, "collected");
  if (tab === "cancelled") {
    return inArray(schema.bridalOrders.status, ["cancelled", "refunded", "supplier_rejected"]);
  }
  return and(
    notInArray(schema.bridalOrders.status, [
      "collected",
      "cancelled",
      "refunded",
      "sent_to_supplier",
      "supplier_rejected",
    ])
  );
}

export async function listBridalOrdersWithRelationsDb(filters: {
  supplierId?: string;
  tab?: OrdersTab;
  supplierTab?: SupplierTab;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
  q?: string;
}): Promise<{ orders: BridalOrderWithRelations[]; total: number }> {
  const db = getDb();
  if (!db) return { orders: [], total: 0 };

  const conditions = [];
  if (filters.supplierId) conditions.push(eq(schema.bridalOrders.supplierId, filters.supplierId));
  if (filters.supplierTab) conditions.push(supplierTabCondition(filters.supplierTab));
  else if (filters.tab) conditions.push(ordersTabCondition(filters.tab));
  else if (filters.activeOnly) conditions.push(notInArray(schema.bridalOrders.status, TERMINAL_STATUSES));
  if (filters.q?.trim()) {
    const pat = `%${filters.q.trim()}%`;
    conditions.push(
      or(ilike(schema.bridalOrders.orderNumber, pat), ilike(schema.customers.name, pat))
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.bridalOrders)
    .innerJoin(schema.customers, eq(schema.bridalOrders.customerId, schema.customers.id))
    .where(whereClause);

  let query = db
    .select({
      order: schema.bridalOrders,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      supplierName: schema.suppliers.name,
    })
    .from(schema.bridalOrders)
    .innerJoin(schema.customers, eq(schema.bridalOrders.customerId, schema.customers.id))
    .leftJoin(schema.suppliers, eq(schema.bridalOrders.supplierId, schema.suppliers.id))
    .where(whereClause)
    .orderBy(desc(schema.bridalOrders.bookingDate));

  if (filters.limit) query = query.limit(filters.limit) as typeof query;
  if (filters.offset) query = query.offset(filters.offset) as typeof query;

  const rows = await query;
  return { orders: rows.map(mapOrderWithRelations), total: Number(countRow?.count ?? 0) };
}

export async function getSupplierTabCountsDb(supplierId: string): Promise<{
  new: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}> {
  const db = getDb();
  if (!db) return { new: 0, inProgress: 0, completed: 0, cancelled: 0 };

  const base = eq(schema.bridalOrders.supplierId, supplierId);
  const [[newRow], [inProgressRow], [completedRow], [cancelledRow]] = await Promise.all([
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(base, supplierTabCondition("new"))),
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(base, supplierTabCondition("in-progress"))),
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(base, supplierTabCondition("completed"))),
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(base, supplierTabCondition("cancelled"))),
  ]);

  return {
    new: Number(newRow?.c ?? 0),
    inProgress: Number(inProgressRow?.c ?? 0),
    completed: Number(completedRow?.c ?? 0),
    cancelled: Number(cancelledRow?.c ?? 0),
  };
}

export async function getBridalDashboardStatsDb() {
  const db = getDb();
  if (!db) {
    return {
      totalOrders: 0,
      totalActive: 0,
      dueThisWeek: 0,
      dueToday: 0,
      late: 0,
      cancelled: 0,
      refunded: 0,
      completed: 0,
    };
  }

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const active = notInArray(schema.bridalOrders.status, TERMINAL_STATUSES);

  const [
    [totalRow],
    [activeRow],
    [dueWeekRow],
    [dueTodayRow],
    [lateRow],
    [cancelledRow],
    [refundedRow],
    [completedRow],
  ] = await Promise.all([
    db.select({ c: count() }).from(schema.bridalOrders),
    db.select({ c: count() }).from(schema.bridalOrders).where(active),
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(active, gte(schema.bridalOrders.deliveryDate, now), lte(schema.bridalOrders.deliveryDate, weekEnd))),
    db
      .select({ c: count() })
      .from(schema.bridalOrders)
      .where(and(active, gte(schema.bridalOrders.deliveryDate, todayStart), lte(schema.bridalOrders.deliveryDate, todayEnd))),
    db.select({ c: count() }).from(schema.bridalOrders).where(and(active, lt(schema.bridalOrders.deliveryDate, now))),
    db.select({ c: count() }).from(schema.bridalOrders).where(eq(schema.bridalOrders.status, "cancelled")),
    db.select({ c: count() }).from(schema.bridalOrders).where(eq(schema.bridalOrders.status, "refunded")),
    db.select({ c: count() }).from(schema.bridalOrders).where(eq(schema.bridalOrders.status, "collected")),
  ]);

  return {
    totalOrders: Number(totalRow?.c ?? 0),
    totalActive: Number(activeRow?.c ?? 0),
    dueThisWeek: Number(dueWeekRow?.c ?? 0),
    dueToday: Number(dueTodayRow?.c ?? 0),
    late: Number(lateRow?.c ?? 0),
    cancelled: Number(cancelledRow?.c ?? 0),
    refunded: Number(refundedRow?.c ?? 0),
    completed: Number(completedRow?.c ?? 0),
  };
}

export async function getFinanceSummaryDb() {
  const db = getDb();
  if (!db) {
    return { totalDeposits: 0, totalOutstanding: 0, refundedCount: 0 };
  }

  const [row] = await db
    .select({
      totalDeposits: sql<number>`coalesce(sum(${schema.bridalOrders.depositPaid}::numeric), 0)`,
      totalOutstanding: sql<number>`coalesce(sum(${schema.bridalOrders.remainingBalance}::numeric) filter (where ${schema.bridalOrders.status} not in ('cancelled', 'refunded', 'collected')), 0)`,
      refundedCount: sql<number>`count(*) filter (where ${schema.bridalOrders.status} = 'refunded')`,
    })
    .from(schema.bridalOrders);

  return {
    totalDeposits: Number(row?.totalDeposits ?? 0),
    totalOutstanding: Number(row?.totalOutstanding ?? 0),
    refundedCount: Number(row?.refundedCount ?? 0),
  };
}

export async function getActiveFinanceSummaryDb() {
  const db = getDb();
  if (!db) {
    return { totalDeposits: 0, totalOutstanding: 0 };
  }

  const [row] = await db
    .select({
      totalDeposits: sql<number>`coalesce(sum(${schema.bridalOrders.depositPaid}::numeric) filter (where ${schema.bridalOrders.status} not in ('cancelled', 'refunded')), 0)`,
      totalOutstanding: sql<number>`coalesce(sum(${schema.bridalOrders.remainingBalance}::numeric) filter (where ${schema.bridalOrders.status} not in ('cancelled', 'refunded', 'collected')), 0)`,
    })
    .from(schema.bridalOrders);

  return {
    totalDeposits: Number(row?.totalDeposits ?? 0),
    totalOutstanding: Number(row?.totalOutstanding ?? 0),
  };
}

export type SupplierPerformanceRow = {
  supplierId: string;
  total: number;
  completed: number;
  redesigns: number;
  cancellations: number;
  refunds: number;
  lateDeliveries: number;
  successRate: number;
};

export async function getSupplierPerformanceAllDb(): Promise<SupplierPerformanceRow[]> {
  const db = getDb();
  if (!db) return [];

  const nowIso = new Date().toISOString();
  const rows = await db
    .select({
      supplierId: schema.bridalOrders.supplierId,
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${schema.bridalOrders.status} = 'collected')`,
      redesigns: sql<number>`count(*) filter (where ${schema.bridalOrders.status} = 'redesign_in_progress')`,
      cancellations: sql<number>`count(*) filter (where ${schema.bridalOrders.status} = 'cancelled')`,
      refunds: sql<number>`count(*) filter (where ${schema.bridalOrders.status} = 'refunded')`,
      lateDeliveries: sql<number>`count(*) filter (where ${schema.bridalOrders.deliveryDate} < ${nowIso}::timestamptz and ${schema.bridalOrders.status} <> 'collected')`,
    })
    .from(schema.bridalOrders)
    .where(sql`${schema.bridalOrders.supplierId} is not null`)
    .groupBy(schema.bridalOrders.supplierId);

  return rows
    .filter((r) => r.supplierId)
    .map((r) => {
      const total = Number(r.total ?? 0);
      const completed = Number(r.completed ?? 0);
      return {
        supplierId: r.supplierId!,
        total,
        completed,
        redesigns: Number(r.redesigns ?? 0),
        cancellations: Number(r.cancellations ?? 0),
        refunds: Number(r.refunds ?? 0),
        lateDeliveries: Number(r.lateDeliveries ?? 0),
        successRate: total ? Math.round((completed / total) * 100) : 0,
      };
    });
}

export async function listPaymentsByOrderIdsDb(orderIds: string[]) {
  const db = getDb();
  if (!db || !orderIds.length) return [];
  const rows = await db
    .select()
    .from(schema.bridalPayments)
    .where(inArray(schema.bridalPayments.orderId, orderIds));
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    type: row.type,
    amount: row.amount,
    method: row.method ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listCustomersByIdsDb(ids: string[]): Promise<Customer[]> {
  const db = getDb();
  if (!db || !ids.length) return [];
  const rows = await db.select().from(schema.customers).where(inArray(schema.customers.id, ids));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
  }));
}

export async function listCustomerOrderLinksDb(): Promise<
  { customerId: string; orderId: string; orderNumber: string }[]
> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      customerId: schema.bridalOrders.customerId,
      orderId: schema.bridalOrders.id,
      orderNumber: schema.bridalOrders.orderNumber,
    })
    .from(schema.bridalOrders)
    .orderBy(desc(schema.bridalOrders.bookingDate));
  return rows;
}

export async function listCustomerOrderLinksForCustomersDb(customerIds: string[]): Promise<
  { customerId: string; orderId: string; orderNumber: string }[]
> {
  const db = getDb();
  if (!db || !customerIds.length) return [];
  const rows = await db
    .select({
      customerId: schema.bridalOrders.customerId,
      orderId: schema.bridalOrders.id,
      orderNumber: schema.bridalOrders.orderNumber,
    })
    .from(schema.bridalOrders)
    .where(inArray(schema.bridalOrders.customerId, customerIds))
    .orderBy(desc(schema.bridalOrders.bookingDate));
  return rows;
}

export async function getReportsDataDb(period: "daily" | "weekly" | "monthly" | "yearly") {
  const db = getDb();
  if (!db) {
    return {
      period,
      orderCount: 0,
      revenue: 0,
      outstanding: 0,
      refunds: 0,
      cancellations: 0,
      redesigns: 0,
      late: 0,
    };
  }

  const now = new Date();
  const start = new Date(now);
  if (period === "daily") start.setDate(start.getDate() - 1);
  else if (period === "weekly") start.setDate(start.getDate() - 7);
  else if (period === "monthly") start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);

  const [orderStats] = await db
    .select({
      orderCount: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${schema.bridalOrders.depositPaid}::numeric), 0)`,
      outstanding: sql<number>`coalesce(sum(${schema.bridalOrders.remainingBalance}::numeric) filter (where ${schema.bridalOrders.status} not in ('cancelled', 'refunded', 'collected')), 0)`,
    })
    .from(schema.bridalOrders)
    .where(gte(schema.bridalOrders.bookingDate, start));

  const [lateRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.bridalOrders)
    .where(
      and(
        gte(schema.bridalOrders.bookingDate, start),
        lt(schema.bridalOrders.deliveryDate, now),
        notInArray(schema.bridalOrders.status, ["collected"])
      )
    );

  const [refundCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orderRefunds)
    .where(gte(schema.orderRefunds.createdAt, start));

  const [cancelCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orderCancellations)
    .where(gte(schema.orderCancellations.createdAt, start));

  const [redesignCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orderRedesigns)
    .where(gte(schema.orderRedesigns.createdAt, start));

  return {
    period,
    orderCount: Number(orderStats?.orderCount ?? 0),
    revenue: Number(orderStats?.revenue ?? 0),
    outstanding: Number(orderStats?.outstanding ?? 0),
    refunds: Number(refundCount?.count ?? 0),
    cancellations: Number(cancelCount?.count ?? 0),
    redesigns: Number(redesignCount?.count ?? 0),
    late: Number(lateRow?.count ?? 0),
  };
}

export async function listBridalOrdersForExportDb(since: Date) {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select({
      order: schema.bridalOrders,
      customerName: schema.customers.name,
    })
    .from(schema.bridalOrders)
    .innerJoin(schema.customers, eq(schema.bridalOrders.customerId, schema.customers.id))
    .where(gte(schema.bridalOrders.bookingDate, since))
    .orderBy(desc(schema.bridalOrders.bookingDate));

  return rows.map((r) => ({
    ...mapOrder(r.order),
    customerName: r.customerName ?? "",
  }));
}

export async function searchBridalOrdersWithCustomerDb(query: string) {
  const db = getDb();
  if (!db) return [];
  const q = `%${query.trim()}%`;
  const rows = await db
    .select({
      order: schema.bridalOrders,
      customerName: schema.customers.name,
    })
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

  return rows.map((r) => ({
    ...mapOrder(r.order),
    customerName: r.customerName ?? undefined,
  }));
}

export interface PayableBridalOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  remainingBalance: string;
  depositPaid: string;
  totalPrice: string;
}

export async function listPayableBridalOrdersDb(): Promise<PayableBridalOrder[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      order: schema.bridalOrders,
      customerName: schema.customers.name,
    })
    .from(schema.bridalOrders)
    .leftJoin(schema.customers, eq(schema.bridalOrders.customerId, schema.customers.id))
    .where(
      and(
        notInArray(schema.bridalOrders.status, ["collected", "cancelled", "refunded"]),
        sql`${schema.bridalOrders.remainingBalance}::numeric > 0`
      )
    )
    .orderBy(desc(schema.bridalOrders.bookingDate))
    .limit(200);

  return rows.map((r) => ({
    id: r.order.id,
    orderNumber: r.order.orderNumber,
    customerName: r.customerName ?? "",
    remainingBalance: r.order.remainingBalance,
    depositPaid: r.order.depositPaid ?? "0",
    totalPrice: r.order.totalPrice,
  }));
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
  measurements?: BridalMeasurements;
  createdById?: string;
}): Promise<BridalOrder | null> {
  const db = getDb();
  if (!db) return null;
  const measurements = normalizeBridalMeasurements(input.measurements) ?? null;
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
      measurements,
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
    mimeType: row.mimeType ?? undefined,
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
  input: {
    deliveryDate: string;
    billNumber: string;
    courierName?: string;
    trackingNumber?: string;
    manufacturingCostPkr?: string;
  }
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.supplierCompletions).values({
    orderId,
    deliveryDate: new Date(input.deliveryDate),
    billNumber: input.billNumber,
    courierName: input.courierName ?? null,
    trackingNumber: input.trackingNumber ?? null,
    manufacturingCostPkr: input.manufacturingCostPkr ?? "0",
  });
}

export async function updateBridalOrderDb(
  id: string,
  patch: Partial<{
    status: BridalStatus;
    filesUnlockedAt: Date | null;
    lastSupplierActionAt: Date | null;
    supplierLocked: boolean;
    remainingBalance: string;
    depositPaid: string;
    totalPrice: string;
    dressType: string | null;
    customisationNotes: string | null;
    comments: string | null;
    deliveryDate: Date;
    measurements: BridalMeasurements | null;
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

export async function listCustomersPagedDb(opts?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ customers: Customer[]; total: number }> {
  const db = getDb();
  if (!db) return { customers: [], total: 0 };
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const conditions = [];
  if (opts?.q?.trim()) {
    const pat = `%${opts.q.trim()}%`;
    conditions.push(
      or(
        ilike(schema.customers.name, pat),
        ilike(schema.customers.phone, pat),
        ilike(schema.customers.email, pat)
      )
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.customers)
    .where(whereClause);
  const rows = await db
    .select()
    .from(schema.customers)
    .where(whereClause)
    .orderBy(schema.customers.name)
    .limit(limit)
    .offset(offset);
  return {
    customers: rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
    })),
    total: Number(countRow?.count ?? 0),
  };
}

export async function listSuppliersDb(includeInactive = false): Promise<Supplier[]> {
  const db = getDb();
  if (!db) return [];
  const rows = includeInactive
    ? await db.select().from(schema.suppliers)
    : await db.select().from(schema.suppliers).where(eq(schema.suppliers.active, true));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    active: row.active,
  }));
}

export async function createSupplierDb(input: {
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}): Promise<Supplier | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.suppliers)
    .values({
      name: input.name,
      email: input.email,
      phone: input.phone,
      active: input.active ?? true,
    })
    .returning();
  return row
    ? { id: row.id, name: row.name, email: row.email ?? undefined, phone: row.phone ?? undefined }
    : null;
}

export async function updateSupplierDb(
  id: string,
  patch: { name?: string; email?: string; phone?: string; active?: boolean }
): Promise<Supplier | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.update(schema.suppliers).set(patch).where(eq(schema.suppliers.id, id)).returning();
  return row
    ? { id: row.id, name: row.name, email: row.email ?? undefined, phone: row.phone ?? undefined }
    : null;
}

export async function deleteSupplierDb(id: string): Promise<{ ok: boolean; soft?: boolean }> {
  const db = getDb();
  if (!db) return { ok: false };
  const [orderRow] = await db
    .select({ c: count() })
    .from(schema.bridalOrders)
    .where(eq(schema.bridalOrders.supplierId, id));
  const hasOrders = Number(orderRow?.c ?? 0) > 0;
  if (hasOrders) {
    await db.update(schema.suppliers).set({ active: false }).where(eq(schema.suppliers.id, id));
    return { ok: true, soft: true };
  }
  await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
  return { ok: true, soft: false };
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

function mapMessageRow(row: typeof schema.customerMessages.$inferSelect) {
  return {
    id: row.id,
    orderId: row.orderId,
    senderType: row.senderType as "customer" | "staff" | "supplier",
    senderName: row.senderName ?? undefined,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    audience: (row.audience ?? "customer") as "customer" | "supplier" | "internal",
    attachmentUrl: row.attachmentUrl ?? undefined,
    attachmentKind: row.attachmentKind ?? undefined,
    readAt: row.readAt?.toISOString(),
    forwardedFromId: row.forwardedFromId ?? undefined,
    reviewStatus: row.reviewStatus as "pending" | "forwarded" | "dismissed" | undefined,
  };
}

export async function addMessageDb(
  orderId: string,
  input: {
    senderType: string;
    senderName?: string;
    message: string;
    audience?: "customer" | "supplier" | "internal";
    attachmentUrl?: string;
    attachmentKind?: string;
    reviewStatus?: "pending" | "forwarded" | "dismissed";
    forwardedFromId?: string;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.customerMessages)
    .values({
      orderId,
      senderType: input.senderType,
      senderName: input.senderName ?? null,
      message: input.message,
      audience: input.audience ?? "customer",
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentKind: input.attachmentKind ?? null,
      reviewStatus: input.reviewStatus ?? null,
      forwardedFromId: input.forwardedFromId ?? null,
    })
    .returning();
  if (!row) return null;
  return mapMessageRow(row);
}

export async function getMessagesDb(orderId: string, audience?: "customer" | "supplier" | "internal") {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.customerMessages)
    .where(eq(schema.customerMessages.orderId, orderId))
    .orderBy(schema.customerMessages.createdAt);
  const mapped = rows.map(mapMessageRow);
  if (!audience) return mapped;
  return mapped.filter((m) => m.audience === audience);
}

export async function getPendingInternalMessagesDb(orderId: string) {
  const messages = await getMessagesDb(orderId, "internal");
  return messages.filter((m) => m.reviewStatus === "pending");
}

export async function updateMessageDb(
  messageId: string,
  patch: {
    reviewStatus?: "pending" | "forwarded" | "dismissed";
    readAt?: Date;
  }
) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .update(schema.customerMessages)
    .set({
      ...(patch.reviewStatus !== undefined ? { reviewStatus: patch.reviewStatus } : {}),
      ...(patch.readAt !== undefined ? { readAt: patch.readAt } : {}),
    })
    .where(eq(schema.customerMessages.id, messageId))
    .returning();
  return row ? mapMessageRow(row) : null;
}

export async function getMessageDb(messageId: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.customerMessages)
    .where(eq(schema.customerMessages.id, messageId))
    .limit(1);
  return row ? mapMessageRow(row) : null;
}
