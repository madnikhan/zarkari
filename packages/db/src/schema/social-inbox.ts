import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const socialThreads = pgTable(
  "social_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull(),
    externalThreadId: text("external_thread_id"),
    contactName: text("contact_name"),
    contactHandle: text("contact_handle"),
    contactPhone: text("contact_phone"),
    subject: text("subject"),
    status: text("status").default("open").notNull(),
    unreadCount: integer("unread_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    lastMessagePreview: text("last_message_preview"),
    assignedToUserId: uuid("assigned_to_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("social_threads_platform_external_idx").on(t.platform, t.externalThreadId),
  ]
);

export const socialMessages = pgTable("social_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull(),
  direction: text("direction").notNull(),
  body: text("body").notNull(),
  externalMessageId: text("external_message_id"),
  sentByUserId: uuid("sent_by_user_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
