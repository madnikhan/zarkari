"use client";

import { X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS } from "@/lib/cash/labels";
import type { CashTransaction } from "@/lib/db/cash-ledger";

interface Props {
  transaction: CashTransaction | null;
  onClose: () => void;
}

export function CashTransactionDetailModal({ transaction, onClose }: Props) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="boms-card w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Transaction Details</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
