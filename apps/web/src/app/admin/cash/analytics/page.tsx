import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CashAnalyticsCharts } from "@/components/admin/cash/CashAnalyticsCharts";

export default async function CashAnalyticsPage() {
  const session = await getSession();
  if (session?.role !== "owner") redirect("/admin/dashboard");

  return (
    <div className="p-4 lg:p-8">
      <Suspense fallback={<p className="text-sm text-slate-500 py-12 text-center">Loading analytics…</p>}>
        <CashAnalyticsCharts />
      </Suspense>
    </div>
  );
}
