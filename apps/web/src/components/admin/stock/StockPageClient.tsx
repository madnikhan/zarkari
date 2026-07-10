"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, History } from "lucide-react";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";
import type { StockOverviewRow } from "@/lib/db/cms-products";
import { StockAdjustModal } from "./StockAdjustModal";

const MOVEMENT_LABELS: Record<string, string> = {
  receive: "Received",
  sale: "Sold",
  adjustment: "Adjusted",
  return: "Returned",
};

interface Props {
  products: StockOverviewRow[];
}

export function StockPageClient({ products: initial }: Props) {
  const [products, setProducts] = useState(initial);
  const [adjustProduct, setAdjustProduct] = useState<StockOverviewRow | null>(null);
  const [historyProduct, setHistoryProduct] = useState<StockOverviewRow | null>(null);
  const [movements, setMovements] = useState<
    {
      id: string;
      type: string;
      quantityDelta: number;
      quantityAfter: number;
      notes: string | null;
      createdAt: Date;
    }[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function refresh() {
    const res = await fetch("/api/stock");
    const data = await res.json();
    if (data.products) setProducts(data.products);
  }

  async function openHistory(product: StockOverviewRow) {
    setHistoryProduct(product);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/stock/${product.id}/movements`);
      const data = await res.json();
      setMovements(data.movements ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }

  const lowStockCount = products.filter((p) => p.lowStock).length;

  return (
    <div>
      {lowStockCount > 0 && (
        <div className="mb-4 flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {lowStockCount} product{lowStockCount === 1 ? "" : "s"} with low stock
        </div>
      )}

      <div className="boms-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Product</th>
              {STANDARD_SIZES.map((s) => (
                <th key={s} className="text-center px-2 py-3 font-medium text-slate-500">
                  {s}
                </th>
              ))}
              <th className="text-center px-3 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className={p.lowStock ? "bg-amber-50/40" : "hover:bg-slate-50/50"}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.featuredImageUrl && (
                      <div className="relative w-10 h-12 rounded overflow-hidden bg-slate-100 shrink-0">
                        <Image src={p.featuredImageUrl} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{p.title}</p>
                      {p.lowStock && (
                        <span className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold">
                          Low stock
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {STANDARD_SIZES.map((s) => {
                  const qty = p.sizeStock[s as StandardSizeKey];
                  const variant = p.variants.find((v) => v.size === s);
                  const threshold = variant?.lowStockThreshold ?? 2;
                  const isLow = qty > 0 && qty <= threshold;
                  return (
                    <td key={s} className={`text-center px-2 py-3 font-mono ${isLow ? "text-amber-700 font-semibold" : ""}`}>
                      {qty}
                    </td>
                  );
                })}
                <td className="text-center px-3 py-3 font-semibold">{p.totalStock}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustProduct(p)}
                      className="text-xs text-[#4C3BCF] hover:underline"
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => openHistory(p)}
                      className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1"
                    >
                      <History className="h-3 w-3" />
                      History
                    </button>
                    <Link href={`/admin/content/products/${p.id}`} className="text-xs text-slate-400 hover:underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && (
          <p className="text-center text-slate-400 py-12 text-sm">No products yet.</p>
        )}
      </div>

      {adjustProduct && (
        <StockAdjustModal
          productId={adjustProduct.id}
          productTitle={adjustProduct.title}
          sizeStock={adjustProduct.sizeStock}
          onClose={() => setAdjustProduct(null)}
          onSaved={refresh}
        />
      )}

      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold">Stock history — {historyProduct.title}</h2>
              <button type="button" onClick={() => setHistoryProduct(null)} className="text-slate-400 hover:text-slate-600 text-sm">
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {loadingHistory ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : movements.length ? (
                <ul className="space-y-3">
                  {movements.map((m) => (
                    <li key={m.id} className="text-sm border-b border-slate-100 pb-3 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</span>
                        <span className={m.quantityDelta < 0 ? "text-red-600" : "text-emerald-600"}>
                          {m.quantityDelta > 0 ? "+" : ""}
                          {m.quantityDelta}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        After: {m.quantityAfter} · {new Date(m.createdAt).toLocaleString("en-GB")}
                      </p>
                      {m.notes && <p className="text-xs text-slate-500 mt-0.5">{m.notes}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No movements yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
