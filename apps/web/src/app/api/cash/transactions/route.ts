import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  createCashTransaction,
  listTransactionsForDay,
  type CashDirection,
  type CashTransactionType,
} from "@/lib/db/cash-ledger";
import { todayDateString } from "@/lib/cash/labels";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayDateString();
  const direction = searchParams.get("direction") as CashDirection | null;
  const transactions = await listTransactionsForDay(date, direction ?? undefined);
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    direction,
    type,
    amount,
    method,
    reference,
    description,
    businessDate,
    orderId,
    retailOrderId,
    supplierId,
  } = body as {
    direction?: CashDirection;
    type?: CashTransactionType;
    amount?: string;
    method?: "cash" | "online";
    reference?: string;
    description?: string;
    businessDate?: string;
    orderId?: string;
    retailOrderId?: string;
    supplierId?: string;
  };

  if (!direction || !type || !amount || !method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tx = await createCashTransaction({
    direction,
    type,
    amount,
    method,
    reference,
    description,
    businessDate: businessDate ?? todayDateString(),
    orderId,
    retailOrderId,
    supplierId,
    createdByUserId: session.id,
    source: "manual",
  });

  if (!tx) return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  return NextResponse.json({ transaction: tx });
}
