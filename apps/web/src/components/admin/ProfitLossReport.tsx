"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS } from "@/lib/cash/labels";
import type { ProfitAndLossReport } from "@/lib/db/cash-ledger";
import { ReportExportToolbar } from "@/components/admin/ReportExportToolbar";

type PnLPreset = "week" | "month";

export function ProfitLossReport() {
  const [preset, setPreset] = useState<PnLPreset>("week");
  const [report, setReport] = useState<ProfitAndLossReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/pnl?preset=${preset}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load profit & loss");
      setReport(data.report ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profit & loss");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-slate-500 py-12 text-center">Loading profit &amp; loss…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!report) {
    return <p className="text-sm text-slate-500 py-12 text-center">No profit &amp; loss data.</p>;
  }

  const chartData = report.daily.map((d) => ({
    date: d.date.slice(5),
    income: d.income,
    costs: d.costs,
    net: d.net,
  }));

  const netDelta = report.previousPeriod
    ? report.netProfit - report.previousPeriod.netProfit
    : null;

  return (
    <div id="pnl-export" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Profit &amp; Loss</h2>
          <p className="text-sm text-slate-500 mt-1">Cash-basis analytics · {report.presetLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportToolbar
            targetId="pnl-export"
            filename={`zarkari-pnl-${preset}-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
          <button
            type="button"
            onClick={() => setPreset("week")}
            className={`px-3 py-1.5 text-xs rounded-lg border ${
              preset === "week" ? "bg-charcoal text-cream border-charcoal" : "border-slate-200"
            }`}
          >
            Weekly report
          </button>
          <button
            type="button"
            onClick={() => setPreset("month")}
            className={`px-3 py-1.5 text-xs rounded-lg border ${
              preset === "month" ? "bg-charcoal text-cream border-charcoal" : "border-slate-200"
            }`}
          >
            Monthly report
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="boms-card p-5">
          <p className="text-xs text-slate-500 uppercase">Total Income</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">
            {formatPrice(String(report.totalIncome.toFixed(2)))}
          </p>
        </div>
        <div className="boms-card p-5">
          <p className="text-xs text-slate-500 uppercase">Total Costs</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">
            {formatPrice(String(report.totalCosts.toFixed(2)))}
          </p>
        </div>
        <div className="boms-card p-5">
          <p className="text-xs text-slate-500 uppercase">Net Profit / Loss</p>
          <p
            className={`text-2xl font-semibold mt-1 ${
              report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatPrice(String(report.netProfit.toFixed(2)))}
          </p>
        </div>
        <div className="boms-card p-5">
          <p className="text-xs text-slate-500 uppercase">Profit Margin</p>
          <p className="text-2xl font-semibold mt-1">{report.marginPercent.toFixed(1)}%</p>
          {report.previousPeriod && netDelta !== null && (
            <p className="text-xs text-slate-500 mt-1">
              vs prior period:{" "}
              <span className={netDelta >= 0 ? "text-emerald-600" : "text-red-600"}>
                {netDelta >= 0 ? "+" : ""}
                {formatPrice(String(netDelta.toFixed(2)))}
              </span>
            </p>
          )}
        </div>
      </div>

      {report.previousPeriod && (
        <div className="boms-card p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Previous period comparison</span>
          <span className="text-slate-400"> · {report.previousPeriod.label}</span>
          <div className="mt-2 grid sm:grid-cols-3 gap-3 text-xs">
            <p>
              Income:{" "}
              <strong>{formatPrice(String(report.previousPeriod.totalIncome.toFixed(2)))}</strong>
            </p>
            <p>
              Costs:{" "}
              <strong>{formatPrice(String(report.previousPeriod.totalCosts.toFixed(2)))}</strong>
            </p>
            <p>
              Net:{" "}
              <strong>{formatPrice(String(report.previousPeriod.netProfit.toFixed(2)))}</strong>
            </p>
          </div>
        </div>
      )}

      <div className="boms-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Income vs Costs vs Net</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatPrice(String(Number(value ?? 0).toFixed(2)))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" />
              <Bar dataKey="costs" name="Costs" fill="#ef4444" />
              <Bar dataKey="net" name="Net" fill="#4C3BCF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="boms-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Income breakdown</h3>
          {report.incomeByType.length ? (
            <ul className="space-y-2">
              {report.incomeByType.map((row) => (
                <li key={row.type} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-600">{CASH_TYPE_LABELS[row.type] ?? row.type}</span>
                  <span className="font-medium text-emerald-700">
                    {formatPrice(String(row.total.toFixed(2)))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No income in this period.</p>
          )}
        </div>
        <div className="boms-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Cost breakdown</h3>
          {report.costsByType.length ? (
            <ul className="space-y-2">
              {report.costsByType.map((row) => (
                <li key={row.type} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-600">{CASH_TYPE_LABELS[row.type] ?? row.type}</span>
                  <span className="font-medium text-red-600">
                    {formatPrice(String(row.total.toFixed(2)))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No costs in this period.</p>
          )}
        </div>
      </div>
    </div>
  );
}
