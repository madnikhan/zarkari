import { pgTable, text, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";

export const deviceTokenRoleEnum = ["admin", "supplier", "customer"] as const;
export type DeviceTokenRole = (typeof deviceTokenRoleEnum)[number];

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fcmToken: text("fcm_token").notNull(),
    userId: uuid("user_id"),
    orderId: uuid("order_id"),
    role: text("role").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("device_tokens_fcm_token_idx").on(t.fcmToken),
    index("device_tokens_user_id_idx").on(t.userId),
    index("device_tokens_order_id_idx").on(t.orderId),
  ]
);
