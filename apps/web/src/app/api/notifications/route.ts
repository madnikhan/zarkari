import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";
import { markAllNotificationsRead } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import {
  countStaffUnreadDb,
  listStaffNotificationsDb,
  markNotificationReadDb,
} from "@/lib/db/notifications";
import { getBridalOrderById } from "@/lib/data";
import { decrementStaffUnread, resetStaffUnread } from "@/lib/firebase/sync";

async function filterForSupplier(
  notifications: Awaited<ReturnType<typeof listStaffNotificationsDb>>,
  supplierId: string
) {
  const supplierScoped = [];
  for (const n of notifications) {
    if (!n.orderId) continue;
    const order = await getBridalOrderById(n.orderId);
    if (order?.supplierId === supplierId) supplierScoped.push(n);
  }
  return supplierScoped;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("countOnly") === "true") {
    if (isDbConfigured()) {
      if (session.role === "supplier" && session.supplierId) {
        const all = await listStaffNotificationsDb();
        const scoped = await filterForSupplier(all, session.supplierId);
        return NextResponse.json({ unread: scoped.filter((n) => !n.read).length });
      }
      const unread = await countStaffUnreadDb(session.id);
      return NextResponse.json({ unread });
    }
    const notifications = await getNotifications(false);
    const filtered =
      session.role === "supplier" && session.supplierId
        ? await filterForSupplier(notifications, session.supplierId)
        : notifications;
    return NextResponse.json({ unread: filtered.filter((n) => !n.read).length });
  }

  if (isDbConfigured()) {
    const all = await listStaffNotificationsDb(session.role === "supplier" ? undefined : session.id);
    if (session.role === "supplier" && session.supplierId) {
      const supplierScoped = await filterForSupplier(all, session.supplierId);
      return NextResponse.json({ notifications: supplierScoped });
    }
    return NextResponse.json({ notifications: all });
  }

  const notifications = await getNotifications(false);
  if (session.role === "supplier" && session.supplierId) {
    const supplierScoped = await filterForSupplier(notifications, session.supplierId);
    return NextResponse.json({ notifications: supplierScoped });
  }
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.id && isDbConfigured()) {
    await markNotificationReadDb(body.id);
    decrementStaffUnread();
    const { demoNotifications } = await import("@/lib/data/seed");
    const n = demoNotifications.find((x) => x.id === body.id);
    if (n) n.read = true;
    return NextResponse.json({ ok: true });
  }

  await markAllNotificationsRead(session.id);
  resetStaffUnread(session.id);
  resetStaffUnread();
  return NextResponse.json({ ok: true });
}
