import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  addSupplierLedgerEntry,
  getSupplierLedgerBalances,
  listSupplierLedger,
  updateSupplierLedgerEntry,
} from "@/lib/supplier-ledger/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");

  if (supplierId) {
    const entries = await listSupplierLedger(supplierId);
    return NextResponse.json({ entries });
  }

  const balances = await getSupplierLedgerBalances();
  return NextResponse.json({ balances });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.supplierId || !body.type) {
    return NextResponse.json({ error: "supplierId and type required" }, { status: 400 });
  }

  const entry = await addSupplierLedgerEntry({
    supplierId: body.supplierId,
    type: body.type,
    orderId: body.orderId,
    description: body.description,
    billNumber: body.billNumber,
    amountGbp: body.amountGbp ?? "0",
    amountPkr: body.amountPkr ?? "0",
    exchangeRate: body.exchangeRate,
    businessDate: body.businessDate,
    cashTransactionId: body.cashTransactionId,
  });

  revalidatePath("/admin/suppliers/payments");
  revalidatePath(`/admin/suppliers/${body.supplierId}/khata`);
  return NextResponse.json({ entry });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const entry = await updateSupplierLedgerEntry(body.id, {
    description: body.description,
    amountGbp: body.amountGbp,
    amountPkr: body.amountPkr,
    exchangeRate: body.exchangeRate,
    businessDate: body.businessDate,
  });

  revalidatePath("/admin/suppliers/payments");
  if (entry) revalidatePath(`/admin/suppliers/${entry.supplierId}/khata`);
  return NextResponse.json({ entry });
}
