"use client";

import Link from "next/link";
import { Suspense } from "react";
import { SupplierOrderCard } from "@/components/supplier/SupplierOrderCard";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import type { BridalOrderWithRelations } from "@/lib/data";

type SupplierTab = "new" | "in-progress" | "completed" | "cancelled";

interface Props {
  tab: SupplierTab;
  page: number;
  totalPages: number;
  total: number;
  q: string;
  counts: { new: number; inProgress: number; completed: number; cancelled: number };
  orders: BridalOrderWithRelations[];
}

export function SupplierHomeClient({ tab, page, totalPages, total, q, counts, orders }: Props) {
  const tabLink = (t: SupplierTab) => {
    const params = new URLSearchParams();
    params.set("tab", t);
    if (q) params.set("q", q);
    return `/supplier?${params.toString()}`;
  };

  const tabLabels: Record<SupplierTab, string> = {
    new: "New",
    "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled / Rejected",
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">Order history</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">All your orders by status — tap a row to open details.</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Link
          href={tabLink("new")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "new" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          New ({counts.new})
        </Link>
        <Link
          href={tabLink("in-progress")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "in-progress" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          In Progress ({counts.inProgress})
        </Link>
        <Link
          href={tabLink("completed")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "completed" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Completed ({counts.completed})
        </Link>
        <Link
          href={tabLink("cancelled")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "cancelled" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Cancelled ({counts.cancelled})
        </Link>
      </div>

      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch placeholder="Search order # or customer…" defaultValue={q} />
        </Suspense>
      </div>

      <AdminTableShell>
        <section className="p-4">
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">{tabLabels[tab]}</h2>
          <div className="space-y-4">
            {tab === "new" && orders.length > 0
              ? orders.map((order) => (
                  <SupplierOrderCard
                    key={order.id}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    customerName={order.customerName ?? "Customer"}
                    dressType={order.dressType}
                    deliveryDate={order.deliveryDate}
                    status={order.status}
                  />
                ))
              : null}
            {tab !== "new" && orders.length > 0
              ? orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/supplier/orders/${order.id}`}
                    className="boms-card p-5 block hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{order.orderNumber}</p>
                        <p className="font-medium text-slate-900 mt-1">{order.customerName}</p>
                        <p className="text-sm text-slate-500">{order.dressType}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={order.status} />
                        {tab !== "cancelled" && (
                          <div className="mt-2">
                            <CountdownBadge deliveryDate={order.deliveryDate} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              : null}
            {!orders.length && <p className="text-sm text-slate-400 py-8 text-center">No orders in this tab.</p>}
          </div>
        </section>
      </AdminTableShell>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        basePath="/supplier"
        query={{ tab, q: q || undefined }}
      />
    </div>
  );
}
