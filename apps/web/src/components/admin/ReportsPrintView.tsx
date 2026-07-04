"use client";

import { ReportExportToolbar } from "@/components/admin/ReportExportToolbar";

interface Stat {
  label: string;
  value: string | number;
}

interface Props {
  title: string;
  period: string;
  stats: Stat[];
}

export function ReportsPrintView({ title, period, stats }: Props) {
  const date = new Date().toLocaleDateString("en-GB", { dateStyle: "long" });

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:hidden">
        <h1 className="font-display text-3xl text-charcoal">{title}</h1>
        <ReportExportToolbar
          targetId="reports-export-area"
          filename={`zarkari-reports-${period}-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      </div>

      <div id="reports-export-area" className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-900 hidden print:block">ZARKARI — {title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Period: <span className="capitalize font-medium">{period}</span> · Generated {date}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-sand p-5">
              <p className="text-xs text-charcoal/50 uppercase">{s.label}</p>
              <p className="text-2xl font-semibold mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="hidden print:block mt-8 text-xs text-slate-400">
          ZARKARI Bridal Order Management System · Confidential
        </div>
      </div>
    </div>
  );
}
