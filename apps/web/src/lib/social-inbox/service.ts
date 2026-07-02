import { demoNotifications } from "@/lib/data/seed";
import { isDbConfigured } from "@/lib/db";
import { createNotificationDb } from "@/lib/db/notifications";
import * as dbLayer from "@/lib/db/social-inbox";
import { demoSocialMessages, demoSocialThreads } from "./demo-store";
import type {
  SocialInboxStats,
  SocialMessage,
  SocialPlatform,
  SocialThread,
  SocialThreadStatus,
} from "./types";
import { SOCIAL_PLATFORM_LABELS } from "./types";

function notifyInquiry(title: string, body: string, threadId: string) {
  const href = `/admin/inbox/${threadId}`;
  demoNotifications.unshift({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
    href,
    threadId,
  });
  if (isDbConfigured()) {
    createNotificationDb({ title, body, href, threadId }).catch(console.error);
  }
}

function listDemoThreads(filters?: {
  platform?: SocialPlatform;
  unreadOnly?: boolean;
  status?: SocialThreadStatus;
}): SocialThread[] {
  let list = [...demoSocialThreads];
  if (filters?.platform) list = list.filter((t) => t.platform === filters.platform);
  if (filters?.unreadOnly) list = list.filter((t) => t.unreadCount > 0);
  if (filters?.status) list = list.filter((t) => t.status === filters.status);
  return list.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function getDemoStats(): SocialInboxStats {
  const byPlatform: SocialInboxStats["byPlatform"] = {
    facebook: 0,
    instagram: 0,
    whatsapp: 0,
    tiktok: 0,
    pinterest: 0,
    email: 0,
    walkin: 0,
    other: 0,
  };
  let totalUnread = 0;
  for (const t of demoSocialThreads) {
    byPlatform[t.platform] += t.unreadCount;
    totalUnread += t.unreadCount;
  }
  return { totalUnread, byPlatform };
}

export async function listSocialThreads(filters?: {
  platform?: SocialPlatform;
  unreadOnly?: boolean;
  status?: SocialThreadStatus;
}): Promise<SocialThread[]> {
  if (isDbConfigured()) {
    const rows = await dbLayer.listSocialThreadsDb(filters);
    if (rows.length || filters) return rows;
  }
  return listDemoThreads(filters);
}

export async function getSocialThread(threadId: string): Promise<SocialThread | null> {
  if (isDbConfigured()) {
    const row = await dbLayer.getSocialThreadDb(threadId);
    if (row) return row;
  }
  return demoSocialThreads.find((t) => t.id === threadId) ?? null;
}

export async function getSocialMessages(threadId: string): Promise<SocialMessage[]> {
  if (isDbConfigured()) {
    const rows = await dbLayer.getSocialMessagesDb(threadId);
    if (rows.length) return rows;
  }
  return demoSocialMessages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getSocialInboxStats(): Promise<SocialInboxStats> {
  if (isDbConfigured()) {
    try {
      return await dbLayer.getSocialInboxStatsDb();
    } catch {
      // Tables may not exist yet on a fresh production deploy.
    }
  }
  return getDemoStats();
}

export async function recordInboundMessage(input: {
  platform: SocialPlatform;
  externalThreadId: string;
  externalMessageId?: string;
  contactName?: string;
  contactHandle?: string;
  contactPhone?: string;
  body: string;
  subject?: string;
  metadata?: Record<string, unknown>;
  notify?: boolean;
}): Promise<{ thread: SocialThread; message: SocialMessage; isNew: boolean } | null> {
  const preview = input.body.slice(0, 200);

  if (isDbConfigured()) {
    let thread = await dbLayer.findThreadByExternalDb(input.platform, input.externalThreadId);
    let isNew = false;
    if (!thread) {
      thread = await dbLayer.createThreadDb({
        platform: input.platform,
        externalThreadId: input.externalThreadId,
        contactName: input.contactName,
        contactHandle: input.contactHandle,
        contactPhone: input.contactPhone,
        subject: input.subject,
        lastMessagePreview: preview,
        unreadCount: 1,
      });
      isNew = true;
    }
    if (!thread) return null;

    const message = await dbLayer.addMessageDb({
      threadId: thread.id,
      direction: "inbound",
      body: input.body,
      externalMessageId: input.externalMessageId,
      metadata: input.metadata,
      incrementUnread: !isNew,
      preview,
      status: "open",
    });
    if (!message) return null;

    const updated = await dbLayer.getSocialThreadDb(thread.id);
    if (input.notify !== false && updated) {
      const label = SOCIAL_PLATFORM_LABELS[input.platform];
      const who = input.contactHandle ?? input.contactName ?? "Customer";
      notifyInquiry(`New ${label} message`, `${who}: ${preview}`, updated.id);
    }
    return { thread: updated ?? thread, message, isNew };
  }

  let thread = demoSocialThreads.find(
    (t) => t.platform === input.platform && t.externalThreadId === input.externalThreadId
  );
  let isNew = false;
  if (!thread) {
    isNew = true;
    thread = {
      id: `st-${Date.now()}`,
      platform: input.platform,
      externalThreadId: input.externalThreadId,
      contactName: input.contactName ?? null,
      contactHandle: input.contactHandle ?? null,
      contactPhone: input.contactPhone ?? null,
      subject: input.subject ?? null,
      status: "open",
      unreadCount: 1,
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: preview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoSocialThreads.unshift(thread);
  } else {
    thread.unreadCount += 1;
    thread.lastMessageAt = new Date().toISOString();
    thread.lastMessagePreview = preview;
    thread.status = "open";
    thread.updatedAt = new Date().toISOString();
  }

  if (input.externalMessageId) {
    const dup = demoSocialMessages.find((m) => m.externalMessageId === input.externalMessageId);
    if (dup) return { thread, message: dup, isNew: false };
  }

  const message: SocialMessage = {
    id: `sm-${Date.now()}`,
    threadId: thread.id,
    direction: "inbound",
    body: input.body,
    externalMessageId: input.externalMessageId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
  demoSocialMessages.push(message);

  if (input.notify !== false) {
    const label = SOCIAL_PLATFORM_LABELS[input.platform];
    const who = input.contactHandle ?? input.contactName ?? "Customer";
    notifyInquiry(`New ${label} message`, `${who}: ${preview}`, thread.id);
  }

  return { thread, message, isNew };
}

export async function createManualInquiry(input: {
  platform: SocialPlatform;
  contactName?: string;
  contactHandle?: string;
  contactPhone?: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdByUserId?: string;
}): Promise<{ thread: SocialThread; message: SocialMessage } | null> {
  const preview = input.body.slice(0, 200);

  if (isDbConfigured()) {
    const thread = await dbLayer.createThreadDb({
      platform: input.platform,
      contactName: input.contactName,
      contactHandle: input.contactHandle,
      contactPhone: input.contactPhone,
      subject: input.subject,
      lastMessagePreview: preview,
      unreadCount: 1,
    });
    if (!thread) return null;
    const message = await dbLayer.addMessageDb({
      threadId: thread.id,
      direction: "inbound",
      body: input.body,
      metadata: input.metadata,
      incrementUnread: false,
      preview,
    });
    if (!message) return null;
    const label = SOCIAL_PLATFORM_LABELS[input.platform];
    notifyInquiry(`New ${label} inquiry logged`, preview, thread.id);
    return { thread, message };
  }

  const thread: SocialThread = {
    id: `st-${Date.now()}`,
    platform: input.platform,
    contactName: input.contactName ?? null,
    contactHandle: input.contactHandle ?? null,
    contactPhone: input.contactPhone ?? null,
    subject: input.subject ?? null,
    status: "open",
    unreadCount: 1,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: preview,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoSocialThreads.unshift(thread);
  const message: SocialMessage = {
    id: `sm-${Date.now()}`,
    threadId: thread.id,
    direction: "inbound",
    body: input.body,
    sentByUserId: input.createdByUserId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
  demoSocialMessages.push(message);
  const label = SOCIAL_PLATFORM_LABELS[input.platform];
  notifyInquiry(`New ${label} inquiry logged`, preview, thread.id);
  return { thread, message };
}

export async function addOutboundMessage(input: {
  threadId: string;
  body: string;
  sentByUserId?: string;
  externalMessageId?: string;
  status?: SocialThreadStatus;
}): Promise<SocialMessage | null> {
  if (isDbConfigured()) {
    return dbLayer.addMessageDb({
      threadId: input.threadId,
      direction: "outbound",
      body: input.body,
      sentByUserId: input.sentByUserId,
      externalMessageId: input.externalMessageId,
      incrementUnread: false,
      preview: input.body.slice(0, 200),
      status: input.status ?? "replied",
    });
  }

  const thread = demoSocialThreads.find((t) => t.id === input.threadId);
  if (!thread) return null;
  const message: SocialMessage = {
    id: `sm-${Date.now()}`,
    threadId: input.threadId,
    direction: "outbound",
    body: input.body,
    sentByUserId: input.sentByUserId,
    externalMessageId: input.externalMessageId,
    createdAt: new Date().toISOString(),
  };
  demoSocialMessages.push(message);
  thread.lastMessageAt = message.createdAt;
  thread.lastMessagePreview = input.body.slice(0, 200);
  thread.unreadCount = 0;
  thread.status = input.status ?? "replied";
  thread.updatedAt = message.createdAt;
  return message;
}

export async function updateSocialThread(
  threadId: string,
  patch: { status?: SocialThreadStatus; markRead?: boolean }
): Promise<SocialThread | null> {
  if (isDbConfigured()) {
    return dbLayer.updateThreadDb(threadId, patch);
  }
  const thread = demoSocialThreads.find((t) => t.id === threadId);
  if (!thread) return null;
  if (patch.status) thread.status = patch.status;
  if (patch.markRead) thread.unreadCount = 0;
  thread.updatedAt = new Date().toISOString();
  return thread;
}
