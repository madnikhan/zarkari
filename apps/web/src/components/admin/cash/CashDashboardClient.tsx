"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CashDateNav } from "./CashDateNav";
import { CashSummaryCards } from "./CashSummaryCards";
import { CashQuickActions } from "./CashQuickActions";
import { CashTransactionTable } from "./CashTransactionTable";
import { CashClosingCards } from "./CashClosingCards";
import { AddTransactionModal } from "./AddTransactionModal";
import type { CashTransaction, DailyCashSummary } from "@/lib/db/cash-ledger";

interface Props {
  date: string;
  summary: DailyCashSummary;
  cashIn: CashTransaction[];
  cashOut: CashTransaction[];
}

export function CashDashboardClient({ date, summary, cashIn, cashOut }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6 cash-print-area">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Daily Cash</h1>
          <p className="text-sm text-slate-500 mt-1">Daily overview</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <CashDateNav date={date} />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 print:hidden"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      <CashSummaryCards summary={summary} />
      <CashQuickActions date={date} />

      <div className="grid lg:grid-cols-2 gap-4">
        <CashTransactionTable
          title="Today's Cash In Transactions"
          accent="in"
          transactions={cashIn}
          total={summary.totalCashIn}
        />
        <CashTransactionTable
          title="Today's Cash Out Transactions"
          accent="out"
          transactions={cashOut}
          total={summary.totalCashOut}
        />
      </div>

      <CashClosingCards summary={summary} />

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={date}
        direction="in"
      />
    </div>
  );
}
