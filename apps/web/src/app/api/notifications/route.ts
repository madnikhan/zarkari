import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";
import { markAllNotificationsRead } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { markNotificationReadDb } from "@/lib/db/notifications";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await getNotifications();
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.id && isDbConfigured()) {
    await markNotificationReadDb(body.id);
    const { demoNotifications } = await import("@/lib/data/seed");
    const n = demoNotifications.find((x) => x.id === body.id);
    if (n) n.read = true;
    return NextResponse.json({ ok: true });
  }

  markAllNotificationsRead();
  return NextResponse.json({ ok: true });
}
