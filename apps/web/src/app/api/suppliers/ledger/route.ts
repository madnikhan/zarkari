import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { isUuid } from "@/lib/db";
import { createCashTransaction } from "@/lib/db/cash-ledger";
import { todayDateString } from "@/lib/cash/labels";
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

  try {
    const body = await request.json();
    if (!body.supplierId || !body.type) {
      return NextResponse.json({ error: "supplierId and type required" }, { status: 400 });
    }
    if (!isUuid(body.supplierId)) {
      return NextResponse.json({ error: "Invalid supplier" }, { status: 400 });
    }

    const businessDate = body.businessDate ?? todayDateString();
    let cashTransactionId: string | undefined = body.cashTransactionId;

    if (body.type === "payment" && !cashTransactionId) {
      const method = body.method === "online" ? "online" : "cash";
      const tx = await createCashTransaction({
        direction: "out",
        type: "supplier_payment",
        amount: body.amountGbp ?? "0",
        method,
        description: body.description ?? "Supplier payment (khata)",
        businessDate,
        supplierId: body.supplierId,
        createdByUserId: isUuid(session.id) ? session.id : undefined,
        source: "manual",
      });
      if (!tx) {
        return NextResponse.json({ error: "Failed to create cash-out transaction" }, { status: 500 });
      }
      cashTransactionId = tx.id;
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
      businessDate,
      cashTransactionId,
    });

    revalidatePath("/admin/suppliers/payments");
    revalidatePath(`/admin/suppliers/${body.supplierId}/khata`);
    if (body.type === "payment") {
      revalidatePath("/admin/cash");
      revalidatePath("/admin/cash/analytics");
      revalidatePath("/admin/reports");
    }
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ledger entry";
    console.error("[suppliers/ledger POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
