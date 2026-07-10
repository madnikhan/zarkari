import { and, desc, eq, isNull, or } from "drizzle-orm";
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

export async function listStaffNotificationsDb(staffUserId?: string, limit = 50): Promise<AppNotification[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(staffWhere(staffUserId))
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
