"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";
import { formatPrice } from "@/lib/utils";

type ProductOption = {
  id: string;
  title: string;
  variants: { id: string; size: StandardSizeKey; inventoryQty: number; price: string }[];
};

type LineItem = {
  productId: string;
  size: StandardSizeKey;
  quantity: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function WalkInSaleForm({ open, onClose, onCreated }: Props) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", size: "M", quantity: 1 }]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/stock")
      .then((r) => r.json())
      .then(async (d) => {
        const enriched = await Promise.all(
          (d.products ?? []).map(
            async (p: {
              id: string;
              title: string;
              sizeStock: Record<StandardSizeKey, number>;
              variants: { id: string; size: StandardSizeKey; inventoryQty: number }[];
            }) => {
              const detail = await fetch(`/api/products?id=${p.id}`)
                .then((r) => r.json())
                .catch(() => null);
              const productVariants = detail?.product?.variants ?? [];
              return {
                id: p.id,
                title: p.title,
                variants: p.variants.map((v) => ({
                  id: v.id,
                  size: v.size,
                  inventoryQty: p.sizeStock[v.size] ?? 0,
                  price:
                    productVariants.find((pv: { id: string; price: string }) => pv.id === v.id)?.price ??
                    productVariants[0]?.price ??
                    "0",
                })),
              };
            }
          )
        );
        setProducts(enriched);
      })
      .catch(() => setProducts([]));
  }, [open]);

  function addLine() {
    setLines((prev) => [...prev, { productId: "", size: "M", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  const total = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.size === line.size);
    if (!variant) return sum;
    return sum + parseFloat(variant.price) * line.quantity;
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validLines = lines.filter((l) => l.productId);
    if (!validLines.length) {
      setError("Add at least one product");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/retail-orders/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          paymentMethod,
          items: validLines,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onCreated();
      onClose();
      setLines([{ productId: "", size: "M", quantity: 1 }]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">Walk-in sale</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Customer name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Phone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase">Payment</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card")}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase">Items</p>
            {lines.map((line, index) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={index} className="border border-slate-100 rounded-lg p-3 space-y-2">
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(index, { productId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    required={index === 0}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 items-center">
                    <select
                      value={line.size}
                      onChange={(e) => updateLine(index, { size: e.target.value as StandardSizeKey })}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {STANDARD_SIZES.map((s) => {
                        const stock = product?.variants.find((v) => v.size === s)?.inventoryQty ?? 0;
                        return (
                          <option key={s} value={s} disabled={stock <= 0}>
                            {s} ({stock} in stock)
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: parseInt(e.target.value, 10) || 1 })}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center"
                    />
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={addLine} className="text-sm text-[#4C3BCF] flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add item
            </button>
          </div>

          <p className="text-lg font-semibold">Total: {formatPrice(total.toFixed(2))}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="boms-btn-primary w-full py-2.5 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Processing…" : "Complete sale"}
          </button>
        </form>
      </div>
    </div>
  );
}
