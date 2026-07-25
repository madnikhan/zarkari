import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { deleteCashTransaction } from "@/lib/db/cash-ledger";
import {
  deleteSupplierLedgerEntry,
  getSupplierLedgerEntry,
} from "@/lib/supplier-ledger/service";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getSupplierLedgerEntry(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.cashTransactionId) {
    await deleteCashTransaction(existing.cashTransactionId);
  }

  const deleted = await deleteSupplierLedgerEntry(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath("/admin/suppliers/payments");
  revalidatePath(`/admin/suppliers/${existing.supplierId}/khata`);
  if (existing.cashTransactionId) {
    revalidatePath("/admin/cash");
    revalidatePath("/admin/cash/analytics");
    revalidatePath("/admin/reports");
  }

  return NextResponse.json({ ok: true });
}
