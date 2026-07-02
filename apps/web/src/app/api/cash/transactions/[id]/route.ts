import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteCashTransaction } from "@/lib/db/cash-ledger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await deleteCashTransaction(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
