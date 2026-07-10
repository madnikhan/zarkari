import Link from "next/link";
import { getSupplierLedgerBalances } from "@/lib/supplier-ledger/service";
import { SupplierPaymentsPageClient } from "@/components/admin/SupplierPaymentsPageClient";

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function SupplierPaymentsPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const balances = await getSupplierLedgerBalances();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/suppliers" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-2 inline-block">
          ← Suppliers
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Supplier Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Khata balances in GBP and PKR for Pakistani suppliers</p>
      </div>
      <SupplierPaymentsPageClient balances={balances} q={q.trim()} page={page} />
    </div>
  );
}
