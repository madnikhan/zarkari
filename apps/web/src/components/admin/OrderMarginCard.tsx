import { formatPrice } from "@/lib/utils";
import type { OrderMarginResult } from "@/lib/finance/order-margin";

export function OrderMarginCard({ margin }: { margin: OrderMarginResult }) {
  if (margin.costGbp === null) {
    return (
      <div className="boms-card p-4 mb-4">
        <h2 className="text-xs font-semibold uppercase text-slate-500 mb-2">Profit margin</h2>
        <p className="text-sm text-slate-500">
          Cost not available yet — link a cargo item or wait for supplier completion cost.
        </p>
      </div>
    );
  }

  const costLabel = margin.costSource === "cargo" ? "Cargo cost" : "Supplier cost";

  return (
    <div className="boms-card p-4 mb-4">
      <h2 className="text-xs font-semibold uppercase text-slate-500 mb-3">Profit margin</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400">Selling price</p>
          <p className="font-medium">{formatPrice(String(margin.sellingPriceGbp.toFixed(2)))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">{costLabel}</p>
          <p className="font-medium">{formatPrice(String(margin.costGbp.toFixed(2)))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Profit</p>
          <p
            className={`font-medium ${
              (margin.profitGbp ?? 0) >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatPrice(String((margin.profitGbp ?? 0).toFixed(2)))}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Margin</p>
          <p className="font-medium">{(margin.marginPercent ?? 0).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
