import Link from "next/link";
import { getBridalOrders, getCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function SupplierHomePage() {
  const session = await getSession();
  if (!session?.supplierId) redirect("/login");

  const orders = await getBridalOrders({ supplierId: session.supplierId });
  const pending = orders.filter((o) => o.status === "sent_to_supplier");
  const active = orders.filter(
    (o) => !["collected", "cancelled", "refunded", "sent_to_supplier", "supplier_rejected"].includes(o.status)
  );

  const pendingRows = await Promise.all(
    pending.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <Link key={order.id} href={`/supplier/orders/${order.id}`} className="boms-card p-4 block hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</p>
              <p className="font-medium mt-1">{customer?.name}</p>
              <p className="text-sm text-slate-500">{order.dressType}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <p className="text-sm font-medium mt-2">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
        </Link>
      );
    })
  );

  const activeRows = await Promise.all(
    active.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <Link key={order.id} href={`/supplier/orders/${order.id}`} className="boms-card p-4 block hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</p>
              <p className="font-medium mt-1">{customer?.name}</p>
              <p className="text-sm text-slate-500">{order.dressType}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <p className="text-sm font-medium mt-2">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
        </Link>
      );
    })
  );

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Your Orders</h1>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">New Orders — Accept or Reject</h2>
          <div className="space-y-3">{pendingRows}</div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3">In Production</h2>
        <div className="space-y-3">
          {active.length ? activeRows : <p className="text-sm text-slate-400">No active orders.</p>}
        </div>
      </section>
    </div>
  );
}
