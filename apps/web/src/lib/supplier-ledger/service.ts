import { isDbConfigured } from "@/lib/db";
import { demoSuppliers } from "@/lib/data/seed";
import {
  demoSupplierLedger,
  type SupplierLedgerBalance,
  type SupplierLedgerEntry,
} from "./demo-store";

export type { SupplierLedgerBalance, SupplierLedgerEntry };

function computeBalances(entries: SupplierLedgerEntry[]): Map<string, SupplierLedgerBalance> {
  const map = new Map<string, SupplierLedgerBalance>();
  for (const e of entries) {
    const name = demoSuppliers.find((s) => s.id === e.supplierId)?.name ?? "Unknown";
    const cur = map.get(e.supplierId) ?? {
      supplierId: e.supplierId,
      supplierName: name,
      totalBillsGbp: 0,
      totalBillsPkr: 0,
      totalPaymentsGbp: 0,
      totalPaymentsPkr: 0,
      balanceGbp: 0,
      balancePkr: 0,
    };
    const gbp = parseFloat(e.amountGbp) || 0;
    const pkr = parseFloat(e.amountPkr) || 0;
    if (e.type === "payment") {
      cur.totalPaymentsGbp += gbp;
      cur.totalPaymentsPkr += pkr;
    } else {
      cur.totalBillsGbp += gbp;
      cur.totalBillsPkr += pkr;
    }
    cur.balanceGbp = cur.totalBillsGbp - cur.totalPaymentsGbp;
    cur.balancePkr = cur.totalBillsPkr - cur.totalPaymentsPkr;
    map.set(e.supplierId, cur);
  }
  return map;
}

export async function listSupplierLedger(supplierId: string): Promise<SupplierLedgerEntry[]> {
  if (isDbConfigured()) {
    const { listSupplierLedgerDb } = await import("@/lib/db/supplier-ledger");
    return listSupplierLedgerDb(supplierId);
  }
  return demoSupplierLedger
    .filter((e) => e.supplierId === supplierId)
    .sort((a, b) => b.businessDate.localeCompare(a.businessDate));
}

export async function getSupplierLedgerBalances(): Promise<SupplierLedgerBalance[]> {
  if (isDbConfigured()) {
    const { getSupplierLedgerBalancesDb } = await import("@/lib/db/supplier-ledger");
    return getSupplierLedgerBalancesDb();
  }
  const balances = computeBalances(demoSupplierLedger);
  for (const s of demoSuppliers) {
    if (!balances.has(s.id)) {
      balances.set(s.id, {
        supplierId: s.id,
        supplierName: s.name,
        totalBillsGbp: 0,
        totalBillsPkr: 0,
        totalPaymentsGbp: 0,
        totalPaymentsPkr: 0,
        balanceGbp: 0,
        balancePkr: 0,
      });
    }
  }
  return Array.from(balances.values()).sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}

export async function addSupplierLedgerEntry(input: {
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
  if (isDbConfigured()) {
    const { addSupplierLedgerEntryDb } = await import("@/lib/db/supplier-ledger");
    return addSupplierLedgerEntryDb(input);
  }
  const entry: SupplierLedgerEntry = {
    id: `sl-${Date.now()}`,
    supplierId: input.supplierId,
    type: input.type,
    orderId: input.orderId,
    description: input.description,
    billNumber: input.billNumber,
    amountGbp: input.amountGbp ?? "0",
    amountPkr: input.amountPkr ?? "0",
    exchangeRate: input.exchangeRate,
    businessDate: (input.businessDate ?? new Date().toISOString()).slice(0, 10),
    cashTransactionId: input.cashTransactionId,
    createdAt: new Date().toISOString(),
  };
  demoSupplierLedger.push(entry);
  return entry;
}

export async function updateSupplierLedgerEntry(
  id: string,
  patch: Partial<{
    description: string;
    amountGbp: string;
    amountPkr: string;
    exchangeRate: string;
    businessDate: string;
    cashTransactionId: string;
  }>
): Promise<SupplierLedgerEntry | null> {
  if (isDbConfigured()) {
    const { updateSupplierLedgerEntryDb } = await import("@/lib/db/supplier-ledger");
    return updateSupplierLedgerEntryDb(id, patch);
  }
  const entry = demoSupplierLedger.find((e) => e.id === id);
  if (!entry) return null;
  Object.assign(entry, patch);
  return entry;
}

export function computeRunningBalances(entries: SupplierLedgerEntry[]): (SupplierLedgerEntry & {
  runningGbp: number;
  runningPkr: number;
})[] {
  const sorted = [...entries].sort((a, b) => {
    const d = a.businessDate.localeCompare(b.businessDate);
    return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
  });
  let runningGbp = 0;
  let runningPkr = 0;
  return sorted.map((e) => {
    const gbp = parseFloat(e.amountGbp) || 0;
    const pkr = parseFloat(e.amountPkr) || 0;
    if (e.type === "payment") {
      runningGbp -= gbp;
      runningPkr -= pkr;
    } else {
      runningGbp += gbp;
      runningPkr += pkr;
    }
    return { ...e, runningGbp, runningPkr };
  });
}

export async function backfillOrphanedKhataPayments(): Promise<{ linked: number; skipped: number }> {
  if (!isDbConfigured()) {
    return { linked: 0, skipped: 0 };
  }

  const { listOrphanedKhataPaymentsDb, updateSupplierLedgerEntryDb } = await import(
    "@/lib/db/supplier-ledger"
  );
  const { createCashTransaction } = await import("@/lib/db/cash-ledger");

  const orphans = await listOrphanedKhataPaymentsDb();
  let linked = 0;
  let skipped = 0;

  for (const entry of orphans) {
    const tx = await createCashTransaction({
      direction: "out",
      type: "supplier_payment",
      amount: entry.amountGbp,
      method: "cash",
      description: entry.description ?? "Supplier payment (khata backfill)",
      businessDate: entry.businessDate,
      supplierId: entry.supplierId,
      source: "manual",
    });

    if (!tx) {
      skipped++;
      continue;
    }

    const updated = await updateSupplierLedgerEntryDb(entry.id, { cashTransactionId: tx.id });
    if (updated) linked++;
    else skipped++;
  }

  return { linked, skipped };
}
