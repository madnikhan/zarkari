import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { AppNotification } from "@/lib/data/seed";
import { getDb, schema } from "./index";
import { incrementStaffUnread } from "@/lib/firebase/sync";

function staffWhere(staffUserId?: string) {
  if (staffUserId) {
    return or(isNull(schema.notifications.userId), eq(schema.notifications.userId, staffUserId));
  }
  return isNull(schema.notifications.userId);
}

function staffUnreadWhere(staffUserId?: string) {
  return and(eq(schema.notifications.read, false), staffWhere(staffUserId));
}

export async function listStaffNotificationsDb(
  staffUserId?: string,
  limit = 50,
  offset = 0,
  unreadOnly = false
): Promise<AppNotification[]> {
  const db = getDb();
  if (!db) return [];
  const where = unreadOnly ? staffUnreadWhere(staffUserId) : staffWhere(staffUserId);
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(where)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId ?? undefined,
    orderId: row.orderId ?? undefined,
    threadId: row.threadId ?? undefined,
    href: row.href ?? undefined,
    title: row.title,
    body: row.body ?? undefined,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listNotificationsDb(userId?: string, limit = 50): Promise<AppNotification[]> {
  if (!userId) return listStaffNotificationsDb(undefined, limit);
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId ?? undefined,
    orderId: row.orderId ?? undefined,
    threadId: row.threadId ?? undefined,
    href: row.href ?? undefined,
    title: row.title,
    body: row.body ?? undefined,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createNotificationDb(input: {
  userId?: string;
  orderId?: string;
  title: string;
  body?: string;
  href?: string;
  threadId?: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.insert(schema.notifications).values({
    userId: input.userId ?? null,
    orderId: input.orderId ?? null,
    threadId: input.threadId ?? null,
    href: input.href ?? null,
    title: input.title,
    body: input.body ?? null,
  });
  incrementStaffUnread(input.userId);
}

export async function markNotificationReadDb(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id));
}

export async function markAllStaffNotificationsReadDb(staffUserId?: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(staffUnreadWhere(staffUserId));
}

export async function markAllNotificationsReadDb(userId?: string): Promise<void> {
  if (!userId) {
    await markAllStaffNotificationsReadDb();
    return;
  }
  const db = getDb();
  if (!db) return;
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(
      and(eq(schema.notifications.read, false), eq(schema.notifications.userId, userId))
    );
}

export async function countStaffUnreadDb(staffUserId?: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(staffUnreadWhere(staffUserId));
  return rows.length;
}

function mapNotificationRow(row: {
  id: string;
  userId: string | null;
  orderId: string | null;
  threadId: string | null;
  href: string | null;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: Date;
}): AppNotification {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    orderId: row.orderId ?? undefined,
    threadId: row.threadId ?? undefined,
    href: row.href ?? undefined,
    title: row.title,
    body: row.body ?? undefined,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSupplierNotificationsDb(
  supplierId: string,
  opts?: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<AppNotification[]> {
  const db = getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const conditions = [
    eq(schema.bridalOrders.supplierId, supplierId),
    isNotNull(schema.notifications.orderId),
  ];
  if (opts?.unreadOnly) conditions.push(eq(schema.notifications.read, false));

  const rows = await db
    .select({
      id: schema.notifications.id,
      userId: schema.notifications.userId,
      orderId: schema.notifications.orderId,
      threadId: schema.notifications.threadId,
      href: schema.notifications.href,
      title: schema.notifications.title,
      body: schema.notifications.body,
      read: schema.notifications.read,
      createdAt: schema.notifications.createdAt,
    })
    .from(schema.notifications)
    .innerJoin(schema.bridalOrders, eq(schema.notifications.orderId, schema.bridalOrders.id))
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapNotificationRow);
}

export async function countSupplierUnreadDb(supplierId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .innerJoin(schema.bridalOrders, eq(schema.notifications.orderId, schema.bridalOrders.id))
    .where(
      and(
        eq(schema.bridalOrders.supplierId, supplierId),
        eq(schema.notifications.read, false),
        isNotNull(schema.notifications.orderId)
      )
    );
  return rows.length;
}

export async function markAllSupplierNotificationsReadDb(supplierId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const unread = await listSupplierNotificationsDb(supplierId, { unreadOnly: true, limit: 5000 });
  if (!unread.length) return;
  await db
    .update(schema.notifications)
    .set({ read: true })
    .where(inArray(schema.notifications.id, unread.map((n) => n.id)));
}

export async function countStaffNotificationsDb(
  staffUserId?: string,
  unreadOnly = false
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const where = unreadOnly ? staffUnreadWhere(staffUserId) : staffWhere(staffUserId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(where);
  return Number(row?.count ?? 0);
}

export async function countUnreadNotificationsDb(userId?: string): Promise<number> {
  if (!userId) return countStaffUnreadDb();
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(
      and(eq(schema.notifications.read, false), eq(schema.notifications.userId, userId))
    );
  return rows.length;
}
