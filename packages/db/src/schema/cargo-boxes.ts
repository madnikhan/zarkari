import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  date,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const cargoCompanies = pgTable("cargo_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cargoBoxes = pgTable("cargo_boxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  boxNumber: text("box_number").notNull().unique(),
  cargoCompanyId: uuid("cargo_company_id").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  supplierId: uuid("supplier_id").notNull(),
  receivedDate: date("received_date").notNull(),
  weightKg: decimal("weight_kg", { precision: 10, scale: 2 }),
  notes: text("notes"),
  exchangeRate: decimal("exchange_rate", { precision: 12, scale: 4 }),
  khataEntryId: uuid("khata_entry_id"),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cargoBoxItems = pgTable("cargo_box_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  boxId: uuid("box_id").notNull(),
  itemDate: date("item_date").notNull(),
  articleName: text("article_name").notNull(),
  bridalOrderId: uuid("bridal_order_id"),
  costPkr: decimal("cost_pkr", { precision: 14, scale: 2 }).default("0").notNull(),
  costGbp: decimal("cost_gbp", { precision: 12, scale: 2 }).default("0").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 12, scale: 4 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  imageUrl: text("image_url"),
  imageKey: text("image_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
