import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "./index";
import type { SupplierLedgerBalance, SupplierLedgerEntry } from "@/lib/supplier-ledger/demo-store";

function mapRow(row: typeof schema.supplierLedgerEntries.$inferSelect): SupplierLedgerEntry {
  return {
    id: row.id,
    supplierId: row.supplierId,
    type: row.type as SupplierLedgerEntry["type"],
    orderId: row.orderId ?? undefined,
    description: row.description ?? undefined,
    billNumber: row.billNumber ?? undefined,
    amountGbp: row.amountGbp,
    amountPkr: row.amountPkr,
    exchangeRate: row.exchangeRate ?? undefined,
    businessDate: row.businessDate,
    cashTransactionId: row.cashTransactionId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSupplierLedgerDb(supplierId: string): Promise<SupplierLedgerEntry[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.supplierLedgerEntries)
    .where(eq(schema.supplierLedgerEntries.supplierId, supplierId))
    .orderBy(desc(schema.supplierLedgerEntries.businessDate), desc(schema.supplierLedgerEntries.createdAt));
  return rows.map(mapRow);
}

export async function addSupplierLedgerEntryDb(input: {
  supplierId: string;
  type: SupplierLedgerEntry["type"];
  orderId?: string;
  description?: string;
  billNumber?: string;
  amountGbp?: string;
  amountPkr?: string;
  exchangeRate?: string;
  businessDate?: string;
  cashTransactionId?: string;
}): Promise<SupplierLedgerEntry | null> {
  const db = getDb();
  if (!db) return null;
  const businessDate = (input.businessDate ?? new Date().toISOString()).slice(0, 10);
  const [row] = await db
    .insert(schema.supplierLedgerEntries)
    .values({
      supplierId: input.supplierId,
      type: input.type,
      orderId: input.orderId ?? null,
      description: input.description ?? null,
      billNumber: input.billNumber ?? null,
      amountGbp: input.amountGbp ?? "0",
      amountPkr: input.amountPkr ?? "0",
      exchangeRate: input.exchangeRate ?? null,
      businessDate,
      cashTransactionId: input.cashTransactionId ?? null,
    })
    .returning();
  return row ? mapRow(row) : null;
}

export async function updateSupplierLedgerEntryDb(
  id: string,
  patch: Partial<{
    description: string;
    amountGbp: string;
    amountPkr: string;
    exchangeRate: string;
    businessDate: string;
  }>
): Promise<SupplierLedgerEntry | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .update(schema.supplierLedgerEntries)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.supplierLedgerEntries.id, id))
    .returning();
  return row ? mapRow(row) : null;
}

export async function getSupplierLedgerBalancesDb(): Promise<SupplierLedgerBalance[]> {
  const db = getDb();
  if (!db) return [];

  const supplierRows = await db.select({ id: schema.suppliers.id, name: schema.suppliers.name }).from(schema.suppliers);
  const entryRows = await db
    .select({
      supplierId: schema.supplierLedgerEntries.supplierId,
      billsGbp: sql<number>`coalesce(sum(${schema.supplierLedgerEntries.amountGbp}::numeric) filter (where ${schema.supplierLedgerEntries.type} in ('bill', 'stock')), 0)`,
      billsPkr: sql<number>`coalesce(sum(${schema.supplierLedgerEntries.amountPkr}::numeric) filter (where ${schema.supplierLedgerEntries.type} in ('bill', 'stock')), 0)`,
      paymentsGbp: sql<number>`coalesce(sum(${schema.supplierLedgerEntries.amountGbp}::numeric) filter (where ${schema.supplierLedgerEntries.type} = 'payment'), 0)`,
      paymentsPkr: sql<number>`coalesce(sum(${schema.supplierLedgerEntries.amountPkr}::numeric) filter (where ${schema.supplierLedgerEntries.type} = 'payment'), 0)`,
    })
    .from(schema.supplierLedgerEntries)
    .groupBy(schema.supplierLedgerEntries.supplierId);

  const entryMap = new Map(entryRows.map((r) => [r.supplierId, r]));

  return supplierRows
    .map((s) => {
      const e = entryMap.get(s.id);
      const totalBillsGbp = Number(e?.billsGbp ?? 0);
      const totalBillsPkr = Number(e?.billsPkr ?? 0);
      const totalPaymentsGbp = Number(e?.paymentsGbp ?? 0);
      const totalPaymentsPkr = Number(e?.paymentsPkr ?? 0);
      return {
        supplierId: s.id,
        supplierName: s.name,
        totalBillsGbp,
        totalBillsPkr,
        totalPaymentsGbp,
        totalPaymentsPkr,
        balanceGbp: totalBillsGbp - totalPaymentsGbp,
        balancePkr: totalBillsPkr - totalPaymentsPkr,
      };
    })
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}
