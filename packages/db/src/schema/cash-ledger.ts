import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  boolean,
  date,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cashDirectionEnum = pgEnum("cash_direction", ["in", "out"]);

export const cashTransactionTypeEnum = pgEnum("cash_transaction_type", [
  "order_deposit",
  "order_collection",
  "ready_made_sale",
  "other_in",
  "supplier_payment",
  "business_expense",
  "refund",
  "partner_loan",
  "other_out",
]);

export const cashPaymentMethodEnum = pgEnum("cash_payment_method", ["cash", "online"]);

export const cashTransactionSourceEnum = pgEnum("cash_transaction_source", ["manual", "auto"]);

export const cashOpeningBalances = pgTable(
  "cash_opening_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessDate: date("business_date").notNull(),
    cashInHand: decimal("cash_in_hand", { precision: 12, scale: 2 }).notNull(),
    onlineBank: decimal("online_bank", { precision: 12, scale: 2 }).notNull(),
    setByUserId: uuid("set_by_user_id"),
    isSample: boolean("is_sample").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("cash_opening_balances_date_idx").on(t.businessDate)]
);

export const cashTransactions = pgTable("cash_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  direction: cashDirectionEnum("direction").notNull(),
  type: cashTransactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: cashPaymentMethodEnum("method").notNull(),
  reference: text("reference"),
  description: text("description"),
  expenseCategory: text("expense_category"),
  businessDate: date("business_date").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  orderId: uuid("order_id"),
  retailOrderId: uuid("retail_order_id"),
  supplierId: uuid("supplier_id"),
  source: cashTransactionSourceEnum("source").default("manual").notNull(),
  isSample: boolean("is_sample").default(false).notNull(),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
