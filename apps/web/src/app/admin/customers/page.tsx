import { getCustomersWithOrders } from "@/lib/data";
import { CustomersPageClient } from "@/components/admin/CustomersPageClient";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const { customers, total } = await getCustomersWithOrders({
    q: q.trim() || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Customers</h1>
      <CustomersPageClient
        customers={customers}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q.trim()}
      />
    </div>
  );
}
