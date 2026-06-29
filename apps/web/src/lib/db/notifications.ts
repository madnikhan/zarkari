import { desc, eq } from "drizzle-orm";
import type { AppNotification } from "@/lib/data/seed";
import { getDb, schema } from "./index";

export async function listNotificationsDb(userId?: string, limit = 50): Promise<AppNotification[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(userId ? eq(schema.notifications.userId, userId) : undefined)
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
}

export async function markNotificationReadDb(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id));
}

export async function markAllNotificationsReadDb(userId?: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const rows = await db.select().from(schema.notifications);
  for (const row of rows) {
    if (userId && row.userId && row.userId !== userId) continue;
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, row.id));
  }
}
