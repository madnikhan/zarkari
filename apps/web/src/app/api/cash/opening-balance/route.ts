import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { setOpeningBalance } from "@/lib/db/cash-ledger";
import { todayDateString } from "@/lib/cash/labels";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await request.json();
  const { businessDate, cashInHand, onlineBank } = body as {
    businessDate?: string;
    cashInHand?: string;
    onlineBank?: string;
  };

  if (cashInHand === undefined || onlineBank === undefined) {
    return NextResponse.json({ error: "cashInHand and onlineBank required" }, { status: 400 });
  }

  await setOpeningBalance(
    businessDate ?? todayDateString(),
    cashInHand,
    onlineBank,
    session.id
  );

  return NextResponse.json({ ok: true });
}
