import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCashAnalytics } from "@/lib/db/cash-ledger";
import { parseCashPeriodPreset, resolvePeriodBounds } from "@/lib/cash/labels";

const MAX_RANGE_DAYS = 366;

function countDaysInclusive(start: string, end: string): number {
  const s = new Date(`${start}T12:00:00Z`);
  const e = new Date(`${end}T12:00:00Z`);
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const presetParam = searchParams.get("preset");

  let bounds;
  if (from && to) {
    bounds = resolvePeriodBounds("custom", from, to);
  } else if (presetParam) {
    const preset = parseCashPeriodPreset(presetParam);
    if (preset === "custom") {
      return NextResponse.json({ error: "Custom range requires from and to" }, { status: 400 });
    }
    bounds = resolvePeriodBounds(preset);
  } else {
    const period = Number(searchParams.get("period") ?? "7");
    const days = period === 30 ? 30 : period === 90 ? 90 : 7;
    const preset = days === 30 ? "30d" : days === 90 ? "90d" : "7d";
    bounds = resolvePeriodBounds(preset);
  }

  if (countDaysInclusive(bounds.start, bounds.end) > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range cannot exceed ${MAX_RANGE_DAYS} days` }, { status: 400 });
  }

  const analytics = await getCashAnalytics({
    startDate: bounds.start,
    endDate: bounds.end,
    presetLabel: bounds.label,
  });

  return NextResponse.json({ analytics, bounds });
}
