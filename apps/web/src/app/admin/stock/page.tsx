import { listStockOverviewDb } from "@/lib/db/cms-products";
import { StockPageClient } from "@/components/admin/stock/StockPageClient";

export default async function StockPage() {
  const products = await listStockOverviewDb();

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
        <p className="text-sm text-slate-500 mt-1">Ready-made inventory by size (S–XXL)</p>
      </div>
      <StockPageClient products={products} />
    </div>
  );
}
