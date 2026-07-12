"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { GbpPkrConverter } from "@/components/admin/suppliers/GbpPkrConverter";
import { BridalOrderPicker } from "./BridalOrderPicker";
import type { CargoBoxItem } from "@/lib/cargo/demo-store";

interface OrderResult {
  id: string;
  orderNumber: string;
  customerName?: string;
}

interface Props {
  boxId: string;
  defaultExchangeRate?: string;
  item?: CargoBoxItem;
  onClose: () => void;
  onSaved: () => void;
}

export function AddCargoBoxItemModal({ boxId, defaultExchangeRate, item, onClose, onSaved }: Props) {
  const isEdit = Boolean(item);
  const [itemDate, setItemDate] = useState(item?.itemDate ?? new Date().toISOString().slice(0, 10));
  const [articleName, setArticleName] = useState(item?.articleName ?? "");
  const [order, setOrder] = useState<OrderResult | null>(
    item?.bridalOrderId && item.orderNumber
      ? { id: item.bridalOrderId, orderNumber: item.orderNumber }
      : null
  );
  const [amountGbp, setAmountGbp] = useState(item?.costGbp ?? "");
  const [amountPkr, setAmountPkr] = useState(item?.costPkr ?? "");
  const [exchangeRate, setExchangeRate] = useState(item?.exchangeRate ?? defaultExchangeRate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (!articleName.trim()) {
      setError("Dress name is required");
      setSaving(false);
      return;
    }
    const pkr = parseFloat(amountPkr || "0");
    const gbp = parseFloat(amountGbp || "0");
    if ((!pkr || pkr <= 0) && (!gbp || gbp <= 0)) {
      setError("Enter a cost price in PKR and/or GBP");
      setSaving(false);
      return;
    }
    const payload = {
      itemDate,
      articleName: articleName.trim(),
      bridalOrderId: order?.id,
      orderNumber: order?.orderNumber,
      costGbp: amountGbp || "0",
      costPkr: amountPkr || "0",
      exchangeRate: exchangeRate || undefined,
    };
    try {
      const url = isEdit
        ? `/api/cargo/boxes/${boxId}/items/${item!.id}`
        : `/api/cargo/boxes/${boxId}/items`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save item");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{isEdit ? "Edit dress" : "Add dress to box"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Date</label>
              <input
                type="date"
                required
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Order no.</label>
              <div className="mt-1">
                <BridalOrderPicker value={order} onChange={setOrder} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Dress name</label>
            <input
              required
              value={articleName}
              onChange={(e) => setArticleName(e.target.value)}
              placeholder="e.g. Red bridal lehenga"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter the dress name and its manufacturing cost price below.
            </p>
          </div>
          <GbpPkrConverter
            amountGbp={amountGbp}
            amountPkr={amountPkr}
            exchangeRate={exchangeRate}
            onGbpChange={setAmountGbp}
            onPkrChange={setAmountPkr}
            onRateChange={setExchangeRate}
          />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 boms-btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Update dress" : "Add dress"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
