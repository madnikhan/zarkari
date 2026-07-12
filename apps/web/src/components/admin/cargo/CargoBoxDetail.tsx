"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Printer, Trash2, Plus } from "lucide-react";
import type { CargoBox, CargoBoxItem, CargoCompany } from "@/lib/cargo/demo-store";
import type { Supplier } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import { AddCargoBoxItemModal } from "./AddCargoBoxItemModal";

interface Props {
  box: CargoBox;
  companies: CargoCompany[];
  suppliers: Supplier[];
  onRefresh: () => void;
  onDeleted: () => void;
}

export function CargoBoxDetail({ box, companies, suppliers, onRefresh, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [cargoCompanyId, setCargoCompanyId] = useState(box.cargoCompanyId);
  const [trackingNumber, setTrackingNumber] = useState(box.trackingNumber);
  const [supplierId, setSupplierId] = useState(box.supplierId);
  const [receivedDate, setReceivedDate] = useState(box.receivedDate);
  const [weightKg, setWeightKg] = useState(box.weightKg ?? "");
  const [notes, setNotes] = useState(box.notes ?? "");
  const [exchangeRate, setExchangeRate] = useState(box.exchangeRate ?? "");
  const [saving, setSaving] = useState(false);
  const [postingKhata, setPostingKhata] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<CargoBoxItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const items = box.items ?? [];
  const totalPkr = box.totalCostPkr ?? items.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0);
  const totalGbp = box.totalCostGbp ?? items.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0);

  function resetForm() {
    setCargoCompanyId(box.cargoCompanyId);
    setTrackingNumber(box.trackingNumber);
    setSupplierId(box.supplierId);
    setReceivedDate(box.receivedDate);
    setWeightKg(box.weightKg ?? "");
    setNotes(box.notes ?? "");
    setExchangeRate(box.exchangeRate ?? "");
  }

  async function saveBox() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cargo/boxes/${box.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargoCompanyId,
          trackingNumber,
          supplierId,
          receivedDate,
          weightKg: weightKg || undefined,
          notes: notes || undefined,
          exchangeRate: exchangeRate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setEditing(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBox() {
    if (box.khataEntryId) {
      alert("This box has been posted to khata and cannot be deleted.");
      return;
    }
    if (!confirm(`Delete box ${box.boxNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cargo/boxes/${box.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function postToKhata() {
    setPostingKhata(true);
    setError("");
    try {
      const res = await fetch(`/api/cargo/boxes/${box.id}/post-khata`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to post to khata");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post to khata");
    } finally {
      setPostingKhata(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Remove this item from the box?")) return;
    try {
      const res = await fetch(`/api/cargo/boxes/${box.id}/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete item");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="boms-card flex flex-col min-h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-slate-100">
        <div>
          <h2 className="font-mono text-lg font-semibold text-[#4C3BCF]">{box.boxNumber}</h2>
          <p className="text-sm text-slate-500">{box.cargoCompanyName}</p>
          {box.khataEntryId && (
            <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
              Posted to khata
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Box Info
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditing(false);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveBox()}
                disabled={saving}
                className="boms-btn-primary px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
          <Link
            href={`/admin/cargo/${box.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Link>
          <button
            type="button"
            onClick={() => void deleteBox()}
            disabled={deleting || Boolean(box.khataEntryId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Box
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="p-4 border-b border-slate-100">
        <h3 className="text-xs font-medium uppercase text-slate-500 mb-3">Box / Cargo Information</h3>
        {editing ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Received date</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Cargo company</label>
              <select
                value={cargoCompanyId}
                onChange={(e) => setCargoCompanyId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Tracking no.</label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Exchange rate</label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-slate-500">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Received</dt>
              <dd>{new Date(box.receivedDate).toLocaleDateString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Cargo company</dt>
              <dd>{box.cargoCompanyName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Tracking</dt>
              <dd className="font-mono">{box.trackingNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Weight</dt>
              <dd>{box.weightKg ? `${box.weightKg} kg` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Supplier</dt>
              <dd>{box.supplierName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Exchange rate</dt>
              <dd>{box.exchangeRate ?? "—"}</dd>
            </div>
            {box.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs text-slate-400">Notes</dt>
                <dd className="text-slate-600">{box.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase">Total Items</p>
          <p className="text-xl font-semibold text-slate-900">{items.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase">Total PKR</p>
          <p className="text-xl font-semibold text-slate-900">Rs {totalPkr.toLocaleString("en-GB")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase">Total GBP</p>
          <p className="text-xl font-semibold text-slate-900">{formatPrice(String(totalGbp))}</p>
        </div>
      </div>

      <div className="p-4 flex-1" data-tour="cargo-items">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Dresses in this box</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record each dress name with its cost price (PKR and/or GBP)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-1 text-xs text-[#4C3BCF] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add dress
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="py-2 pr-2 w-8" />
                <th className="py-2 pr-2 font-medium text-slate-500">Date</th>
                <th className="py-2 pr-2 font-medium text-slate-500">Dress name</th>
                <th className="py-2 pr-2 font-medium text-slate-500">Order</th>
                <th className="py-2 pr-2 font-medium text-slate-500 text-right">Cost (PKR)</th>
                <th className="py-2 pr-2 font-medium text-slate-500 text-right">Cost (GBP)</th>
                <th className="py-2 font-medium text-slate-500 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-2 pr-2 text-slate-600 whitespace-nowrap">
                      {new Date(item.itemDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2 pr-2 font-medium">{item.articleName}</td>
                    <td className="py-2 pr-2 font-mono text-[#4C3BCF] text-xs">
                      {item.orderNumber ? (
                        <Link href={`/admin/orders/${item.bridalOrderId}`} className="hover:underline">
                          {item.orderNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">Rs {parseFloat(item.costPkr).toLocaleString("en-GB")}</td>
                    <td className="py-2 pr-2 text-right">{formatPrice(item.costGbp)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditItem(item)}
                        className="text-xs text-[#4C3BCF] hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteItem(item.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Add each dress with its cost price
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>
              <span className="font-medium text-slate-700">Summary:</span> {items.length} items · Rs{" "}
              {totalPkr.toLocaleString("en-GB")} · {formatPrice(String(totalGbp))}
              {box.weightKg && ` · ${box.weightKg} kg`}
              {box.supplierName && ` · ${box.supplierName}`}
              {box.trackingNumber && ` · ${box.trackingNumber}`}
            </p>
          </div>
          {!box.khataEntryId && (
            <button
              type="button"
              onClick={() => void postToKhata()}
              disabled={postingKhata || items.length === 0}
              data-tour="cargo-khata"
              className="px-4 py-2 text-xs border border-[#4C3BCF] text-[#4C3BCF] rounded-lg hover:bg-[#F4F3FF] disabled:opacity-40"
            >
              {postingKhata ? "Posting…" : "Post to khata"}
            </button>
          )}
        </div>
      </div>

      {(showAddItem || editItem) && (
        <AddCargoBoxItemModal
          boxId={box.id}
          defaultExchangeRate={box.exchangeRate}
          item={editItem ?? undefined}
          onClose={() => {
            setShowAddItem(false);
            setEditItem(null);
          }}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}
