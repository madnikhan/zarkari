import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getReportsData, getFinanceSummary } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { ReportsPrintView } from "@/components/admin/ReportsPrintView";
import { CashAnalyticsCharts } from "@/components/admin/cash/CashAnalyticsCharts";

interface Props {
  searchParams: Promise<{ period?: string; tab?: string }>;
}

const TABS: { key: string; label: string; ownerOnly?: boolean }[] = [
  { key: "overview", label: "Overview" },
  { key: "cash", label: "Cash Analytics", ownerOnly: true },
  { key: "finance", label: "Finance", ownerOnly: true },
];

export default async function AdminReportsPage({ searchParams }: Props) {
  const session = await getSession();
  const { period = "monthly", tab = "overview" } = await searchParams;
  const isOwner = session?.role === "owner";

  const tabKey = TABS.some((t) => t.key === tab) ? tab : "overview";
  if ((tabKey === "cash" || tabKey === "finance") && !isOwner) {
    redirect("/admin/reports?tab=overview");
  }

  const p = (["daily", "weekly", "monthly", "yearly"].includes(period) ? period : "monthly") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

  const data = await getReportsData(p);
  const finance = tabKey === "finance" && isOwner ? await getFinanceSummary() : null;

  const stats = [
    { label: "Orders", value: data.orderCount },
    { label: "Revenue (deposits)", value: formatPrice(String(data.revenue)) },
    { label: "Outstanding", value: formatPrice(String(data.outstanding)) },
    { label: "Late deliveries", value: data.late },
    { label: "Refunds", value: data.refunds },
    { label: "Cancellations", value: data.cancellations },
    { label: "Redesigns", value: data.redesigns },
  ];

  return (
    <>
      {tabKey === "overview" && <ReportsPrintView title="Reports" period={p} stats={stats} />}
      <div className="px-6 lg:px-10 pb-8 print:hidden">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Reports</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.filter((t) => !t.ownerOnly || isOwner).map((t) => (
            <Link
              key={t.key}
              href={`/admin/reports?tab=${t.key}${t.key === "overview" ? `&period=${p}` : ""}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${
                tabKey === t.key ? "bg-charcoal text-cream border-charcoal" : "border-sand hover:bg-sand/30"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tabKey === "overview" && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {(["daily", "weekly", "monthly", "yearly"] as const).map((t) => (
                <Link
                  key={t}
                  href={`/admin/reports?tab=overview&period=${t}`}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${p === t ? "bg-charcoal text-cream border-charcoal" : "border-sand"}`}
                >
                  {t}
                </Link>
              ))}
              <a
                href={`/api/reports/export?period=${p}`}
                className="px-3 py-1.5 text-xs uppercase tracking-wide rounded bg-gold text-charcoal"
              >
                Export CSV
              </a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="boms-card p-5">
                  <p className="text-xs text-slate-500 uppercase">{s.label}</p>
                  <p className="text-2xl font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tabKey === "cash" && isOwner && (
          <Suspense fallback={<p className="text-sm text-slate-500 py-12 text-center">Loading analytics…</p>}>
            <CashAnalyticsCharts />
          </Suspense>
        )}

        {tabKey === "finance" && finance && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="boms-card p-6">
              <p className="text-xs text-slate-500 uppercase">Deposits Received</p>
              <p className="text-2xl font-semibold mt-2">{formatPrice(String(finance.totalDeposits))}</p>
            </div>
            <div className="boms-card p-6">
              <p className="text-xs text-slate-500 uppercase">Outstanding Balance</p>
              <p className="text-2xl font-semibold mt-2">{formatPrice(String(finance.totalOutstanding))}</p>
            </div>
            <div className="boms-card p-6">
              <p className="text-xs text-slate-500 uppercase">Refunded Orders</p>
              <p className="text-2xl font-semibold mt-2">{finance.refundedCount}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
