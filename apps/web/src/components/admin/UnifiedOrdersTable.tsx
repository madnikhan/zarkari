"use client";

import Link from "next/link";
import type { UnifiedOrder } from "@/lib/db/unified-orders";

const TYPE_LABELS: Record<UnifiedOrder["type"], string> = {
  custom: "Custom",
  online: "Online",
  walk_in: "Ready-made Sale",
};

const TYPE_STYLES: Record<UnifiedOrder["type"], string> = {
  custom: "bg-violet-100 text-violet-800",
  online: "bg-blue-100 text-blue-800",
  walk_in: "bg-amber-100 text-amber-800",
};

export function UnifiedOrdersTable({ orders }: { orders: UnifiedOrder[] }) {
  if (!orders.length) {
    return (
      <div className="boms-card p-12 text-center text-slate-400 text-sm">No orders found.</div>
    );
  }

  return (
    <div className="boms-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Supplier</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Date</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={`${order.type}-${order.id}`} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[order.type]}`}>
                  {TYPE_LABELS[order.type]}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{order.customerLabel}</p>
                {order.customerPhone && (
                  <p className="text-xs text-slate-400">{order.customerPhone}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                {order.supplierName ?? "—"}
              </td>
              <td className="px-4 py-3 font-medium">
                {order.type === "custom" ? `£${parseFloat(order.total).toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : `£${order.total}`}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                  {order.statusLabel}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                {new Date(order.createdAt).toLocaleDateString("en-GB")}
              </td>
              <td className="px-4 py-3">
                <Link href={order.href} className="text-xs text-[#4C3BCF] hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
