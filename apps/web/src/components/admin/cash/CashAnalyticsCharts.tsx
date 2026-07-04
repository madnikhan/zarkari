"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { CASH_TYPE_LABELS } from "@/lib/cash/labels";
import type { CashAnalytics } from "@/lib/db/cash-ledger";
import { ReportExportToolbar } from "@/components/admin/ReportExportToolbar";

const PIE_COLORS = ["#4C3BCF", "#10b981"];

export function CashAnalyticsCharts() {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [analytics, setAnalytics] = useState<CashAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cash/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => setAnalytics(d.analytics ?? null))
      .finally(() => setLoading(false));
  }, [period]);

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

  return (
    <div id="cash-analytics-export" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cash Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Trends and insights · Last {period} days</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportToolbar
            targetId="cash-analytics-export"
            filename={`zarkari-cash-analytics-${period}d-${new Date().toISOString().slice(0, 10)}.pdf`}
          />
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${
                period === p ? "bg-[#4C3BCF] text-white border-[#4C3BCF]" : "border-slate-200"
              }`}
            >
              {p} days
            </button>
          ))}
          <Link href="/admin/cash" className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">
            Daily Cash
          </Link>
        </div>
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
