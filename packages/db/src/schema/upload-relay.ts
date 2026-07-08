import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type UploadRelayPart = { partNumber: number; etag: string };

export const uploadRelaySessions = pgTable("upload_relay_sessions", {
  uploadId: text("upload_id").primaryKey(),
  objectKey: text("object_key").notNull(),
  nextPartNumber: integer("next_part_number").notNull().default(1),
  bufferBase64: text("buffer_base64").notNull().default(""),
  completedParts: jsonb("completed_parts").$type<UploadRelayPart[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
