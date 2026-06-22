import Link from "next/link";
import { getReportsData } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const { period = "monthly" } = await searchParams;
  const p = (["daily", "weekly", "monthly", "yearly"].includes(period) ? period : "monthly") as "daily" | "weekly" | "monthly" | "yearly";
  const data = getReportsData(p);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-charcoal">Reports</h1>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((t) => (
            <Link
              key={t}
              href={`/admin/reports?period=${t}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${p === t ? "bg-charcoal text-cream border-charcoal" : "border-sand"}`}
            >
              {t}
            </Link>
          ))}
          <a href={`/api/reports/export?period=${p}`} className="px-3 py-1.5 text-xs uppercase tracking-wide rounded bg-gold text-charcoal">
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Orders", data.orderCount],
          ["Revenue (deposits)", formatPrice(String(data.revenue))],
          ["Outstanding", formatPrice(String(data.outstanding))],
          ["Late deliveries", data.late],
          ["Refunds", data.refunds],
          ["Cancellations", data.cancellations],
          ["Redesigns", data.redesigns],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-lg border border-sand p-5">
            <p className="text-xs text-charcoal/50 uppercase">{label}</p>
            <p className="text-2xl font-semibold mt-2">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
