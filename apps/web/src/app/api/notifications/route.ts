import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";
import { markAllNotificationsRead } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await getNotifications();
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  markAllNotificationsRead();
  return NextResponse.json({ ok: true });
}
