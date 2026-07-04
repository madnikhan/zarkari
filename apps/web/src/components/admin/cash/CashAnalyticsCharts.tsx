"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS, parseCashPeriodPreset, resolvePeriodBounds, type CashPeriodPreset } from "@/lib/cash/labels";
import type { CashAnalytics } from "@/lib/db/cash-ledger";
import { ReportExportToolbar } from "@/components/admin/ReportExportToolbar";

const PIE_COLORS = ["#4C3BCF", "#10b981"];

const PRESET_BUTTONS: { id: CashPeriodPreset; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export function CashAnalyticsCharts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analytics, setAnalytics] = useState<CashAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const presetParam = searchParams.get("preset");
  const activePreset: CashPeriodPreset =
    fromParam && toParam ? "custom" : parseCashPeriodPreset(presetParam ?? "7d");

  const [customFrom, setCustomFrom] = useState(fromParam);
  const [customTo, setCustomTo] = useState(toParam);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const query =
        fromParam && toParam
          ? `from=${fromParam}&to=${toParam}`
          : `preset=${activePreset === "custom" ? "7d" : activePreset}`;
      const res = await fetch(`/api/cash/analytics?${query}`);
      const data = await res.json();
      setAnalytics(data.analytics ?? null);
    } finally {
      setLoading(false);
    }
  }, [fromParam, toParam, activePreset]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function selectPreset(preset: CashPeriodPreset) {
    router.push(`/admin/cash/analytics?preset=${preset}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    router.push(`/admin/cash/analytics?from=${customFrom}&to=${customTo}`);
  }

  if (loading) {
    return <p className="text-sm text-slate-500 py-12 text-center">Loading analytics…</p>;
  }

  if (!analytics) {
    return <p className="text-sm text-slate-500 py-12 text-center">No analytics data.</p>;
  }

  const methodData = [
    { name: "Cash", value: analytics.methodSplit.cash },
    { name: "Online", value: analytics.methodSplit.online },
  ];

  const expenseData = analytics.expensesByType.map((e) => ({
    name: CASH_TYPE_LABELS[e.type as keyof typeof CASH_TYPE_LABELS] ?? e.type,
    total: e.total,
  }));

  let cumulative = 0;
  const netTrend = analytics.daily.map((d) => {
    cumulative += d.net;
    return { date: d.date.slice(5), net: d.net, cumulative };
  });

  const bounds = resolvePeriodBounds(
    activePreset,
    fromParam || undefined,
    toParam || undefined
  );
  const subtitle = analytics.presetLabel || bounds.label;
  const exportSlug = activePreset === "custom" ? `${fromParam}_${toParam}` : activePreset;

  return (
    <div id="cash-analytics-export" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cash Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Trends and insights · {subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportToolbar
            targetId="cash-analytics-export"
            filename={`zarkari-cash-analytics-${exportSlug}-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
          {PRESET_BUTTONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${
                activePreset === p.id ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
          <Link href="/admin/cash" className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">
            Daily Cash
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/80">
        <label className="text-xs text-slate-500">
          Custom from
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="mt-1 block border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Custom to
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
          className={`px-3 py-2 text-xs rounded-lg border ${
            activePreset === "custom" ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200 bg-white"
          }`}
        >
          Apply range
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Avg daily cash in", formatPrice(String(analytics.insights.avgDailyIn.toFixed(2)))],
          ["Avg daily cash out", formatPrice(String(analytics.insights.avgDailyOut.toFixed(2)))],
          ["Busiest day", analytics.insights.busiestDay ?? "—"],
          ["Outstanding bridal", formatPrice(String(analytics.insights.outstandingBalance.toFixed(2)))],
        ].map(([label, value]) => (
          <div key={label} className="boms-card p-5">
            <p className="text-xs text-slate-500 uppercase">{label}</p>
            <p className="text-xl font-semibold mt-2 text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="boms-card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Cash in vs cash out</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatPrice(String(v))} />
              <Legend />
              <Bar dataKey="cashIn" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cashOut" name="Cash Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="boms-card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Payment method split (cash in)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {methodData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatPrice(String(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="boms-card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Expense breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatPrice(String(v))} />
                <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="boms-card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Net balance trend (cumulative)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatPrice(String(v))} />
              <Line type="monotone" dataKey="cumulative" stroke="#4C3BCF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
