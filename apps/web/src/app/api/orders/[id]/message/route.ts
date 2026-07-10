import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { addStaffMessage } from "@/lib/data/actions";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const orderId = body.orderId ?? id;
  const message = body.message?.trim();
  const audience = body.audience === "supplier" ? "supplier" : "customer";
  if (!orderId || !message) {
    return NextResponse.json({ error: "orderId and message required" }, { status: 400 });
  }

  await addStaffMessage(orderId, message, session.name, audience);
  revalidatePath(`/admin/orders/${orderId}`);
  return NextResponse.json({ ok: true });
}
