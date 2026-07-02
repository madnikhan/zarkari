import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCashAnalytics } from "@/lib/db/cash-ledger";

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = Number(searchParams.get("period") ?? "7");
  const days = period === 30 ? 30 : period === 90 ? 90 : 7;
  const analytics = await getCashAnalytics(days);
  return NextResponse.json({ analytics });
}
