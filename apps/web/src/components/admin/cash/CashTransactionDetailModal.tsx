"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS } from "@/lib/cash/labels";
import type { CashTransaction } from "@/lib/db/cash-ledger";

interface Props {
  transaction: CashTransaction | null;
  onClose: () => void;
  canDelete?: boolean;
  /** Open directly in edit mode (e.g. from table pencil) */
  startInEdit?: boolean;
}

export function CashTransactionDetailModal({
  transaction,
  onClose,
  canDelete = false,
  startInEdit = false,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setEditing(startInEdit);
    setAmount(transaction.amount);
    setDescription(transaction.description ?? "");
    setMethod(transaction.method);
    setError("");
  }, [transaction, startInEdit]);

  if (!transaction) return null;

  const isAuto = transaction.source === "auto";
  const canEditFields = !isAuto;

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = { description };
      if (canEditFields) {
        body.amount = amount;
        body.method = method;
      }
      const res = await fetch(`/api/cash/transactions/${transaction!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setEditing(false);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function removeTx() {
    if (!transaction) return;
    if (!confirm("Delete this cash transaction? This cannot be undone.")) return;
    setError("");
    const res = await fetch(`/api/cash/transactions/${transaction.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="boms-card w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit Transaction" : "Transaction Details"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Amount</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canEditFields}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "cash" | "online")}
                disabled={!canEditFields}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {isAuto && (
              <p className="text-xs text-amber-600">
                Auto-posted transactions can only update description.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                className="px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Time</dt>
                <dd className="font-medium text-right">
                  {new Date(transaction.occurredAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Type</dt>
                <dd className="font-medium">{CASH_TYPE_LABELS[transaction.type]}</dd>
              </div>
              {transaction.type === "business_expense" && transaction.expenseCategory && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Category</dt>
                  <dd className="font-medium">{transaction.expenseCategory}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Direction</dt>
                <dd className="font-medium capitalize">{transaction.direction}</dd>
              </div>
              {transaction.reference && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Reference</dt>
                  <dd className="font-mono text-[#4C3BCF]">{transaction.reference}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Method</dt>
                <dd className="font-medium capitalize">{transaction.method}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Source</dt>
                <dd className="font-medium capitalize">{transaction.source}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Amount</dt>
                <dd
                  className={`font-semibold text-lg ${
                    transaction.direction === "in" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatPrice(transaction.amount)}
                </dd>
              </div>
            </dl>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {transaction.description?.trim() || "No description provided."}
              </p>
            </div>

            {transaction.orderId && (
              <p className="text-xs text-slate-500">
                Linked to order ID: <span className="font-mono">{transaction.orderId}</span>
              </p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="boms-btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Edit
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={removeTx}
                  disabled={isAuto}
                  title={isAuto ? "Auto-posted transactions cannot be deleted" : undefined}
                  className="px-4 py-2 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-40"
                >
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
