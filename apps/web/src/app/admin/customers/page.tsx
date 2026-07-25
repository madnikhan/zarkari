import { Suspense } from "react";
import { getCustomersWithOrders } from "@/lib/data";
import { CustomersPageClient } from "@/components/admin/CustomersPageClient";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { dateSearchQuery, resolveSearchDateBounds } from "@/lib/admin/date-range";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "", from, to, preset } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const bounds = resolveSearchDateBounds({ from, to, preset });
  const dateQuery = dateSearchQuery({ from, to, preset });

  const { customers, total } = await getCustomersWithOrders({
    q: q.trim() || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    from: bounds.from,
    to: bounds.to,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Customers</h1>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminDateRangeFilter preserveKeys={["q", "page"]} />
        </Suspense>
      </div>
      <CustomersPageClient
        customers={customers}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q.trim()}
        dateQuery={dateQuery}
      />
    </div>
  );
}
