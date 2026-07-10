import { getUnifiedOrders } from "@/lib/db/unified-orders";
import { OrdersPageClient } from "@/components/admin/OrdersPageClient";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ type?: string; tab?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { type = "all", tab = "recent", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const typeFilter = ["all", "custom", "online", "walk_in"].includes(type) ? type : "all";

  let tabKey = tab;
  if (typeFilter === "custom" && !["active", "overdue", "due-week", "completed", "cancelled", "refunded"].includes(tab)) {
    tabKey = "active";
  } else if ((typeFilter === "online" || typeFilter === "walk_in") && !tab.startsWith("shop-")) {
    tabKey = "shop-open";
  } else if (typeFilter === "all" && !["recent", "open", "completed", "cancelled"].includes(tab)) {
    tabKey = "recent";
  }

  const { orders, total } = await getUnifiedOrders({
    type: typeFilter as "all" | "custom" | "online" | "walk_in",
    tab: tabKey,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <OrdersPageClient
      orders={orders}
      total={total}
      page={page}
      totalPages={totalPages}
      typeFilter={typeFilter}
      tab={tabKey}
    />
  );
}
