import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  contentHtml: text("content_html").notNull(),
  imageUrl: text("image_url"),
  published: boolean("published").default(true).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  author: text("author").default("ZARKARI"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shopSettings = pgTable("shop_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
