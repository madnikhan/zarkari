import { getBridalOrders, getCustomer } from "@/lib/data";
import Link from "next/link";
import { StatusBadge } from "@/components/boms/StatusBadge";

export default async function AdminCalendarPage() {
  const orders = await getBridalOrders();
  const active = orders.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));

  const enriched = await Promise.all(
    active.map(async (order) => ({
      order,
      customer: await getCustomer(order.customerId),
    }))
  );

  const byDate = enriched.reduce<Record<string, typeof enriched>>((acc, row) => {
    const key = new Date(row.order.deliveryDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort(
    (a, b) => new Date(byDate[a][0].order.deliveryDate).getTime() - new Date(byDate[b][0].order.deliveryDate).getTime()
  );

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Delivery Calendar</h1>
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="boms-card p-6">
            <h2 className="text-sm font-semibold text-[#4C3BCF] mb-4">{date}</h2>
            <ul className="space-y-3">
              {byDate[date].map(({ order, customer }) => (
                <li key={order.id} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-[#4C3BCF] hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-sm text-slate-600">{customer?.name}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!sortedDates.length && <p className="text-slate-400 text-center py-12">No upcoming deliveries.</p>}
      </div>
    </div>
  );
}
