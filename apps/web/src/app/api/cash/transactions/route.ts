import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  createCashTransaction,
  listTransactionsForDay,
  listTransactionsForRange,
  type CashDirection,
  type CashTransactionType,
} from "@/lib/db/cash-ledger";
import { addSupplierLedgerEntry } from "@/lib/supplier-ledger/service";
import { todayDateString } from "@/lib/cash/labels";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const direction = searchParams.get("direction") as CashDirection | null;

  if (from && to) {
    const transactions = await listTransactionsForRange(from, to, direction ?? undefined);
    return NextResponse.json({ transactions });
  }

  const date = searchParams.get("date") ?? todayDateString();
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
    expenseCategory,
    businessDate,
    orderId,
    retailOrderId,
    supplierId,
    amountPkr,
    exchangeRate,
  } = body as {
    direction?: CashDirection;
    type?: CashTransactionType;
    amount?: string;
    method?: "cash" | "online";
    reference?: string;
    description?: string;
    expenseCategory?: string;
    businessDate?: string;
    orderId?: string;
    retailOrderId?: string;
    supplierId?: string;
    amountPkr?: string;
    exchangeRate?: string;
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
    expenseCategory: type === "business_expense" ? expenseCategory : undefined,
    businessDate: businessDate ?? todayDateString(),
    orderId,
    retailOrderId,
    supplierId,
    createdByUserId: session.id,
    source: "manual",
  });

  if (!tx) return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });

  if (type === "supplier_payment" && supplierId) {
    await addSupplierLedgerEntry({
      supplierId,
      type: "payment",
      description: description ?? reference ?? "Supplier payment",
      amountGbp: amount,
      amountPkr: amountPkr ?? "0",
      exchangeRate,
      businessDate: businessDate ?? todayDateString(),
      cashTransactionId: tx.id,
    });
    revalidatePath("/admin/suppliers/payments");
    revalidatePath(`/admin/suppliers/${supplierId}/khata`);
  }

  revalidatePath("/admin/cash");
  revalidatePath("/admin/cash/analytics");
  revalidatePath("/admin/reports");
  return NextResponse.json({ transaction: tx });
}
