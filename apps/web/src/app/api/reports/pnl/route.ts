import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProfitAndLoss } from "@/lib/db/cash-ledger";
import {
  endOfMonthFor,
  formatPeriodLabel,
  resolvePeriodBounds,
  shiftDate,
  startOfMonthFor,
} from "@/lib/cash/labels";

function previousPeriodBounds(preset: "week" | "month", currentStart: string, currentEnd: string) {
  if (preset === "week") {
    const start = shiftDate(currentStart, -7);
    const end = shiftDate(currentEnd, -7);
    return {
      start,
      end,
      label: `Previous week · ${formatPeriodLabel(start, end)}`,
    };
  }
  const prevMonthAnchor = shiftDate(startOfMonthFor(currentStart), -1);
  const start = startOfMonthFor(prevMonthAnchor);
  const end = endOfMonthFor(prevMonthAnchor);
  return {
    start,
    end,
    label: `Previous month · ${formatPeriodLabel(start, end)}`,
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const presetParam = searchParams.get("preset") === "month" ? "month" : "week";
  const bounds = resolvePeriodBounds(presetParam);
  const previous = previousPeriodBounds(presetParam, bounds.start, bounds.end);

  const report = await getProfitAndLoss({
    startDate: bounds.start,
    endDate: bounds.end,
    presetLabel: bounds.label,
    previousStartDate: previous.start,
    previousEndDate: previous.end,
    previousLabel: previous.label,
  });

  return NextResponse.json({ report, bounds, preset: presetParam });
}
