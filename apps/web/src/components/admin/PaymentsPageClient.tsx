"use client";

import { Suspense } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { RecordPaymentForm } from "@/components/boms/RecordPaymentForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import type { BridalOrderWithRelations } from "@/lib/data";

interface Props {
  summary: { totalDeposits: number; totalOutstanding: number };
  orders: BridalOrderWithRelations[];
  page: number;
  totalPages: number;
  total: number;
  q: string;
  paymentCountByOrder: Record<string, number>;
}

export function PaymentsPageClient({
  summary,
  orders,
  page,
  totalPages,
  total,
  q,
  paymentCountByOrder,
}: Props) {
  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/payments?${qs}` : "/admin/payments";
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Payments</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Deposits Received</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatPrice(String(summary.totalDeposits))}</p>
        </div>
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{formatPrice(String(summary.totalOutstanding))}</p>
        </div>
      </div>

      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch placeholder="Search order # or customer…" defaultValue={q} />
        </Suspense>
      </div>

      <AdminTableShell>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50/95 z-10">
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Deposit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Payments</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-[#4C3BCF] hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatPrice(order.totalPrice)}</td>
                <td className="px-4 py-3 text-emerald-600">{formatPrice(order.depositPaid)}</td>
                <td className="px-4 py-3 text-amber-600">{formatPrice(order.remainingBalance)}</td>
                <td className="px-4 py-3 text-slate-500">{paymentCountByOrder[order.id] ?? 0} recorded</td>
                <td className="px-4 py-3">
                  <RecordPaymentForm
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    remainingBalance={order.remainingBalance}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <AdminPagination page={page} totalPages={totalPages} totalItems={total} pageSize={50} buildHref={hrefFor} />
    </div>
  );
}
