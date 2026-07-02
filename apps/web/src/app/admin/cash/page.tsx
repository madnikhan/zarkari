import { CashDashboardClient } from "@/components/admin/cash/CashDashboardClient";
import { getDailyCashSummary, listTransactionsForDay } from "@/lib/db/cash-ledger";
import { todayDateString } from "@/lib/cash/labels";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminCashPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;
  const date = dateParam?.slice(0, 10) ?? todayDateString();

  const [summary, cashIn, cashOut] = await Promise.all([
    getDailyCashSummary(date),
    listTransactionsForDay(date, "in"),
    listTransactionsForDay(date, "out"),
  ]);

  return (
    <div className="p-4 lg:p-8">
      <CashDashboardClient date={date} summary={summary} cashIn={cashIn} cashOut={cashOut} />
    </div>
  );
}
