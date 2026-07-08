import { getBridalOrders, getCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SupplierOrderCard } from "@/components/supplier/SupplierOrderCard";
import { StatusBadge } from "@/components/boms/StatusBadge";
import Link from "next/link";
import { CountdownBadge } from "@/components/orders/CountdownBadge";

type SupplierTab = "new" | "in-progress" | "completed" | "cancelled";

interface Props {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function SupplierHomePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.supplierId) redirect("/login");

  const sp = (await searchParams) ?? {};
  const tab = (sp.tab as SupplierTab) ?? "new";

  const orders = await getBridalOrders({ supplierId: session.supplierId });
  const pending = orders.filter((o) => o.status === "sent_to_supplier");
  const inProgress = orders.filter(
    (o) => !["collected", "cancelled", "refunded", "sent_to_supplier", "supplier_rejected"].includes(o.status)
  );
  const completed = orders.filter((o) => o.status === "collected");
  const cancelled = orders.filter((o) => ["cancelled", "refunded", "supplier_rejected"].includes(o.status));

  const pendingCards = await Promise.all(
    pending.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <SupplierOrderCard
          key={order.id}
          orderId={order.id}
          orderNumber={order.orderNumber}
          customerName={customer?.name ?? "Customer"}
          dressType={order.dressType}
          deliveryDate={order.deliveryDate}
          status={order.status}
        />
      );
    })
  );

  const inProgressCards = await Promise.all(
    inProgress.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <Link key={order.id} href={`/supplier/orders/${order.id}`} className="boms-card p-5 block hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{order.orderNumber}</p>
              <p className="font-medium text-slate-900 mt-1">{customer?.name}</p>
              <p className="text-sm text-slate-500">{order.dressType}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <div className="mt-2">
                <CountdownBadge deliveryDate={order.deliveryDate} />
              </div>
            </div>
          </div>
        </Link>
      );
    })
  );

  const completedCards = await Promise.all(
    completed.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <Link key={order.id} href={`/supplier/orders/${order.id}`} className="boms-card p-5 block hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{order.orderNumber}</p>
              <p className="font-medium text-slate-900 mt-1">{customer?.name}</p>
              <p className="text-sm text-slate-500">{order.dressType}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <div className="mt-2">
                <CountdownBadge deliveryDate={order.deliveryDate} />
              </div>
            </div>
          </div>
        </Link>
      );
    })
  );

  const cancelledCards = await Promise.all(
    cancelled.map(async (order) => {
      const customer = await getCustomer(order.customerId);
      return (
        <Link
          key={order.id}
          href={`/supplier/orders/${order.id}`}
          className="boms-card p-5 block opacity-80 hover:opacity-100 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{order.orderNumber}</p>
              <p className="font-medium text-slate-900 mt-1">{customer?.name}</p>
              <p className="text-sm text-slate-500">{order.dressType}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
            </div>
          </div>
        </Link>
      );
    })
  );

  const tabLink = (t: SupplierTab) =>
    `/supplier?tab=${encodeURIComponent(t)}`;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Your Orders</h1>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <Link
          href={tabLink("new")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "new" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          New ({pending.length})
        </Link>
        <Link
          href={tabLink("in-progress")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "in-progress" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          In Progress ({inProgress.length})
        </Link>
        <Link
          href={tabLink("completed")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "completed" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Completed ({completed.length})
        </Link>
        <Link
          href={tabLink("cancelled")}
          className={`text-sm px-3 py-2 rounded-lg border ${tab === "cancelled" ? "border-[#4C3BCF] text-[#4C3BCF] bg-[#F4F3FF]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Cancelled / Rejected ({cancelled.length})
        </Link>
      </div>

      {tab === "new" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">New Orders</h2>
          <div className="space-y-4">{pending.length ? pendingCards : <p className="text-sm text-slate-400">No new orders.</p>}</div>
        </section>
      )}

      {tab === "in-progress" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">In Progress</h2>
          <div className="space-y-4">
            {inProgress.length ? inProgressCards : <p className="text-sm text-slate-400">No in-progress orders.</p>}
          </div>
        </section>
      )}

      {tab === "completed" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">Completed</h2>
          <div className="space-y-4">
            {completed.length ? completedCards : <p className="text-sm text-slate-400">No completed orders.</p>}
          </div>
        </section>
      )}

      {tab === "cancelled" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">Cancelled / Rejected</h2>
          <div className="space-y-4">
            {cancelled.length ? cancelledCards : <p className="text-sm text-slate-400">No cancelled or rejected orders.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
