import { and, desc, eq, gte, lte, lt, notInArray, sql } from "drizzle-orm";
import { getDb, schema } from "./index";

export type CashDirection = "in" | "out";
export type CashTransactionType =
  | "order_deposit"
  | "order_collection"
  | "ready_made_sale"
  | "other_in"
  | "supplier_payment"
  | "business_expense"
  | "refund"
  | "partner_loan"
  | "other_out";
export type CashPaymentMethod = "cash" | "online";
export type CashTransactionSource = "manual" | "auto";

export interface CashTransaction {
  id: string;
  direction: CashDirection;
  type: CashTransactionType;
  amount: string;
  method: CashPaymentMethod;
  reference?: string;
  description?: string;
  businessDate: string;
  occurredAt: string;
  orderId?: string;
  retailOrderId?: string;
  supplierId?: string;
  source: CashTransactionSource;
  isSample: boolean;
  createdByUserId?: string;
}

export interface DailyCashSummary {
  businessDate: string;
  openingCash: number;
  openingOnline: number;
  openingTotal: number;
  totalCashIn: number;
  totalCashOut: number;
  netToday: number;
  closingCash: number;
  closingOnline: number;
  closingTotal: number;
  outstandingOrders: number;
  outstandingBalance: number;
}

function mapTransaction(row: typeof schema.cashTransactions.$inferSelect): CashTransaction {
  return {
    id: row.id,
    direction: row.direction as CashDirection,
    type: row.type as CashTransactionType,
    amount: row.amount,
    method: row.method as CashPaymentMethod,
    reference: row.reference ?? undefined,
    description: row.description ?? undefined,
    businessDate: row.businessDate,
    occurredAt: row.occurredAt.toISOString(),
    orderId: row.orderId ?? undefined,
    retailOrderId: row.retailOrderId ?? undefined,
    supplierId: row.supplierId ?? undefined,
    source: row.source as CashTransactionSource,
    isSample: row.isSample,
    createdByUserId: row.createdByUserId ?? undefined,
  };
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateInput(date: string | Date): string {
  if (typeof date === "string") return date.slice(0, 10);
  return toDateString(date);
}

function sumByMethod(
  rows: { amount: string; method: string; direction: string }[],
  direction: CashDirection,
  method: CashPaymentMethod
): number {
  return rows
    .filter((r) => r.direction === direction && r.method === method)
    .reduce((s, r) => s + parseFloat(r.amount), 0);
}

export async function listTransactionsForDay(
  date: string | Date,
  direction?: CashDirection
): Promise<CashTransaction[]> {
  const db = getDb();
  if (!db) return [];
  const businessDate = parseDateInput(date);
  const conditions = [eq(schema.cashTransactions.businessDate, businessDate)];
  if (direction) conditions.push(eq(schema.cashTransactions.direction, direction));

  const rows = await db
    .select()
    .from(schema.cashTransactions)
    .where(and(...conditions))
    .orderBy(desc(schema.cashTransactions.occurredAt));

  return rows.map(mapTransaction);
}

export async function getOpeningBalanceForDay(date: string | Date): Promise<{
  cashInHand: number;
  onlineBank: number;
} | null> {
  const db = getDb();
  if (!db) return null;
  const businessDate = parseDateInput(date);
  const [row] = await db
    .select()
    .from(schema.cashOpeningBalances)
    .where(eq(schema.cashOpeningBalances.businessDate, businessDate))
    .limit(1);
  if (row) {
    return { cashInHand: parseFloat(row.cashInHand), onlineBank: parseFloat(row.onlineBank) };
  }
  return null;
}

async function sumDayTransactionTotals(businessDate: string) {
  const db = getDb();
  if (!db) return { cashIn: 0, onlineIn: 0, cashOut: 0, onlineOut: 0, totalCashIn: 0, totalCashOut: 0 };

  const txRows = await db
    .select({
      amount: schema.cashTransactions.amount,
      method: schema.cashTransactions.method,
      direction: schema.cashTransactions.direction,
    })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.businessDate, businessDate));

  const totalCashIn = txRows.filter((r) => r.direction === "in").reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalCashOut = txRows.filter((r) => r.direction === "out").reduce((s, r) => s + parseFloat(r.amount), 0);

  return {
    cashIn: sumByMethod(txRows, "in", "cash"),
    onlineIn: sumByMethod(txRows, "in", "online"),
    cashOut: sumByMethod(txRows, "out", "cash"),
    onlineOut: sumByMethod(txRows, "out", "online"),
    totalCashIn,
    totalCashOut,
  };
}

async function getOutstandingBridalTotals() {
  const db = getDb();
  if (!db) return { count: 0, balance: 0 };

  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
      balance: sql<number>`coalesce(sum(${schema.bridalOrders.remainingBalance}::numeric), 0)`,
    })
    .from(schema.bridalOrders)
    .where(notInArray(schema.bridalOrders.status, ["collected", "cancelled", "refunded"]));

  return { count: Number(row?.count ?? 0), balance: Number(row?.balance ?? 0) };
}

async function resolveOpeningForDay(businessDate: string): Promise<{ cashInHand: number; onlineBank: number }> {
  const stored = await getOpeningBalanceForDay(businessDate);
  if (stored) return stored;

  const db = getDb();
  if (!db) return { cashInHand: 0, onlineBank: 0 };

  const [anchor] = await db
    .select()
    .from(schema.cashOpeningBalances)
    .where(lt(schema.cashOpeningBalances.businessDate, businessDate))
    .orderBy(desc(schema.cashOpeningBalances.businessDate))
    .limit(1);

  let cursor = anchor?.businessDate ?? null;
  let cash = anchor ? parseFloat(anchor.cashInHand) : 0;
  let online = anchor ? parseFloat(anchor.onlineBank) : 0;

  if (cursor) {
    const dayTotals = await sumDayTransactionTotals(cursor);
    cash += dayTotals.cashIn - dayTotals.cashOut;
    online += dayTotals.onlineIn - dayTotals.onlineOut;
  }

  const start = cursor
    ? (() => {
        const d = new Date(`${cursor}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        return toDateString(d);
      })()
    : "1970-01-01";

  const target = new Date(`${businessDate}T12:00:00Z`);
  let walk = new Date(`${start}T12:00:00Z`);
  let iterations = 0;

  while (walk < target && iterations < 120) {
    const day = toDateString(walk);
    const explicit = await getOpeningBalanceForDay(day);
    if (explicit) {
      cash = explicit.cashInHand;
      online = explicit.onlineBank;
    }
    const totals = await sumDayTransactionTotals(day);
    cash += totals.cashIn - totals.cashOut;
    online += totals.onlineIn - totals.onlineOut;
    walk.setUTCDate(walk.getUTCDate() + 1);
    iterations += 1;
  }

  return { cashInHand: cash, onlineBank: online };
}

export async function setOpeningBalance(
  date: string | Date,
  cashInHand: string,
  onlineBank: string,
  setByUserId?: string,
  isSample = false
): Promise<void> {
  const db = getDb();
  if (!db) return;
  const businessDate = parseDateInput(date);
  const existing = await getOpeningBalanceForDay(businessDate);
  if (existing) {
    await db
      .update(schema.cashOpeningBalances)
      .set({
        cashInHand,
        onlineBank,
        setByUserId: setByUserId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.cashOpeningBalances.businessDate, businessDate));
    return;
  }
  await db.insert(schema.cashOpeningBalances).values({
    businessDate,
    cashInHand,
    onlineBank,
    setByUserId: setByUserId ?? null,
    isSample,
  });
}

export async function getDailyCashSummary(date: string | Date): Promise<DailyCashSummary> {
  const db = getDb();
  const businessDate = parseDateInput(date);
  if (!db) {
    return {
      businessDate,
      openingCash: 0,
      openingOnline: 0,
      openingTotal: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      netToday: 0,
      closingCash: 0,
      closingOnline: 0,
      closingTotal: 0,
      outstandingOrders: 0,
      outstandingBalance: 0,
    };
  }

  const opening = await resolveOpeningForDay(businessDate);

  const { cashIn, onlineIn, cashOut, onlineOut, totalCashIn, totalCashOut } =
    await sumDayTransactionTotals(businessDate);

  const closingCash = opening.cashInHand + cashIn - cashOut;
  const closingOnline = opening.onlineBank + onlineIn - onlineOut;

  const outstanding = await getOutstandingBridalTotals();

  return {
    businessDate,
    openingCash: opening.cashInHand,
    openingOnline: opening.onlineBank,
    openingTotal: opening.cashInHand + opening.onlineBank,
    totalCashIn,
    totalCashOut,
    netToday: totalCashIn - totalCashOut,
    closingCash,
    closingOnline,
    closingTotal: closingCash + closingOnline,
    outstandingOrders: outstanding.count,
    outstandingBalance: outstanding.balance,
  };
}

export async function createCashTransaction(input: {
  direction: CashDirection;
  type: CashTransactionType;
  amount: string;
  method: CashPaymentMethod;
  reference?: string;
  description?: string;
  businessDate?: string | Date;
  occurredAt?: Date;
  orderId?: string;
  retailOrderId?: string;
  supplierId?: string;
  source?: CashTransactionSource;
  isSample?: boolean;
  createdByUserId?: string;
}): Promise<CashTransaction | null> {
  const db = getDb();
  if (!db) return null;
  const occurredAt = input.occurredAt ?? new Date();
  const businessDate = parseDateInput(input.businessDate ?? occurredAt);

  const [row] = await db
    .insert(schema.cashTransactions)
    .values({
      direction: input.direction,
      type: input.type,
      amount: input.amount,
      method: input.method,
      reference: input.reference ?? null,
      description: input.description ?? null,
      businessDate,
      occurredAt,
      orderId: input.orderId ?? null,
      retailOrderId: input.retailOrderId ?? null,
      supplierId: input.supplierId ?? null,
      source: input.source ?? "manual",
      isSample: input.isSample ?? false,
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();

  return row ? mapTransaction(row) : null;
}

export async function deleteCashTransaction(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const result = await db.delete(schema.cashTransactions).where(eq(schema.cashTransactions.id, id));
  return (result as { rowCount?: number }).rowCount !== 0;
}

export async function findAutoPostedTransaction(input: {
  orderId?: string;
  retailOrderId?: string;
  type: CashTransactionType;
  reference?: string;
}): Promise<CashTransaction | null> {
  const db = getDb();
  if (!db) return null;
  const conditions = [
    eq(schema.cashTransactions.source, "auto"),
    eq(schema.cashTransactions.type, input.type),
  ];
  if (input.orderId) conditions.push(eq(schema.cashTransactions.orderId, input.orderId));
  if (input.retailOrderId) conditions.push(eq(schema.cashTransactions.retailOrderId, input.retailOrderId));
  if (input.reference) conditions.push(eq(schema.cashTransactions.reference, input.reference));

  const [row] = await db
    .select()
    .from(schema.cashTransactions)
    .where(and(...conditions))
    .limit(1);
  return row ? mapTransaction(row) : null;
}

export function mapPaymentMethodToCash(method?: string): CashPaymentMethod {
  const m = method?.toLowerCase() ?? "";
  if (m === "cash") return "cash";
  return "online";
}

export async function autoPostCashTransaction(input: {
  direction: CashDirection;
  type: CashTransactionType;
  amount: string;
  method?: string;
  reference?: string;
  description?: string;
  orderId?: string;
  retailOrderId?: string;
  supplierId?: string;
  createdByUserId?: string;
}): Promise<CashTransaction | null> {
  const existing = await findAutoPostedTransaction({
    orderId: input.orderId,
    retailOrderId: input.retailOrderId,
    type: input.type,
    reference: input.reference,
  });
  if (existing) return existing;

  return createCashTransaction({
    ...input,
    method: mapPaymentMethodToCash(input.method),
    source: "auto",
  });
}

export interface CashAnalytics {
  periodDays: number;
  daily: { date: string; cashIn: number; cashOut: number; net: number }[];
  methodSplit: { cash: number; online: number };
  expensesByType: { type: string; total: number }[];
  insights: {
    avgDailyIn: number;
    avgDailyOut: number;
    busiestDay: string | null;
    topExpenseType: string | null;
    outstandingBalance: number;
  };
}

export async function getCashAnalytics(periodDays: 7 | 30 | 90 = 7): Promise<CashAnalytics> {
  const db = getDb();
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (periodDays - 1));
  const startDate = toDateString(start);
  const endDate = toDateString(end);

  if (!db) {
    return {
      periodDays,
      daily: [],
      methodSplit: { cash: 0, online: 0 },
      expensesByType: [],
      insights: {
        avgDailyIn: 0,
        avgDailyOut: 0,
        busiestDay: null,
        topExpenseType: null,
        outstandingBalance: 0,
      },
    };
  }

  const rows = await db
    .select({
      businessDate: schema.cashTransactions.businessDate,
      amount: schema.cashTransactions.amount,
      direction: schema.cashTransactions.direction,
      method: schema.cashTransactions.method,
      type: schema.cashTransactions.type,
    })
    .from(schema.cashTransactions)
    .where(
      and(
        gte(schema.cashTransactions.businessDate, startDate),
        lte(schema.cashTransactions.businessDate, endDate)
      )
    );

  const dailyMap = new Map<string, { cashIn: number; cashOut: number }>();
  let cashMethod = 0;
  let onlineMethod = 0;
  const expenseMap = new Map<string, number>();

  for (const row of rows) {
    const amt = parseFloat(row.amount);
    const day = row.businessDate;
    const entry = dailyMap.get(day) ?? { cashIn: 0, cashOut: 0 };
    if (row.direction === "in") entry.cashIn += amt;
    else entry.cashOut += amt;
    dailyMap.set(day, entry);

    if (row.direction === "in") {
      if (row.method === "cash") cashMethod += amt;
      else onlineMethod += amt;
    }

    if (row.direction === "out") {
      expenseMap.set(row.type, (expenseMap.get(row.type) ?? 0) + amt);
    }
  }

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, cashIn: v.cashIn, cashOut: v.cashOut, net: v.cashIn - v.cashOut }));

  const totalIn = daily.reduce((s, d) => s + d.cashIn, 0);
  const totalOut = daily.reduce((s, d) => s + d.cashOut, 0);
  const busiest = daily.reduce<{ date: string; cashIn: number } | null>(
    (best, d) => (!best || d.cashIn > best.cashIn ? { date: d.date, cashIn: d.cashIn } : best),
    null
  );

  let topExpenseType: string | null = null;
  let topExpense = 0;
  for (const [type, total] of expenseMap) {
    if (total > topExpense) {
      topExpense = total;
      topExpenseType = type;
    }
  }

  const summary = await getDailyCashSummary(endDate);

  return {
    periodDays,
    daily,
    methodSplit: { cash: cashMethod, online: onlineMethod },
    expensesByType: Array.from(expenseMap.entries()).map(([type, total]) => ({ type, total })),
    insights: {
      avgDailyIn: daily.length ? totalIn / daily.length : 0,
      avgDailyOut: daily.length ? totalOut / daily.length : 0,
      busiestDay: busiest?.date ?? null,
      topExpenseType,
      outstandingBalance: summary.outstandingBalance,
    },
  };
}

export async function countSampleCashRows(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.isSample, true));
  return Number(row?.count ?? 0);
}
