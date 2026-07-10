import { listStockOverviewDb } from "@/lib/db/cms-products";
import { StockPageWrapper } from "@/components/admin/stock/StockPageWrapper";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function StockPage({ searchParams }: Props) {
  const { page: pageStr = "1", q = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const { products, total } = await listStockOverviewDb({
    q: q.trim() || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
        <p className="text-sm text-slate-500 mt-1">Ready-made inventory by size (S–XXL)</p>
      </div>
      <StockPageWrapper
        products={products}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q.trim()}
      />
    </div>
  );
}
