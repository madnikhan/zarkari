import { desc } from "drizzle-orm";
import { getDb, schema } from "./index";

export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType?: string;
  category?: string;
  uploadedByUserId?: string;
  createdAt: string;
}

export async function listMediaDb(limit = 100): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.mediaAssets).orderBy(desc(schema.mediaAssets.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    url: r.url,
    mimeType: r.mimeType ?? undefined,
    category: r.category ?? undefined,
    uploadedByUserId: r.uploadedByUserId ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createMediaDb(input: {
  fileName: string;
  url: string;
  mimeType?: string;
  category?: string;
  uploadedByUserId?: string;
}): Promise<MediaAsset | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.mediaAssets)
    .values({
      fileName: input.fileName,
      url: input.url,
      mimeType: input.mimeType ?? null,
      category: input.category ?? "general",
      uploadedByUserId: input.uploadedByUserId ?? null,
    })
    .returning();
  return {
    id: row.id,
    fileName: row.fileName,
    url: row.url,
    mimeType: row.mimeType ?? undefined,
    category: row.category ?? undefined,
    uploadedByUserId: row.uploadedByUserId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
