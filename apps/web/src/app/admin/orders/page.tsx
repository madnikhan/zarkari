import Link from "next/link";
import { getBridalOrders, getCustomer, getSupplier } from "@/lib/data";
import { OrdersTable } from "@/components/boms/OrdersTable";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { tab = "active", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const orders = await getBridalOrders();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);

  const filtered = orders.filter((o) => {
    if (tab === "completed") return o.status === "collected";
    if (tab === "overdue") return new Date(o.deliveryDate) < now && !["collected", "cancelled", "refunded"].includes(o.status);
    if (tab === "due-week") {
      const d = new Date(o.deliveryDate);
      return d >= now && d <= weekEnd && !["collected", "cancelled", "refunded"].includes(o.status);
    }
    return !["collected", "cancelled", "refunded"].includes(o.status);
  });

  const rows = await Promise.all(
    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(async (order) => ({
      order,
      customer: await getCustomer(order.customerId),
      supplierName: order.supplierId ? (await getSupplier(order.supplierId))?.name : undefined,
    }))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const tabs = [
    { key: "active", label: "Active" },
    { key: "overdue", label: "Overdue" },
    { key: "due-week", label: "Due This Week" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <Link href="/admin/orders/new" className="boms-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium">
          New Order
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders?tab=${t.key}`}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              tab === t.key ? "boms-btn-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <OrdersTable rows={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/orders?tab=${tab}&page=${page - 1}`}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/orders?tab=${tab}&page=${page + 1}`}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
