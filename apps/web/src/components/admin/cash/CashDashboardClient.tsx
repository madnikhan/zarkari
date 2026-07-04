"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CashDateNav } from "./CashDateNav";
import { CashPeriodNav } from "./CashPeriodNav";
import { CashSummaryCards } from "./CashSummaryCards";
import { CashQuickActions } from "./CashQuickActions";
import { CashTransactionTable } from "./CashTransactionTable";
import { CashClosingCards } from "./CashClosingCards";
import { AddTransactionModal } from "./AddTransactionModal";
import type { CashTransaction, DailyCashSummary, RangeCashSummary } from "@/lib/db/cash-ledger";
import type { PeriodBounds } from "@/lib/cash/labels";

interface DayProps {
  viewMode: "day";
  date: string;
  summary: DailyCashSummary;
  cashIn: CashTransaction[];
  cashOut: CashTransaction[];
  returnFrom?: string;
  returnTo?: string;
}

interface PeriodProps {
  viewMode: "period";
  bounds: PeriodBounds;
  rangeSummary: RangeCashSummary;
  cashIn: CashTransaction[];
  cashOut: CashTransaction[];
  transactionDate: string;
}

type Props = DayProps | PeriodProps;

export function CashDashboardClient(props: Props) {
  const [addOpen, setAddOpen] = useState(false);

  if (props.viewMode === "day") {
    const { date, summary, cashIn, cashOut, returnFrom, returnTo } = props;
    const bounds = returnFrom && returnTo
      ? { start: returnFrom, end: returnTo, label: "", preset: "custom" as const }
      : undefined;

    return (
      <div className="space-y-6 cash-print-area">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Daily Cash</h1>
            <p className="text-sm text-slate-500 mt-1">Single day view</p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <CashPeriodNav
              viewMode="day"
              date={date}
              bounds={bounds}
              returnFrom={returnFrom}
              returnTo={returnTo}
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <CashDateNav date={date} showPrint={false} />
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
        </div>

        <CashSummaryCards summary={summary} viewMode="day" />
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

        <CashClosingCards summary={summary} viewMode="day" />

        <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} date={date} direction="in" />
      </div>
    );
  }

  const { bounds, rangeSummary, cashIn, cashOut, transactionDate } = props;

  return (
    <div className="space-y-6 cash-print-area">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Daily Cash</h1>
          <p className="text-sm text-slate-500 mt-1">Period overview · {bounds.label}</p>
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <CashPeriodNav
            viewMode="period"
            bounds={bounds}
            rangeSummary={rangeSummary}
          />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 print:hidden self-start"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      <CashSummaryCards summary={rangeSummary} viewMode="period" />
      <CashQuickActions date={transactionDate} />

      <div className="grid lg:grid-cols-2 gap-4">
        <CashTransactionTable
          title="Cash In Transactions"
          accent="in"
          transactions={cashIn}
          total={rangeSummary.totalCashIn}
          groupByDay
        />
        <CashTransactionTable
          title="Cash Out Transactions"
          accent="out"
          transactions={cashOut}
          total={rangeSummary.totalCashOut}
          groupByDay
        />
      </div>

      <CashClosingCards summary={rangeSummary} viewMode="period" />

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={transactionDate}
        direction="in"
      />
    </div>
  );
}
