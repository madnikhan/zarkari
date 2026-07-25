"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { GbpPkrConverter } from "./GbpPkrConverter";
import type { SupplierLedgerEntry } from "@/lib/supplier-ledger/demo-store";

type EntryWithRunning = SupplierLedgerEntry & {
  runningGbp: number;
  runningPkr: number;
};

interface Props {
  entries: EntryWithRunning[];
  canDelete?: boolean;
}

const numCell = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

export function KhataEntriesTable({ entries, canDelete = false }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<EntryWithRunning | null>(null);
  const [description, setDescription] = useState("");
  const [amountGbp, setAmountGbp] = useState("");
  const [amountPkr, setAmountPkr] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [businessDate, setBusinessDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(e: EntryWithRunning) {
    setEditing(e);
    setDescription(e.description ?? "");
    setAmountGbp(e.amountGbp);
    setAmountPkr(e.amountPkr);
    setExchangeRate(e.exchangeRate ?? "");
    setBusinessDate(e.businessDate);
    setError("");
  }

  async function saveEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers/ledger", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          description: description || undefined,
          amountGbp: amountGbp || "0",
          amountPkr: amountPkr || "0",
          exchangeRate: exchangeRate || undefined,
          businessDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(e: EntryWithRunning) {
    if (!confirm("Delete this khata entry? Linked cash transactions will also be removed.")) return;
    setError("");
    const res = await fetch(`/api/suppliers/ledger/${e.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error && !editing && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="boms-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-3 py-2 font-medium text-slate-500">Date</th>
                <th className="text-left px-3 py-2 font-medium text-slate-500">Type</th>
                <th className="text-left px-3 py-2 font-medium text-slate-500">Description</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">GBP</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">PKR</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Balance (GBP)</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Balance (PKR)</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                    {new Date(e.businessDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-3 py-2 capitalize">{e.type}</td>
                  <td className="px-3 py-2 max-w-xs">
                    <p className="truncate" title={e.description ?? e.billNumber ?? undefined}>
                      {e.description ?? e.billNumber ?? "—"}
                    </p>
                  </td>
                  <td className={numCell}>
                    {e.type === "payment" ? "-" : ""}
                    {formatPrice(e.amountGbp)}
                  </td>
                  <td className={numCell}>
                    {e.type === "payment" ? "-" : ""}Rs {parseFloat(e.amountPkr).toLocaleString("en-GB")}
                  </td>
                  <td className={`${numCell} text-slate-500`}>{e.exchangeRate ?? "—"}</td>
                  <td className={numCell}>{formatPrice(String(e.runningGbp))}</td>
                  <td className={`${numCell} font-semibold bg-violet-50/60 text-slate-800`}>
                    Rs {e.runningPkr.toLocaleString("en-GB")}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="p-1.5 rounded hover:bg-slate-100 inline-flex"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => removeEntry(e)}
                        className="p-1.5 rounded hover:bg-red-50 inline-flex"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!entries.length && (
          <p className="text-center text-slate-400 py-8 text-sm">No entries yet.</p>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={saveEdit}
            className="boms-card w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit {editing.type} entry
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Date</label>
              <input
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <GbpPkrConverter
              amountGbp={amountGbp}
              amountPkr={amountPkr}
              exchangeRate={exchangeRate}
              onGbpChange={setAmountGbp}
              onPkrChange={setAmountPkr}
              onRateChange={setExchangeRate}
            />
            {editing.cashTransactionId && (
              <p className="text-xs text-slate-500">
                Linked cash transaction will update when amount or description changes.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
