import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  category: text("category").default("general"),
  uploadedByUserId: uuid("uploaded_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
