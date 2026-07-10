import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateRetailOrderStatusDb, getRetailOrderStatusDb } from "@/lib/db/retail-orders";
import { restoreForCancelledOrder } from "@/lib/stock/service";
import { updateRetailOrderStatus } from "@/lib/data/products";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };
  if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

  const previousStatus = await getRetailOrderStatusDb(id);

  const ok = await updateRetailOrderStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (status === "cancelled" && previousStatus !== "cancelled") {
    await restoreForCancelledOrder(id, session.id).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { getRetailOrderByIdDb } = await import("@/lib/db/retail-orders");
  const order = await getRetailOrderByIdDb(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
