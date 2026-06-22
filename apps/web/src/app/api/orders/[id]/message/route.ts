import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addStaffMessage } from "@/lib/data/actions";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { orderId, message } = body as { orderId?: string; message?: string };
  if (!orderId || !message?.trim()) {
    return NextResponse.json({ error: "orderId and message required" }, { status: 400 });
  }

  addStaffMessage(orderId, message.trim(), session.name);
  return NextResponse.json({ ok: true });
}
