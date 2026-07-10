"use client";

import { useMemo, useState } from "react";
import { CashTransactionTable } from "./CashTransactionTable";
import type { CashTransaction } from "@/lib/db/cash-ledger";

const PAGE_SIZE = 20;

interface Props {
  title: string;
  accent: "in" | "out";
  transactions: CashTransaction[];
  total: number;
  groupByDay?: boolean;
}

export function SearchableCashTransactionTable({
  title,
  accent,
  transactions,
  total,
  groupByDay = false,
}: Props) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return transactions;
    return transactions.filter(
      (tx) =>
        (tx.reference?.toLowerCase().includes(needle) ?? false) ||
        (tx.description?.toLowerCase().includes(needle) ?? false)
    );
  }, [transactions, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filteredTotal = filtered.reduce((s, tx) => s + parseFloat(tx.amount), 0);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Search reference or description…"
        className="w-full sm:w-72 px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]/30"
      />
      <CashTransactionTable
        title={title}
        accent={accent}
        transactions={paged}
        total={q.trim() ? filteredTotal : total}
        groupByDay={groupByDay}
        scrollable
      />
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {currentPage} of {totalPages} ({filtered.length} items)
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
