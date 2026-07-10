import { getActiveFinanceSummary, getBridalOrdersWithRelations, getPaymentsForOrders } from "@/lib/data";
import { PaymentsPageClient } from "@/components/admin/PaymentsPageClient";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const [summary, { orders, total }] = await Promise.all([
    getActiveFinanceSummary(),
    getBridalOrdersWithRelations({
      activeOnly: true,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      q: q.trim() || undefined,
    }),
  ]);

  const payments = await getPaymentsForOrders(orders.map((o) => o.id));
  const paymentCountByOrder = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.orderId] = (acc[p.orderId] ?? 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PaymentsPageClient
      summary={summary}
      orders={orders}
      page={page}
      totalPages={totalPages}
      total={total}
      q={q.trim()}
      paymentCountByOrder={paymentCountByOrder}
    />
  );
}
