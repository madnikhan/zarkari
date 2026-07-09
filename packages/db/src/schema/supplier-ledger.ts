import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  date,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const supplierLedgerTypeEnum = pgEnum("supplier_ledger_type", ["bill", "stock", "payment"]);

export const supplierLedgerEntries = pgTable(
  "supplier_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id").notNull(),
    type: supplierLedgerTypeEnum("type").notNull(),
    orderId: uuid("order_id"),
    description: text("description"),
    billNumber: text("bill_number"),
    amountGbp: decimal("amount_gbp", { precision: 12, scale: 2 }).default("0").notNull(),
    amountPkr: decimal("amount_pkr", { precision: 14, scale: 2 }).default("0").notNull(),
    exchangeRate: decimal("exchange_rate", { precision: 12, scale: 4 }),
    businessDate: date("business_date").notNull(),
    cashTransactionId: uuid("cash_transaction_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("supplier_ledger_supplier_id_idx").on(t.supplierId),
    index("supplier_ledger_business_date_idx").on(t.businessDate),
  ]
);
