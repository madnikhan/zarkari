import { getBridalOrdersWithRelations, getSupplierTabCounts } from "@/lib/data";
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

  const [counts, { orders }] = await Promise.all([
    getSupplierTabCounts(session.supplierId),
    getBridalOrdersWithRelations({
      supplierId: session.supplierId,
      supplierTab: tab,
      limit: 50,
    }),
  ]);

  const tabLink = (t: SupplierTab) => `/supplier?tab=${encodeURIComponent(t)}`;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Your Orders</h1>

      <div className="grid grid-cols-2 gap-2 mb-6">
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
          Cancelled / Rejected ({counts.cancelled})
        </Link>
      </div>

      {tab === "new" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">New Orders</h2>
          <div className="space-y-4">
            {orders.length ? (
              orders.map((order) => (
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
            ) : (
              <p className="text-sm text-slate-400">No new orders.</p>
            )}
          </div>
        </section>
      )}

      {tab === "in-progress" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">In Progress</h2>
          <div className="space-y-4">
            {orders.length ? (
              orders.map((order) => (
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
                      <div className="mt-2">
                        <CountdownBadge deliveryDate={order.deliveryDate} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-400">No in-progress orders.</p>
            )}
          </div>
        </section>
      )}

      {tab === "completed" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">Completed</h2>
          <div className="space-y-4">
            {orders.length ? (
              orders.map((order) => (
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
                      <div className="mt-2">
                        <CountdownBadge deliveryDate={order.deliveryDate} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-400">No completed orders.</p>
            )}
          </div>
        </section>
      )}

      {tab === "cancelled" && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-3 font-semibold">Cancelled / Rejected</h2>
          <div className="space-y-4">
            {orders.length ? (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/supplier/orders/${order.id}`}
                  className="boms-card p-5 block opacity-80 hover:opacity-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{order.orderNumber}</p>
                      <p className="font-medium text-slate-900 mt-1">{order.customerName}</p>
                      <p className="text-sm text-slate-500">{order.dressType}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-400">No cancelled or rejected orders.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
