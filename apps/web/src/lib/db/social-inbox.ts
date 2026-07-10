import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  SocialInboxStats,
  SocialMessage,
  SocialPlatform,
  SocialThread,
  SocialThreadStatus,
} from "@/lib/social-inbox/types";
import { getDb, schema } from "./index";

function mapThread(row: typeof schema.socialThreads.$inferSelect): SocialThread {
  return {
    id: row.id,
    platform: row.platform as SocialPlatform,
    externalThreadId: row.externalThreadId,
    contactName: row.contactName,
    contactHandle: row.contactHandle,
    contactPhone: row.contactPhone,
    subject: row.subject,
    status: row.status as SocialThreadStatus,
    unreadCount: row.unreadCount,
    lastMessageAt: row.lastMessageAt.toISOString(),
    lastMessagePreview: row.lastMessagePreview,
    assignedToUserId: row.assignedToUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapMessage(row: typeof schema.socialMessages.$inferSelect): SocialMessage {
  return {
    id: row.id,
    threadId: row.threadId,
    direction: row.direction as SocialMessage["direction"],
    body: row.body,
    externalMessageId: row.externalMessageId,
    sentByUserId: row.sentByUserId,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSocialThreadsDb(filters?: {
  platform?: SocialPlatform;
  unreadOnly?: boolean;
  status?: SocialThreadStatus;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ threads: SocialThread[]; total: number }> {
  const db = getDb();
  if (!db) return { threads: [], total: 0 };

  const conditions = [];
  if (filters?.platform) conditions.push(eq(schema.socialThreads.platform, filters.platform));
  if (filters?.unreadOnly) conditions.push(sql`${schema.socialThreads.unreadCount} > 0`);
  if (filters?.status) conditions.push(eq(schema.socialThreads.status, filters.status));
  if (filters?.q?.trim()) {
    const pat = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(schema.socialThreads.contactName, pat),
        ilike(schema.socialThreads.lastMessagePreview, pat),
        ilike(schema.socialThreads.contactHandle, pat)
      )
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.socialThreads)
    .where(whereClause);

  const rows = await db
    .select()
    .from(schema.socialThreads)
    .where(whereClause)
    .orderBy(desc(schema.socialThreads.lastMessageAt))
    .limit(limit)
    .offset(offset);

  return { threads: rows.map(mapThread), total: Number(countRow?.count ?? 0) };
}

export async function getSocialThreadDb(threadId: string): Promise<SocialThread | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.socialThreads)
    .where(eq(schema.socialThreads.id, threadId))
    .limit(1);
  return row ? mapThread(row) : null;
}

export async function getSocialMessagesDb(threadId: string): Promise<SocialMessage[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.socialMessages)
    .where(eq(schema.socialMessages.threadId, threadId))
    .orderBy(schema.socialMessages.createdAt);
  return rows.map(mapMessage);
}

export async function findThreadByExternalDb(
  platform: SocialPlatform,
  externalThreadId: string
): Promise<SocialThread | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(schema.socialThreads)
    .where(
      and(
        eq(schema.socialThreads.platform, platform),
        eq(schema.socialThreads.externalThreadId, externalThreadId)
      )
    )
    .limit(1);
  return row ? mapThread(row) : null;
}

export async function getSocialInboxStatsDb(): Promise<SocialInboxStats> {
  const db = getDb();
  const empty: SocialInboxStats = {
    totalUnread: 0,
    byPlatform: {
      facebook: 0,
      instagram: 0,
      whatsapp: 0,
      tiktok: 0,
      pinterest: 0,
      email: 0,
      walkin: 0,
      other: 0,
    },
  };
  if (!db) return empty;

  const rows = await db
    .select({
      platform: schema.socialThreads.platform,
      unread: sql<number>`sum(${schema.socialThreads.unreadCount})`.mapWith(Number),
    })
    .from(schema.socialThreads)
    .groupBy(schema.socialThreads.platform);

  let totalUnread = 0;
  const byPlatform = { ...empty.byPlatform };
  for (const row of rows) {
    const p = row.platform as SocialPlatform;
    const count = row.unread ?? 0;
    if (p in byPlatform) byPlatform[p] = count;
    totalUnread += count;
  }
  return { totalUnread, byPlatform };
}

export async function createThreadDb(input: {
  platform: SocialPlatform;
  externalThreadId?: string;
  contactName?: string;
  contactHandle?: string;
  contactPhone?: string;
  subject?: string;
  lastMessagePreview: string;
  unreadCount?: number;
}): Promise<SocialThread | null> {
  const db = getDb();
  if (!db) return null;
  const now = new Date();
  const [row] = await db
    .insert(schema.socialThreads)
    .values({
      platform: input.platform,
      externalThreadId: input.externalThreadId ?? null,
      contactName: input.contactName ?? null,
      contactHandle: input.contactHandle ?? null,
      contactPhone: input.contactPhone ?? null,
      subject: input.subject ?? null,
      status: "open",
      unreadCount: input.unreadCount ?? 0,
      lastMessageAt: now,
      lastMessagePreview: input.lastMessagePreview,
      updatedAt: now,
    })
    .returning();
  return row ? mapThread(row) : null;
}

export async function addMessageDb(input: {
  threadId: string;
  direction: SocialMessage["direction"];
  body: string;
  externalMessageId?: string;
  sentByUserId?: string;
  metadata?: Record<string, unknown>;
  incrementUnread?: boolean;
  preview?: string;
  status?: SocialThreadStatus;
}): Promise<SocialMessage | null> {
  const db = getDb();
  if (!db) return null;

  if (input.externalMessageId) {
    const [existing] = await db
      .select()
      .from(schema.socialMessages)
      .where(eq(schema.socialMessages.externalMessageId, input.externalMessageId))
      .limit(1);
    if (existing) return mapMessage(existing);
  }

  const now = new Date();
  const [msg] = await db
    .insert(schema.socialMessages)
    .values({
      threadId: input.threadId,
      direction: input.direction,
      body: input.body,
      externalMessageId: input.externalMessageId ?? null,
      sentByUserId: input.sentByUserId ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();

  if (!msg) return null;

  const preview = input.preview ?? input.body.slice(0, 200);
  await db
    .update(schema.socialThreads)
    .set({
      lastMessageAt: now,
      lastMessagePreview: preview,
      updatedAt: now,
      ...(input.status ? { status: input.status } : {}),
      ...(input.incrementUnread
        ? { unreadCount: sql`${schema.socialThreads.unreadCount} + 1` }
        : {}),
      ...(!input.incrementUnread && input.direction === "outbound"
        ? { unreadCount: 0, status: input.status ?? "replied" }
        : {}),
    })
    .where(eq(schema.socialThreads.id, input.threadId));

  return mapMessage(msg);
}

export async function updateThreadDb(
  threadId: string,
  patch: { status?: SocialThreadStatus; markRead?: boolean }
): Promise<SocialThread | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .update(schema.socialThreads)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.markRead ? { unreadCount: 0 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.socialThreads.id, threadId))
    .returning();
  return row ? mapThread(row) : null;
}
