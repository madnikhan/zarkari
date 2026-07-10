"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminPagination } from "@/components/admin/AdminPagination";

const PAGE_SIZE = 20;
const numCell = "px-4 py-3 text-right tabular-nums whitespace-nowrap";

interface BalanceRow {
  supplierId: string;
  supplierName: string;
  totalBillsGbp: number;
  totalBillsPkr: number;
  totalPaymentsGbp: number;
  totalPaymentsPkr: number;
  balanceGbp: number;
  balancePkr: number;
}

interface Props {
  balances: BalanceRow[];
  q: string;
  page: number;
}

export function SupplierPaymentsPageClient({ balances, q, page }: Props) {
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return balances;
    return balances.filter((b) => b.supplierName.toLowerCase().includes(needle));
  }, [balances, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch
            placeholder="Search supplier name…"
            defaultValue={q}
            paramName="q"
          />
        </Suspense>
      </div>
      <AdminTableShell>
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="sticky top-0 bg-slate-50/95 z-10">
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Supplier</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Bills (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Bills (PKR)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Paid (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Paid (PKR)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Balance (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Balance (PKR)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((b) => (
              <tr key={b.supplierId} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{b.supplierName}</td>
                <td className={numCell}>{formatPrice(String(b.totalBillsGbp))}</td>
                <td className={numCell}>Rs {b.totalBillsPkr.toLocaleString("en-GB")}</td>
                <td className={numCell}>{formatPrice(String(b.totalPaymentsGbp))}</td>
                <td className={numCell}>Rs {b.totalPaymentsPkr.toLocaleString("en-GB")}</td>
                <td className={numCell}>{formatPrice(String(b.balanceGbp))}</td>
                <td className={`${numCell} font-semibold bg-violet-50/60 text-slate-800`}>
                  Rs {b.balancePkr.toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/suppliers/${b.supplierId}/khata`}
                    className="text-[#4C3BCF] hover:underline text-xs whitespace-nowrap"
                  >
                    View khata →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!paged.length && (
          <p className="text-center text-slate-400 py-12 text-sm">No supplier ledger entries yet.</p>
        )}
      </AdminTableShell>
      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        basePath="/admin/suppliers/payments"
        query={{ q: q || undefined }}
      />
    </>
  );
}
