import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const bridalStatusEnum = pgEnum("bridal_status", [
  "order_created",
  "sent_to_supplier",
  "supplier_rejected",
  "order_received",
  "fabric_preparation",
  "embroidery",
  "stitching",
  "finishing",
  "packing",
  "shipping",
  "delivered_to_shop",
  "redesign_in_progress",
  "ready_for_collection",
  "collected",
  "cancelled",
  "refunded",
]);

export const bridalOrders = pgTable("bridal_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id").notNull(),
  supplierId: uuid("supplier_id"),
  status: bridalStatusEnum("status").default("order_created").notNull(),
  bookingDate: timestamp("booking_date").defaultNow().notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  dressType: text("dress_type"),
  colour: text("colour"),
  size: text("size"),
  comments: text("comments"),
  customisationNotes: text("customisation_notes"),
  filesUnlockedAt: timestamp("files_unlocked_at"),
  supplierLocked: boolean("supplier_locked").default(false).notNull(),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timelineEventTypeEnum = pgEnum("timeline_event_type", [
  "order_created",
  "sent_to_supplier",
  "accepted",
  "rejected",
  "production_started",
  "redesign_requested",
  "cancelled",
  "refunded",
  "completed",
  "ready_for_collection",
  "received_at_shop",
  "collected",
  "stage_update",
]);

export const orderTimelineEvents = pgTable("order_timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  eventType: timelineEventTypeEnum("event_type").notNull(),
  comment: text("comment"),
  metadata: jsonb("metadata"),
  performedById: uuid("performed_by_id"),
  performedByName: text("performed_by_name"),
  performedByRole: text("performed_by_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderFiles = pgTable("order_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  category: text("category").notNull(),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  uploadedById: uuid("uploaded_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderRedesigns = pgTable("order_redesigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  reason: text("reason").notNull(),
  comment: text("comment"),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderCancellations = pgTable("order_cancellations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  reason: text("reason").notNull(),
  comment: text("comment"),
  cancelledByRole: text("cancelled_by_role").notNull(),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderRefunds = pgTable("order_refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  reason: text("reason").notNull(),
  comment: text("comment"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  refundDate: timestamp("refund_date").notNull(),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderCollections = pgTable("order_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().unique(),
  collectionDate: timestamp("collection_date").notNull(),
  balancePaid: boolean("balance_paid").notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  outstandingAmount: decimal("outstanding_amount", { precision: 10, scale: 2 }),
  alterationNotes: text("alteration_notes"),
  staffComments: text("staff_comments"),
  collectedById: uuid("collected_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierCompletions = pgTable("supplier_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().unique(),
  deliveryDate: timestamp("delivery_date").notNull(),
  billNumber: text("bill_number").notNull(),
  courierName: text("courier_name"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bridalPayments = pgTable("bridal_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerMessages = pgTable("customer_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  senderType: text("sender_type").notNull(),
  senderName: text("sender_name"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  orderId: uuid("order_id"),
  threadId: uuid("thread_id"),
  href: text("href"),
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
