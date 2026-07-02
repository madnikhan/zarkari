import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  sendToSupplier,
  cancelOrder,
  refundOrder,
  sendForRedesign,
  markCollected,
} from "@/lib/data/actions";
import { getSession, canRefund } from "@/lib/auth/session";

type Action = "send-to-supplier" | "cancel" | "refund" | "redesign" | "collect";

interface Props {
  params: Promise<{ id: string; action: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await params;
  if (!["send-to-supplier", "cancel", "refund", "redesign", "collect"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  switch (action as Action) {
    case "send-to-supplier":
      await sendToSupplier(id, session.name);
      break;
    case "cancel":
      if (session.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
      await cancelOrder(id, body.reason ?? "Cancelled", session.name, "owner");
      break;
    case "refund":
      if (!canRefund(session.role)) return NextResponse.json({ error: "Owner only" }, { status: 403 });
      await refundOrder(id, body.amount ?? "0", body.reason ?? "Refund", session.name);
      break;
    case "redesign":
      if (session.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
      await sendForRedesign(
        id,
        body.reason ?? "Redesign requested",
        session.name,
        body.comment ?? body.reason
      );
      break;
    case "collect":
      await markCollected(id, session.name, {
        balancePaid: body.balancePaid ?? true,
        amountPaid: body.amountPaid,
        alterationNotes: body.alterationNotes,
      });
      break;
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/cash");

  return NextResponse.json({ ok: true });
}
