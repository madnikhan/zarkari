"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { GbpPkrConverter } from "@/components/admin/suppliers/GbpPkrConverter";
import { BridalOrderPicker } from "./BridalOrderPicker";
import { MediaUploadZone, type UploadedFile } from "@/components/boms/MediaUploadZone";
import type { CargoBoxItem, CargoItemKind } from "@/lib/cargo/demo-store";
import { parseJsonResponse } from "@/lib/upload/parse-json";

interface OrderResult {
  id: string;
  orderNumber: string;
  customerName?: string;
  dressType?: string;
}

interface Props {
  boxId: string;
  defaultExchangeRate?: string;
  /** Box received / start date — used as default for new items */
  defaultItemDate?: string;
  item?: CargoBoxItem;
  onClose: () => void;
  onSaved: () => void;
}

export function AddCargoBoxItemModal({
  boxId,
  defaultExchangeRate,
  defaultItemDate,
  item,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(item);
  const [itemKind, setItemKind] = useState<CargoItemKind>(
    item?.itemKind ?? (item?.bridalOrderId ? "custom" : "sample")
  );
  const [itemDate, setItemDate] = useState(
    item?.itemDate ?? defaultItemDate ?? new Date().toISOString().slice(0, 10)
  );
  const [articleName, setArticleName] = useState(item?.articleName ?? "");
  const [order, setOrder] = useState<OrderResult | null>(
    item?.bridalOrderId && item.orderNumber
      ? { id: item.bridalOrderId, orderNumber: item.orderNumber }
      : null
  );
  const [amountGbp, setAmountGbp] = useState(item?.costGbp ?? "");
  const [amountPkr, setAmountPkr] = useState(item?.costPkr ?? "");
  const [exchangeRate, setExchangeRate] = useState(item?.exchangeRate ?? defaultExchangeRate ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [imageKey, setImageKey] = useState(item?.imageKey ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function selectKind(kind: CargoItemKind) {
    setItemKind(kind);
    if (kind === "sample") {
      setOrder(null);
    }
  }

  function onOrderChange(next: OrderResult | null) {
    setOrder(next);
    if (next?.dressType && !articleName.trim()) {
      setArticleName(next.dressType);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (itemKind === "custom" && !order?.id) {
      setError("Select an open custom order");
      setSaving(false);
      return;
    }
    if (!articleName.trim()) {
      setError(itemKind === "sample" ? "Sample name is required" : "Dress name is required");
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
      itemKind,
      articleName: articleName.trim(),
      bridalOrderId: itemKind === "custom" ? order?.id : null,
      orderNumber: itemKind === "custom" ? order?.orderNumber : undefined,
      costGbp: amountGbp || "0",
      costPkr: amountPkr || "0",
      exchangeRate: exchangeRate || undefined,
      imageUrl: imageUrl || undefined,
      imageKey: imageKey || undefined,
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
      const data = await parseJsonResponse<{ error?: string }>(res);
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
          <h2 className="font-semibold text-slate-900">{isEdit ? "Edit item" : "Add item to box"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <div>
            <label className="text-xs text-slate-500 uppercase">Item type</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectKind("custom")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  itemKind === "custom"
                    ? "border-[#4C3BCF] bg-[#F4F3FF] text-[#4C3BCF]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Custom order
              </button>
              <button
                type="button"
                onClick={() => selectKind("sample")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  itemKind === "sample"
                    ? "border-[#4C3BCF] bg-[#F4F3FF] text-[#4C3BCF]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Sample order
              </button>
            </div>
          </div>

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

          {itemKind === "custom" ? (
            <div>
              <label className="text-xs text-slate-500 uppercase">Order no.</label>
              <div className="mt-1">
                <BridalOrderPicker value={order} onChange={onOrderChange} cargoOpen />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Open custom orders only. Saving marks the order Ready for Collection.
              </p>
            </div>
          ) : null}

          <div>
            <label className="text-xs text-slate-500 uppercase">
              {itemKind === "sample" ? "Sample name" : "Dress name"}
            </label>
            <input
              required
              value={articleName}
              onChange={(e) => setArticleName(e.target.value)}
              placeholder={
                itemKind === "sample" ? "e.g. Red sample lehenga" : "e.g. Red bridal lehenga"
              }
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            {itemKind === "sample" ? (
              <p className="text-xs text-slate-400 mt-1">Enter a unique name for this sample piece.</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">
                Defaults from the order dress type when available; you can edit it.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Item photo</label>
            {imageUrl ? (
              <div className="mt-2 flex items-start gap-3">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <Image src={imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageKey("");
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <MediaUploadZone
                  label="Upload photo"
                  accept="image/*"
                  category="cargo-item"
                  showCameraButtons
                  sizeHint="Photos up to 4 MB"
                  onSingleUploaded={(file: UploadedFile) => {
                    setImageUrl(file.url);
                    setImageKey(file.name);
                  }}
                />
              </div>
            )}
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
              {saving ? "Saving…" : isEdit ? "Update item" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
