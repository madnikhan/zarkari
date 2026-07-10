import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBridalOrderById } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { addSupplierProgressUpdate } from "@/lib/data/actions";
import { getMediaKind } from "@/lib/upload/mime";

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

  if (!order.filesUnlockedAt) {
    return NextResponse.json({ error: "Accept the order before sending updates" }, { status: 400 });
  }

  const body = await request.json();
  const fileUrl = body.fileUrl?.trim();
  const fileName = body.fileName?.trim() || "progress-update";
  const message = body.message?.trim();
  if (!fileUrl) return NextResponse.json({ error: "fileUrl required" }, { status: 400 });

  const attachmentKind = getMediaKind(fileName, body.mimeType, "supplier_progress");
  await addSupplierProgressUpdate(id, {
    fileUrl,
    fileName,
    attachmentKind,
    message,
    senderName: session.name,
  });

  revalidatePath(`/supplier/orders/${id}`);
  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ ok: true });
}
