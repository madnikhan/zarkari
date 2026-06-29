import { asc, eq } from "drizzle-orm";
import type { Collection, Product } from "@/lib/data/seed";
import { getDb, schema } from "./index";
import { getProductByIdDb, listProductsDb } from "./cms-products";

export async function listCollectionsDb(): Promise<Collection[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.collections).orderBy(asc(schema.collections.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    title: r.title,
    description: r.description ?? undefined,
    imageUrl: r.imageUrl ?? undefined,
  }));
}

export async function getCollectionByHandleDb(
  handle: string
): Promise<(Collection & { products: Product[] }) | null> {
  const db = getDb();
  if (!db) return null;

  const [row] = await db.select().from(schema.collections).where(eq(schema.collections.handle, handle)).limit(1);
  if (!row) return null;

  const collection: Collection = {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
  };

  if (handle === "catalogue") {
    const all = await listProductsDb(200, true);
    return { ...collection, products: all };
  }

  const joins = await db
    .select({ productId: schema.productCollections.productId })
    .from(schema.productCollections)
    .where(eq(schema.productCollections.collectionId, row.id));

  const products: Product[] = [];
  for (const j of joins) {
    const p = await getProductByIdDb(j.productId);
    if (p) products.push(p);
  }

  return { ...collection, products };
}

export async function createCollectionDb(input: {
  handle: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}): Promise<Collection | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.collections)
    .values({
      handle: input.handle,
      title: input.title,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
  };
}

export async function updateCollectionDb(
  id: string,
  input: Partial<{ handle: string; title: string; description: string; imageUrl: string; sortOrder: number }>
): Promise<Collection | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.update(schema.collections).set(input).where(eq(schema.collections.id, id)).returning();
  if (!row) return null;
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
  };
}

export async function deleteCollectionDb(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await db.delete(schema.productCollections).where(eq(schema.productCollections.collectionId, id));
  await db.delete(schema.collections).where(eq(schema.collections.id, id));
  return true;
}

export async function countCollectionsDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select().from(schema.collections);
  return rows.length;
}
