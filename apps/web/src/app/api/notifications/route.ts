import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";
import { markAllNotificationsRead } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { countUnreadNotificationsDb, markNotificationReadDb } from "@/lib/db/notifications";
import { getBridalOrderById } from "@/lib/data";
import { resetStaffUnread } from "@/lib/firebase/sync";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("countOnly") === "true") {
    if (isDbConfigured()) {
      const unread = await countUnreadNotificationsDb(session.id);
      return NextResponse.json({ unread });
    }
    const notifications = await getNotifications(false, session.id);
    return NextResponse.json({ unread: notifications.filter((n) => !n.read).length });
  }

  if (session.role === "supplier") {
    const notifications = await getNotifications(false, session.id);
    const supplierScoped = [];
    for (const n of notifications) {
      if (!n.orderId) continue;
      const order = await getBridalOrderById(n.orderId);
      if (order?.supplierId === session.supplierId) supplierScoped.push(n);
    }
    return NextResponse.json({ notifications: supplierScoped });
  }

  const notifications = await getNotifications(false, session.id);
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

  markAllNotificationsRead(session.id);
  resetStaffUnread(session.id);
  resetStaffUnread();
  return NextResponse.json({ ok: true });
}
