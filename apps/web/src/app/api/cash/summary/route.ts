import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDailyCashSummary, getRangeCashSummary } from "@/lib/db/cash-ledger";
import { todayDateString } from "@/lib/cash/labels";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from && to) {
    const summary = await getRangeCashSummary(from, to);
    return NextResponse.json({ summary, viewMode: "period" });
  }

  const date = searchParams.get("date") ?? todayDateString();
  const summary = await getDailyCashSummary(date);
  return NextResponse.json({ summary, viewMode: "day" });
}
