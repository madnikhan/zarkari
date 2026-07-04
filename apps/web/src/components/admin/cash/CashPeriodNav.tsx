"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Printer } from "lucide-react";
import {
  formatBusinessDate,
  formatPeriodLabel,
  parseCashPeriodPreset,
  type CashPeriodPreset,
  type PeriodBounds,
} from "@/lib/cash/labels";
import { formatPrice } from "@/lib/utils";
import type { RangeCashSummary } from "@/lib/db/cash-ledger";

interface Props {
  viewMode: "day" | "period";
  date?: string;
  bounds?: PeriodBounds;
  rangeSummary?: RangeCashSummary;
  returnFrom?: string;
  returnTo?: string;
}

const PRESETS: { id: CashPeriodPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export function CashPeriodNav({
  viewMode,
  date,
  bounds,
  rangeSummary,
  returnFrom,
  returnTo,
}: Props) {
  const router = useRouter();
  const [customFrom, setCustomFrom] = useState(bounds?.start ?? "");
  const [customTo, setCustomTo] = useState(bounds?.end ?? "");
  const [showCustom, setShowCustom] = useState(false);

  function goPreset(preset: CashPeriodPreset) {
    if (preset === "today") {
      router.push("/admin/cash");
      return;
    }
    if (preset === "custom") {
      setShowCustom(true);
      return;
    }
    router.push(`/admin/cash?preset=${preset}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    router.push(`/admin/cash?from=${customFrom}&to=${customTo}`);
  }

  function drillDay(day: string) {
    if (bounds) {
      router.push(`/admin/cash?date=${day}&from=${bounds.start}&to=${bounds.end}`);
      return;
    }
    router.push(`/admin/cash?date=${day}`);
  }

  const activePreset =
    viewMode === "day" && !returnFrom
      ? "today"
      : bounds?.preset ?? (viewMode === "period" ? "custom" : "today");

  return (
    <div className="space-y-3 print:hidden">
      {viewMode === "day" && returnFrom && returnTo && (
        <button
          type="button"
          onClick={() => router.push(`/admin/cash?from=${returnFrom}&to=${returnTo}`)}
          className="inline-flex items-center gap-1 text-sm text-[#4C3BCF] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {formatPeriodLabel(returnFrom, returnTo)}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goPreset(p.id)}
            className={`px-3 py-2 text-sm rounded-lg border ${
              activePreset === p.id ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`px-3 py-2 text-sm rounded-lg border ${
            activePreset === "custom" ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          Custom range
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      {(showCustom || activePreset === "custom") && (
        <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/80">
          <label className="text-xs text-slate-500">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="mt-1 block border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="mt-1 block border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            className="px-3 py-2 text-sm rounded-lg bg-[#4C3BCF] text-white"
          >
            Apply
          </button>
        </div>
      )}

      <div className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-center min-w-[200px]">
        {viewMode === "day" && date
          ? formatBusinessDate(date)
          : bounds
            ? bounds.label
            : "Select a period"}
      </div>

      {viewMode === "period" && rangeSummary && rangeSummary.dailyBreakdown.length > 0 && (
        <div className="boms-card overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-semibold text-slate-900">Daily breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-right px-3 py-2 font-medium">Cash in</th>
                  <th className="text-right px-3 py-2 font-medium">Cash out</th>
                  <th className="text-right px-3 py-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rangeSummary.dailyBreakdown.map((row) => (
                  <tr
                    key={row.date}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => drillDay(row.date)}
                  >
                    <td className="px-3 py-2 text-[#4C3BCF] underline decoration-dotted">
                      {formatBusinessDate(row.date)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600">{formatPrice(String(row.cashIn))}</td>
                    <td className="px-3 py-2 text-right text-red-600">{formatPrice(String(row.cashOut))}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatPrice(String(row.net))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
