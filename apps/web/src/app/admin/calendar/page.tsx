import { getBridalOrdersWithRelations } from "@/lib/data";
import Link from "next/link";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableShell } from "@/components/admin/AdminTableShell";

const GROUPS_PER_PAGE = 30;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminCalendarPage({ searchParams }: Props) {
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const { orders } = await getBridalOrdersWithRelations({ activeOnly: true, limit: 2000 });

  const byDate = orders.reduce<
    Record<string, { order: (typeof orders)[0]; customerName?: string }[]>
  >((acc, order) => {
    const key = new Date(order.deliveryDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push({ order, customerName: order.customerName });
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort(
    (a, b) => new Date(byDate[a][0].order.deliveryDate).getTime() - new Date(byDate[b][0].order.deliveryDate).getTime()
  );

  const total = sortedDates.length;
  const totalPages = Math.max(1, Math.ceil(total / GROUPS_PER_PAGE));
  const pagedDates = sortedDates.slice((page - 1) * GROUPS_PER_PAGE, page * GROUPS_PER_PAGE);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Delivery Calendar</h1>
      <AdminTableShell className="!overflow-visible">
        <div className="space-y-6 p-4">
          {pagedDates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-[#4C3BCF] mb-4">{date}</h2>
              <ul className="space-y-3">
                {byDate[date].map(({ order, customerName }) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-sm text-[#4C3BCF] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-slate-600">{customerName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!pagedDates.length && <p className="text-slate-400 text-center py-12">No upcoming deliveries.</p>}
        </div>
      </AdminTableShell>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={GROUPS_PER_PAGE}
        buildHref={(p) => (p > 1 ? `/admin/calendar?page=${p}` : "/admin/calendar")}
      />
    </div>
  );
}
