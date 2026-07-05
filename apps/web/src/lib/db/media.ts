import { desc, eq } from "drizzle-orm";
import { getMediaKind, type MediaKind } from "@/lib/upload/mime";
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

export interface ListMediaOptions {
  limit?: number;
  category?: string;
  type?: MediaKind;
}

function mapRow(r: typeof schema.mediaAssets.$inferSelect): MediaAsset {
  return {
    id: r.id,
    fileName: r.fileName,
    url: r.url,
    mimeType: r.mimeType ?? undefined,
    category: r.category ?? undefined,
    uploadedByUserId: r.uploadedByUserId ?? undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listMediaDb(options: ListMediaOptions = {}): Promise<MediaAsset[]> {
  const db = getDb();
  if (!db) return [];
  const limit = options.limit ?? 200;

  const rows = options.category
    ? await db
        .select()
        .from(schema.mediaAssets)
        .where(eq(schema.mediaAssets.category, options.category))
        .orderBy(desc(schema.mediaAssets.createdAt))
        .limit(limit)
    : await db.select().from(schema.mediaAssets).orderBy(desc(schema.mediaAssets.createdAt)).limit(limit);

  let assets = rows.map(mapRow);

  if (options.type) {
    assets = assets.filter(
      (a) => getMediaKind(a.fileName, a.mimeType, a.category) === options.type
    );
  }

  return assets;
}

export async function listMediaCategoriesDb(): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select({ category: schema.mediaAssets.category }).from(schema.mediaAssets);
  const set = new Set<string>();
  for (const r of rows) {
    if (r.category) set.add(r.category);
  }
  return Array.from(set).sort();
}

export async function getMediaDb(id: string): Promise<MediaAsset | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id)).limit(1);
  return row ? mapRow(row) : null;
}

export async function deleteMediaDb(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const result = await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, id)).returning({ id: schema.mediaAssets.id });
  return result.length > 0;
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
  return mapRow(row);
}
