import Link from "next/link";
import type { BridalOrderWithRelations } from "@/lib/data";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { CountdownBadge } from "@/components/orders/CountdownBadge";

interface Props {
  orders: BridalOrderWithRelations[];
  currentOrderId: string;
}

export function SupplierOtherOrders({ orders, currentOrderId }: Props) {
  const others = orders.filter((o) => o.id !== currentOrderId).slice(0, 8);
  if (!others.length) return null;

  return (
    <section className="boms-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Your other orders</h2>
        <Link href="/supplier?tab=in-progress" className="text-xs text-[#4C3BCF] hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {others.map((order) => (
          <li key={order.id}>
            <Link
              href={`/supplier/orders/${order.id}`}
              className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</p>
                <p className="text-sm text-slate-900 truncate">{order.customerName}</p>
              </div>
              <div className="text-right shrink-0">
                <StatusBadge status={order.status} />
                <div className="mt-1">
                  <CountdownBadge deliveryDate={order.deliveryDate} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
