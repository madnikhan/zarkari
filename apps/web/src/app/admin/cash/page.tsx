import { CashDashboardClient } from "@/components/admin/cash/CashDashboardClient";
import {
  getDailyCashSummary,
  getRangeCashSummary,
  listTransactionsForDay,
  listTransactionsForRange,
} from "@/lib/db/cash-ledger";
import { parseCashPeriodPreset, resolvePeriodBounds, todayDateString } from "@/lib/cash/labels";

interface Props {
  searchParams: Promise<{
    date?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
}

export default async function AdminCashPage({ searchParams }: Props) {
  const params = await searchParams;
  const dateParam = params.date?.slice(0, 10);
  const fromParam = params.from?.slice(0, 10);
  const toParam = params.to?.slice(0, 10);

  if (dateParam) {
    const [summary, cashIn, cashOut] = await Promise.all([
      getDailyCashSummary(dateParam),
      listTransactionsForDay(dateParam, "in"),
      listTransactionsForDay(dateParam, "out"),
    ]);

    return (
      <div className="p-4 lg:p-8">
        <CashDashboardClient
          viewMode="day"
          date={dateParam}
          summary={summary}
          cashIn={cashIn}
          cashOut={cashOut}
          returnFrom={fromParam}
          returnTo={toParam}
        />
      </div>
    );
  }

  const preset = parseCashPeriodPreset(params.preset ?? (fromParam && toParam ? "custom" : "today"));

  if (preset === "today" && !fromParam && !toParam) {
    const date = todayDateString();
    const [summary, cashIn, cashOut] = await Promise.all([
      getDailyCashSummary(date),
      listTransactionsForDay(date, "in"),
      listTransactionsForDay(date, "out"),
    ]);

    return (
      <div className="p-4 lg:p-8">
        <CashDashboardClient viewMode="day" date={date} summary={summary} cashIn={cashIn} cashOut={cashOut} />
      </div>
    );
  }

  const bounds =
    fromParam && toParam
      ? resolvePeriodBounds("custom", fromParam, toParam)
      : resolvePeriodBounds(preset);

  const [rangeSummary, cashIn, cashOut] = await Promise.all([
    getRangeCashSummary(bounds.start, bounds.end),
    listTransactionsForRange(bounds.start, bounds.end, "in"),
    listTransactionsForRange(bounds.start, bounds.end, "out"),
  ]);

  return (
    <div className="p-4 lg:p-8">
      <CashDashboardClient
        viewMode="period"
        bounds={bounds}
        rangeSummary={rangeSummary}
        cashIn={cashIn}
        cashOut={cashOut}
        transactionDate={todayDateString()}
      />
    </div>
  );
}
