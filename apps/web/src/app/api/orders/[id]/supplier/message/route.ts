import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBridalOrderById } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { addSupplierMessage, markSupplierMessagesRead } from "@/lib/data/actions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "supplier") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await markSupplierMessagesRead(id);
  if (session.supplierId) {
    import("@/lib/firebase/sync")
      .then((m) => m.resetSupplierUnread(session.supplierId!))
      .catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "supplier") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  await addSupplierMessage(id, message, session.name);
  revalidatePath(`/supplier/orders/${id}`);
  return NextResponse.json({ ok: true });
}
