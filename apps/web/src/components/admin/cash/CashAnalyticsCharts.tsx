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

function ChartTooltipContent({
  active,
  payload,
  label,
  percentOf,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string; payload?: { name?: string; total?: number } }[];
  label?: string;
  percentOf?: number;
}) {
  if (!active || !payload?.length) return null;
  const primary = payload[0];
  const title =
    label ||
    primary?.payload?.name ||
    primary?.name ||
    String(primary?.dataKey ?? "");
  const value = Number(primary?.value ?? 0);
  const pct =
    percentOf && percentOf > 0 ? ((value / percentOf) * 100).toFixed(1) : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-900">{title}</p>
      {payload.map((row, i) => (
        <p key={i} className="mt-0.5" style={{ color: row.color ?? "#ef4444" }}>
          {row.name && row.name !== title ? `${row.name}: ` : "total : "}
          {formatPrice(String(row.value ?? 0))}
        </p>
      ))}
      {pct && <p className="text-xs text-slate-500 mt-1">{pct}% of expenses</p>}
    </div>
  );
}

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
  const [pinnedExpense, setPinnedExpense] = useState<{ name: string; total: number } | null>(null);

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
    router.push(`/admin/reports?tab=cash&preset=${preset}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    router.push(`/admin/reports?tab=cash&from=${customFrom}&to=${customTo}`);
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

  const expenseTotal = expenseData.reduce((s, e) => s + e.total, 0);

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
              <Tooltip content={<ChartTooltipContent />} />
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
                <Tooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="boms-card p-5 overflow-visible">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Expense breakdown</h2>
          <p className="text-xs text-slate-500 mb-3">Hover or tap a bar for category details</p>
          <div className="h-64 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip
                  content={<ChartTooltipContent percentOf={expenseTotal} />}
                  cursor={{ fill: "rgba(239, 68, 68, 0.08)" }}
                  wrapperStyle={{ zIndex: 50, outline: "none" }}
                />
                <Bar
                  dataKey="total"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    const payload = data as { name?: string; total?: number };
                    if (payload?.name != null && payload.total != null) {
                      setPinnedExpense({ name: String(payload.name), total: Number(payload.total) });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {pinnedExpense && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-sm flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{pinnedExpense.name}</p>
                <p className="text-red-600 mt-0.5">total : {formatPrice(String(pinnedExpense.total))}</p>
                {expenseTotal > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {((pinnedExpense.total / expenseTotal) * 100).toFixed(1)}% of expenses
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPinnedExpense(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Dismiss
              </button>
            </div>
          )}
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
              <Tooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#4C3BCF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
