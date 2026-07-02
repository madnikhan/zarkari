"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { CashDirection, CashTransactionType } from "@/lib/db/cash-ledger";
import { CASH_TYPE_LABELS, CASH_IN_TYPES, CASH_OUT_TYPES } from "@/lib/cash/labels";

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  direction: CashDirection;
  defaultType?: CashTransactionType;
}

export function AddTransactionModal({ open, onClose, date, direction, defaultType }: Props) {
  const router = useRouter();
  const [type, setType] = useState<CashTransactionType>(defaultType ?? (direction === "in" ? "other_in" : "other_out"));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const types = direction === "in" ? CASH_IN_TYPES : CASH_OUT_TYPES;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cash/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          type,
          amount,
          method,
          reference: reference || undefined,
          description: description || undefined,
          businessDate: date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-900">Add Transaction</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CashTransactionType)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {CASH_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Amount (£)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "cash" | "online")}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="ORD-1150"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full boms-btn-primary py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
