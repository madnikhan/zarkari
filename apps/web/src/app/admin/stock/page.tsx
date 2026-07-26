import { Suspense } from "react";
import { listStockOverviewDb } from "@/lib/db/cms-products";
import { StockPageWrapper } from "@/components/admin/stock/StockPageWrapper";
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

export default async function StockPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "", from, to, preset } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const bounds = resolveSearchDateBounds({ from, to, preset });
  const dateQuery = dateSearchQuery({ from, to, preset });

  const { products, total } = await listStockOverviewDb({
    q: q.trim() || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    from: bounds.from,
    to: bounds.to,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
        <p className="text-sm text-slate-500 mt-1">
          Internal warehouse and shop (storefront) inventory by size — website sells shop stock only
        </p>
      </div>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminDateRangeFilter preserveKeys={["q", "page"]} />
        </Suspense>
      </div>
      <StockPageWrapper
        products={products}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q.trim()}
        dateQuery={dateQuery}
      />
    </div>
  );
}
