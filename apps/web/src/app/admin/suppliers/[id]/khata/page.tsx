import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSupplier } from "@/lib/data";
import { listSupplierLedger, computeRunningBalances } from "@/lib/supplier-ledger/service";
import { formatPrice } from "@/lib/utils";
import { AddKhataEntryForm } from "@/components/admin/suppliers/AddKhataEntryForm";
import { KhataEntriesTable } from "@/components/admin/suppliers/KhataEntriesTable";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { resolveSearchDateBounds } from "@/lib/admin/date-range";
import { canDeleteRecords, getSession } from "@/lib/auth/session";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}

export default async function SupplierKhataPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from, to, preset } = await searchParams;
  const session = await getSession();
  const canDelete = session ? canDeleteRecords(session.role) : false;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const bounds = resolveSearchDateBounds({ from, to, preset });
  const entries = await listSupplierLedger(
    id,
    bounds.from && bounds.to ? { from: bounds.from, to: bounds.to } : undefined
  );
  const withRunning = computeRunningBalances(entries).reverse();

  const totalBillsGbp = entries
    .filter((e) => e.type !== "payment")
    .reduce((s, e) => s + parseFloat(e.amountGbp), 0);
  const totalPaymentsGbp = entries
    .filter((e) => e.type === "payment")
    .reduce((s, e) => s + parseFloat(e.amountGbp), 0);
  const totalBillsPkr = entries
    .filter((e) => e.type !== "payment")
    .reduce((s, e) => s + parseFloat(e.amountPkr), 0);
  const totalPaymentsPkr = entries
    .filter((e) => e.type === "payment")
    .reduce((s, e) => s + parseFloat(e.amountPkr), 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Link href="/admin/suppliers/payments" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-2 inline-block">
        ← Supplier Payments
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">{supplier.name} — Khata</h1>
      <p className="text-sm text-slate-500 mb-6">
        Balance: {formatPrice(String(totalBillsGbp - totalPaymentsGbp))} · Rs{" "}
        <span className="font-semibold">{(totalBillsPkr - totalPaymentsPkr).toLocaleString("en-GB")}</span>
      </p>

      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminDateRangeFilter preserveKeys={[]} />
        </Suspense>
      </div>

      <div className="space-y-6 mb-8">
        <AddKhataEntryForm supplierId={id} />
        <KhataEntriesTable entries={withRunning} canDelete={canDelete} />
      </div>
    </div>
  );
}
