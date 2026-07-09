import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  boolean,
  primaryKey,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  descriptionHtml: text("description_html"),
  fabric: text("fabric"),
  tags: text("tags").array(),
  featuredImageUrl: text("featured_image_url"),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid("product_id").notNull(),
    collectionId: uuid("collection_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })]
);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull(),
  title: text("title").notNull(),
  sku: text("sku"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  inventoryQty: integer("inventory_qty").default(0).notNull(),
  options: jsonb("options").$type<{ name: string; value: string }[]>(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").default(0),
});

export const retailOrders = pgTable("retail_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  status: text("status").default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const retailOrderItems = pgTable(
  "retail_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull(),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    title: text("title").notNull(),
    quantity: integer("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    measurements: jsonb("measurements").$type<{
      mode: "standard" | "custom";
      label: string;
      measurements: Record<string, number>;
    }>(),
  },
  (t) => [index("retail_order_items_order_id_idx").on(t.orderId)]
);
