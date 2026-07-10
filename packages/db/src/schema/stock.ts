import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    type: text("type").notNull(), // receive | sale | adjustment | return
    quantityDelta: integer("quantity_delta").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    createdByUserId: uuid("created_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("stock_movements_product_id_idx").on(t.productId),
    index("stock_movements_variant_id_idx").on(t.variantId),
    index("stock_movements_created_at_idx").on(t.createdAt),
  ]
);
