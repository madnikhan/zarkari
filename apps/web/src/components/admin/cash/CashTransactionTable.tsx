"use client";

import { Fragment, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS, formatBusinessDate } from "@/lib/cash/labels";
import type { CashTransaction } from "@/lib/db/cash-ledger";
import { CashTransactionDetailModal } from "./CashTransactionDetailModal";

interface Props {
  title: string;
  accent: "in" | "out";
  transactions: CashTransaction[];
  total: number;
  groupByDay?: boolean;
}

function groupTransactions(transactions: CashTransaction[]) {
  const groups = new Map<string, CashTransaction[]>();
  for (const tx of transactions) {
    const list = groups.get(tx.businessDate) ?? [];
    list.push(tx);
    groups.set(tx.businessDate, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

export function CashTransactionTable({ title, accent, transactions, total, groupByDay = false }: Props) {
  const [selected, setSelected] = useState<CashTransaction | null>(null);
  const headerClass =
    accent === "in"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : "bg-red-50 text-red-800 border-red-100";

  const grouped = groupByDay ? groupTransactions(transactions) : null;

  function renderRow(tx: CashTransaction) {
    return (
      <tr
        key={tx.id}
        className="hover:bg-slate-50/50 cursor-pointer"
        onClick={() => setSelected(tx)}
      >
        <td className="px-3 py-2 whitespace-nowrap">
          {groupByDay
            ? new Date(tx.occurredAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : new Date(tx.occurredAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
        </td>
        <td className="px-3 py-2">{CASH_TYPE_LABELS[tx.type]}</td>
        <td className="px-3 py-2 hidden sm:table-cell text-slate-600">{tx.reference ?? "—"}</td>
        <td className="px-3 py-2 text-slate-600 max-w-[140px] md:max-w-[200px] truncate underline decoration-dotted underline-offset-2">
          {tx.description ?? "—"}
        </td>
        <td className="px-3 py-2 capitalize">{tx.method}</td>
        <td
          className={`px-3 py-2 text-right font-medium ${accent === "in" ? "text-emerald-600" : "text-red-600"}`}
        >
          {formatPrice(tx.amount)}
        </td>
      </tr>
    );
  }

  return (
    <>
      <div className="boms-card overflow-hidden flex flex-col min-h-[320px]">
        <div className={`px-4 py-3 border-b font-semibold text-sm ${headerClass}`}>{title}</div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                <th className="text-left px-3 py-2 font-medium">{groupByDay ? "Time" : "Time"}</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Ref</th>
                <th className="text-left px-3 py-2 font-medium">Description</th>
                <th className="text-left px-3 py-2 font-medium">Method</th>
                <th className="text-right px-3 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No transactions yet
                  </td>
                </tr>
              ) : grouped ? (
                grouped.map(([day, dayTxs]) => (
                  <Fragment key={day}>
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        {formatBusinessDate(day)}
                      </td>
                    </tr>
                    {dayTxs.map((tx) => renderRow(tx))}
                  </Fragment>
                ))
              ) : (
                transactions.map((tx) => renderRow(tx))
              )}
            </tbody>
          </table>
        </div>
        <div className={`px-4 py-3 border-t text-sm font-semibold flex justify-between ${headerClass}`}>
          <span>Total</span>
          <span>{formatPrice(String(total))}</span>
        </div>
      </div>
      <CashTransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
    </>
  );
}
