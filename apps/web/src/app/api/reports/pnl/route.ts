import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getProfitAndLoss } from "@/lib/db/cash-ledger";
import { getOrderMarginsInPeriodDb } from "@/lib/db/order-margins";
import {
  endOfMonthFor,
  formatPeriodLabel,
  resolvePeriodBounds,
  shiftDate,
  startOfMonthFor,
  todayDateString,
} from "@/lib/cash/labels";

type PnLPreset = "week" | "month" | "year";

function previousPeriodBounds(preset: PnLPreset, currentStart: string, currentEnd: string) {
  if (preset === "week") {
    const start = shiftDate(currentStart, -7);
    const end = shiftDate(currentEnd, -7);
    return {
      start,
      end,
      label: `Previous week · ${formatPeriodLabel(start, end)}`,
    };
  }
  if (preset === "month") {
    const prevMonthAnchor = shiftDate(startOfMonthFor(currentStart), -1);
    const start = startOfMonthFor(prevMonthAnchor);
    const end = endOfMonthFor(prevMonthAnchor);
    return {
      start,
      end,
      label: `Previous month · ${formatPeriodLabel(start, end)}`,
    };
  }
  const year = parseInt(currentStart.slice(0, 4), 10) - 1;
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return {
    start,
    end,
    label: `Previous year · ${year}`,
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const presetParam = searchParams.get("preset");
  const preset: PnLPreset =
    presetParam === "month" ? "month" : presetParam === "year" ? "year" : "week";
  const bounds = resolvePeriodBounds(preset, undefined, undefined, todayDateString());
  const previous = previousPeriodBounds(preset, bounds.start, bounds.end);

  const [report, orderMargins] = await Promise.all([
    getProfitAndLoss({
      startDate: bounds.start,
      endDate: bounds.end,
      presetLabel: bounds.label,
      previousStartDate: previous.start,
      previousEndDate: previous.end,
      previousLabel: previous.label,
    }),
    getOrderMarginsInPeriodDb(bounds.start, bounds.end),
  ]);

  return NextResponse.json({
    report: { ...report, orderMargins },
    bounds,
    preset,
  });
}
