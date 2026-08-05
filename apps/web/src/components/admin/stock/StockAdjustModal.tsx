"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";

interface Props {
  productId: string;
  productTitle: string;
  sizeStock: Record<StandardSizeKey, number>;
  internalStock: Record<StandardSizeKey, number>;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = "receive" | "to_storefront" | "to_internal" | "adjustment";

export function StockAdjustModal({
  productId,
  productTitle,
  sizeStock,
  internalStock,
  onClose,
  onSaved,
}: Props) {
  const [size, setSize] = useState<StandardSizeKey>("M");
  const [mode, setMode] = useState<Mode>("receive");
  const [location, setLocation] = useState<"internal" | "storefront">("internal");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shopQty = sizeStock[size] ?? 0;
  const intQty = internalStock[size] ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError("Enter a positive quantity");
      setLoading(false);
      return;
    }

    try {
      if (mode === "to_storefront" || mode === "to_internal") {
        const res = await fetch("/api/stock/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            size,
            quantity: qty,
            direction: mode,
            notes: notes || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
      } else {
        const signedDelta = mode === "adjustment" ? -Math.abs(qty) : qty;
        const loc = mode === "receive" ? "internal" : location;
        const res = await fetch("/api/stock/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            size,
            quantityDelta: signedDelta,
            type: mode === "receive" ? "receive" : "adjustment",
            location: loc,
            notes: notes || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Manage stock</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <p className="text-sm text-slate-600">{productTitle}</p>
          <div>
            <label className="text-xs text-slate-500 uppercase">Action</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="receive">Receive into warehouse</option>
              <option value="to_storefront">Transfer warehouse → shop stock</option>
              <option value="to_internal">Transfer shop stock → warehouse</option>
              <option value="adjustment">Write-off / remove</option>
            </select>
          </div>
          {mode === "adjustment" && (
            <div>
              <label className="text-xs text-slate-500 uppercase">From location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as "internal" | "storefront")}
                className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="internal">Warehouse</option>
                <option value="storefront">Shop stock</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 uppercase">Size</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {STANDARD_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`px-3 py-1.5 text-sm border rounded-lg ${
                    size === s ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200"
                  }`}
                >
                  {s}
                  <span className="block text-[10px] opacity-80">
                    W{internalStock[s] ?? 0}/S{sizeStock[s] ?? 0}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {size}: warehouse {intQty} · shop {shopQty}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="boms-btn-primary w-full py-2.5 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
