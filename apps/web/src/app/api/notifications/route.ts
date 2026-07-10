import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/data";
import { markAllNotificationsRead } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import {
  countStaffUnreadDb,
  countSupplierUnreadDb,
  listStaffNotificationsDb,
  listSupplierNotificationsDb,
  markAllSupplierNotificationsReadDb,
  markNotificationReadDb,
} from "@/lib/db/notifications";
import {
  decrementStaffUnread,
  decrementSupplierUnread,
  readStaffInboxUnread,
  readSupplierInboxUnread,
  resetStaffUnread,
  resetSupplierUnread,
} from "@/lib/firebase/sync";

async function filterDemoForSupplier(
  notifications: Awaited<ReturnType<typeof getNotifications>>,
  supplierId: string
) {
  const { getBridalOrderById } = await import("@/lib/data");
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
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const isSupplier = session.role === "supplier" && !!session.supplierId;

  if (searchParams.get("countOnly") === "true") {
    if (isDbConfigured()) {
      let unread = isSupplier
        ? await countSupplierUnreadDb(session.supplierId!)
        : await countStaffUnreadDb(session.id);
      if (unread === 0) {
        const firestoreUnread = isSupplier
          ? await readSupplierInboxUnread(session.supplierId!)
          : await readStaffInboxUnread(session.id);
        if (firestoreUnread > 0) {
          if (isSupplier) resetSupplierUnread(session.supplierId!);
          else resetStaffUnread(session.id);
        }
      }
      return NextResponse.json({ unread });
    }
    let notifications = await getNotifications(false);
    if (isSupplier) notifications = await filterDemoForSupplier(notifications, session.supplierId!);
    if (unreadOnly) notifications = notifications.filter((n) => !n.read);
    return NextResponse.json({ unread: notifications.filter((n) => !n.read).length });
  }

  if (isDbConfigured()) {
    const list = isSupplier
      ? await listSupplierNotificationsDb(session.supplierId!, { unreadOnly, limit: 50 })
      : await listStaffNotificationsDb(session.id, 50, 0, unreadOnly);
    return NextResponse.json({ notifications: list });
  }

  let notifications = await getNotifications(false);
  if (isSupplier) notifications = await filterDemoForSupplier(notifications, session.supplierId!);
  if (unreadOnly) notifications = notifications.filter((n) => !n.read);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSupplier = session.role === "supplier" && !!session.supplierId;
  const body = await request.json().catch(() => ({}));

  if (body.id && isDbConfigured()) {
    await markNotificationReadDb(body.id);
    if (isSupplier) decrementSupplierUnread(session.supplierId!);
    else decrementStaffUnread();
    const { demoNotifications } = await import("@/lib/data/seed");
    const n = demoNotifications.find((x) => x.id === body.id);
    if (n) n.read = true;
    return NextResponse.json({ ok: true });
  }

  if (isSupplier && session.supplierId) {
    if (isDbConfigured()) await markAllSupplierNotificationsReadDb(session.supplierId);
    resetSupplierUnread(session.supplierId);
  } else {
    await markAllNotificationsRead(session.id);
    resetStaffUnread(session.id);
    resetStaffUnread();
  }
  return NextResponse.json({ ok: true });
}
