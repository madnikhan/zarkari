"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  Pencil,
  Printer,
  Trash2,
  Plus,
  Calendar,
  Truck,
  Barcode,
  Scale,
  User,
  ListChecks,
  Banknote,
} from "lucide-react";
import type { CargoBox, CargoBoxItem, CargoCompany } from "@/lib/cargo/demo-store";
import type { Supplier } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import { parseJsonResponse } from "@/lib/upload/parse-json";
import { AddCargoBoxItemModal } from "./AddCargoBoxItemModal";

interface Props {
  box: CargoBox;
  companies: CargoCompany[];
  suppliers: Supplier[];
  onRefresh: () => void;
  onDeleted: () => void;
}

function InfoField({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5 min-w-0">
      <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <div className="text-sm font-medium text-slate-900 truncate">{children}</div>
      </div>
    </div>
  );
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
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<CargoBoxItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const items = box.items ?? [];
  const totalPkr = box.totalCostPkr ?? items.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0);
  const totalGbp = box.totalCostGbp ?? items.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0);

  useEffect(() => {
    setCargoCompanyId(box.cargoCompanyId);
    setTrackingNumber(box.trackingNumber);
    setSupplierId(box.supplierId);
    setReceivedDate(box.receivedDate);
    setWeightKg(box.weightKg ?? "");
    setNotes(box.notes ?? "");
    setExchangeRate(box.exchangeRate ?? "");
    setEditing(false);
    setSelectedItems(new Set());
    setError("");
  }, [box.id, box.updatedAt]);

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
      const data = await parseJsonResponse<{ error?: string }>(res);
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
      const data = await parseJsonResponse<{ error?: string }>(res);
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
      const data = await parseJsonResponse<{ error?: string }>(res);
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
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to delete item");
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
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

  function toggleAll() {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((i) => i.id)));
    }
  }

  function editSelected() {
    if (selectedItems.size === 0) {
      setError("Select one item to edit.");
      return;
    }
    if (selectedItems.size > 1) {
      setError("Select exactly one item to edit.");
      return;
    }
    const id = [...selectedItems][0];
    const item = items.find((i) => i.id === id);
    if (!item) {
      setError("Selected item not found.");
      return;
    }
    setError("");
    setEditItem(item);
  }

  async function deleteSelected() {
    if (selectedItems.size === 0) {
      setError("Select at least one item to delete.");
      return;
    }
    if (!confirm(`Delete ${selectedItems.size} selected item(s)?`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      for (const itemId of selectedItems) {
        const res = await fetch(`/api/cargo/boxes/${box.id}/items/${itemId}`, { method: "DELETE" });
        const data = await parseJsonResponse<{ error?: string }>(res);
        if (!res.ok) throw new Error(data.error ?? "Failed to delete item");
      }
      setSelectedItems(new Set());
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete selected items");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="boms-card flex flex-col min-h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Box Details - <span className="font-mono text-[#4C3BCF]">{box.boxNumber}</span>
          </h2>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#4C3BCF] text-[#4C3BCF] rounded-lg hover:bg-[#F4F3FF]"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Link>
          <button
            type="button"
            onClick={() => void deleteBox()}
            disabled={deleting || Boolean(box.khataEntryId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
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
              <label className="text-xs text-slate-500">Date Received</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Cargo Company</label>
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
              <label className="text-xs text-slate-500">Tracking Number</label>
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
              <label className="text-xs text-slate-500">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <InfoField icon={Calendar} label="Date Received">
                {new Date(box.receivedDate).toLocaleDateString("en-GB")}
              </InfoField>
              <InfoField icon={Truck} label="Cargo Company">
                {box.cargoCompanyName || "—"}
              </InfoField>
              <InfoField icon={Barcode} label="Tracking Number">
                <span className="font-mono">{box.trackingNumber || "—"}</span>
              </InfoField>
              <InfoField icon={Scale} label="Weight">
                {box.weightKg ? `${box.weightKg} kg` : "—"}
              </InfoField>
              <InfoField icon={User} label="Supplier">
                {box.supplierName || "—"}
              </InfoField>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Notes (optional)</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 min-h-[2.5rem]">
                {box.notes || "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1" data-tour="cargo-items">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Box Contents / Items</h3>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddItem(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg boms-btn-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
            <button
              type="button"
              onClick={editSelected}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Edit Selected
            </button>
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
            >
              {bulkDeleting ? "Deleting…" : "Delete Selected"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 min-w-[6.5rem]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-400">
                <ListChecks className="h-3 w-3" /> Total Items
              </div>
              <p className="text-lg font-semibold text-slate-900">{items.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 min-w-[7.5rem]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-400">
                <Banknote className="h-3 w-3 text-emerald-600" /> Total Cost (PKR)
              </div>
              <p className="text-lg font-semibold text-emerald-600">
                {totalPkr.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 min-w-[7.5rem]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-400">
                <Banknote className="h-3 w-3 text-blue-600" /> Total Cost (£ GBP)
              </div>
              <p className="text-lg font-semibold text-blue-600">{formatPrice(String(totalGbp))}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-800 text-left text-white">
                <th className="py-2.5 px-2 w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={toggleAll}
                    className="rounded border-slate-400"
                    aria-label="Select all items"
                  />
                </th>
                <th className="py-2.5 px-2 font-medium w-14">Photo</th>
                <th className="py-2.5 px-2 font-medium">Date</th>
                <th className="py-2.5 px-2 font-medium">Article Name</th>
                <th className="py-2.5 px-2 font-medium">Order Number</th>
                <th className="py-2.5 px-2 font-medium text-right">Cost Price (PKR)</th>
                <th className="py-2.5 px-2 font-medium text-right">Cost Price (£ GBP)</th>
                <th className="py-2.5 px-2 font-medium text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-2 px-2">
                      {item.imageUrl ? (
                        <div className="relative h-10 w-10 rounded overflow-hidden border border-slate-200 bg-slate-50">
                          <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                      {new Date(item.itemDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2 px-2 font-medium">{item.articleName}</td>
                    <td className="py-2 px-2 font-mono text-[#4C3BCF] text-xs">
                      {item.orderNumber ? (
                        <Link href={`/admin/orders/${item.bridalOrderId}`} className="hover:underline">
                          {item.orderNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {parseFloat(item.costPkr).toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2 px-2 text-right">{formatPrice(item.costGbp)}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditItem(item)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
                          aria-label="Edit item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteItem(item.id)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    Add items with cost prices (PKR and GBP)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Box Summary</h3>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px] border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="py-2 px-3 font-medium">Total Items</th>
                <th className="py-2 px-3 font-medium">Total Cost (PKR)</th>
                <th className="py-2 px-3 font-medium">Total Cost (£ GBP)</th>
                <th className="py-2 px-3 font-medium">Weight</th>
                <th className="py-2 px-3 font-medium">Supplier</th>
                <th className="py-2 px-3 font-medium">Cargo Company</th>
                <th className="py-2 px-3 font-medium">Tracking Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2.5 px-3 font-semibold">{items.length}</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-600">
                  {totalPkr.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 font-semibold text-blue-600">{formatPrice(String(totalGbp))}</td>
                <td className="py-2.5 px-3">{box.weightKg ? `${box.weightKg} kg` : "—"}</td>
                <td className="py-2.5 px-3">{box.supplierName || "—"}</td>
                <td className="py-2.5 px-3">{box.cargoCompanyName || "—"}</td>
                <td className="py-2.5 px-3 font-mono text-xs">{box.trackingNumber || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
          Each box has its own separate page. All information related to this box is stored here including
          supplier, cargo company, tracking number, weight and all items with cost prices.
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
