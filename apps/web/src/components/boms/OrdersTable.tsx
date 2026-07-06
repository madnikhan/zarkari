import Link from "next/link";
import type { BridalOrder, Customer } from "@/lib/data/seed";
import { StatusBadge } from "./StatusBadge";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { formatPrice } from "@/lib/utils";
import { getCountdown } from "@/lib/orders/status-machine";
import { MoreHorizontal } from "lucide-react";

interface Row {
  order: BridalOrder;
  customer: Customer | null;
  supplierName?: string;
}

interface OrdersTableProps {
  rows: Row[];
  baseHref?: string;
}

export function OrdersTable({ rows, baseHref = "/admin/orders" }: OrdersTableProps) {
  return (
    <div className="boms-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Order ID</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Delivery</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Time Left</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ order, customer, supplierName }) => {
              const { tone } = getCountdown(order.deliveryDate);
              const isOverdue = tone === "overdue";
              return (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link href={`${baseHref}/${order.id}`} className="font-mono text-[#4C3BCF] hover:underline text-xs">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#4C3BCF]/10 text-[#4C3BCF] text-xs flex items-center justify-center font-medium flex-shrink-0">
                        {customer?.name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium">{customer?.name ?? "—"}</p>
                        <p className="text-xs text-slate-400">{customer?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{supplierName ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                    {new Date(order.deliveryDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                    {["collected", "cancelled", "refunded"].includes(order.status)
                      ? "—"
                      : formatPrice(order.remainingBalance)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {!["collected", "cancelled", "refunded"].includes(order.status) && (
                      <CountdownBadge deliveryDate={order.deliveryDate} />
                    )}
                    {isOverdue && ["collected", "cancelled", "refunded"].includes(order.status) === false && (
                      <span className="sr-only">overdue</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`${baseHref}/${order.id}`} className="p-1.5 rounded hover:bg-slate-100 inline-flex text-slate-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="text-center text-slate-400 py-12 text-sm">No orders found.</p>
      )}
    </div>
  );
}
