import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import {
  deleteCashTransaction,
  getCashTransaction,
  updateCashTransaction,
  type CashPaymentMethod,
} from "@/lib/db/cash-ledger";

type Params = { params: Promise<{ id: string }> };

function revalidateCashPaths() {
  revalidatePath("/admin/cash");
  revalidatePath("/admin/cash/analytics");
  revalidatePath("/admin/reports");
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getCashTransaction(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const patch: {
    amount?: string;
    description?: string | null;
    method?: CashPaymentMethod;
    expenseCategory?: string | null;
  } = {};

  if (body.amount !== undefined) {
    const amount = String(body.amount).trim();
    if (!amount || Number.isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (existing.source === "auto") {
      return NextResponse.json(
        { error: "Cannot change amount on auto-posted transactions" },
        { status: 409 }
      );
    }
    patch.amount = amount;
  }

  if (body.description !== undefined) {
    patch.description =
      body.description === null || body.description === ""
        ? null
        : String(body.description);
  }

  if (body.method !== undefined) {
    if (body.method !== "cash" && body.method !== "online") {
      return NextResponse.json({ error: "method must be cash or online" }, { status: 400 });
    }
    if (existing.source === "auto") {
      return NextResponse.json(
        { error: "Cannot change method on auto-posted transactions" },
        { status: 409 }
      );
    }
    patch.method = body.method;
  }

  if (body.expenseCategory !== undefined) {
    patch.expenseCategory =
      body.expenseCategory === null || body.expenseCategory === ""
        ? null
        : String(body.expenseCategory);
  }

  const transaction = await updateCashTransaction(id, patch);
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateCashPaths();
  return NextResponse.json({ transaction });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await getCashTransaction(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.source === "auto") {
    return NextResponse.json(
      { error: "Cannot delete auto-posted transactions. Reverse the related order action instead." },
      { status: 409 }
    );
  }

  const ok = await deleteCashTransaction(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateCashPaths();
  return NextResponse.json({ ok: true });
}
