import Link from "next/link";
import { getReportsData } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { ReportsPrintView } from "@/components/admin/ReportsPrintView";

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const { period = "monthly" } = await searchParams;
  const p = (["daily", "weekly", "monthly", "yearly"].includes(period) ? period : "monthly") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  const data = await getReportsData(p);

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
      <ReportsPrintView title="Reports" period={p} stats={stats} />
      <div className="px-6 lg:px-10 pb-8 print:hidden">
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((t) => (
            <Link
              key={t}
              href={`/admin/reports?period=${t}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${p === t ? "bg-charcoal text-cream border-charcoal" : "border-sand"}`}
            >
              {t}
            </Link>
          ))}
          <Link
            href="/admin/cash/analytics"
            className="px-3 py-1.5 text-xs uppercase tracking-wide rounded border border-sand hover:bg-sand/30"
          >
            Cash analytics
          </Link>
          <a
            href={`/api/reports/export?period=${p}`}
            className="px-3 py-1.5 text-xs uppercase tracking-wide rounded bg-gold text-charcoal"
          >
            Export CSV
          </a>
        </div>
      </div>
    </>
  );
}
