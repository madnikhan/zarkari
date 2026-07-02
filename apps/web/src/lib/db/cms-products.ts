import { and, asc, eq, inArray } from "drizzle-orm";
import type { Product } from "@/lib/data/seed";
import { getDb, isUuid, schema } from "./index";

async function loadProductRelations(
  db: NonNullable<ReturnType<typeof getDb>>,
  productIds: string[]
): Promise<Map<string, { variants: Product["variants"]; images: string[]; collectionHandles: string[] }>> {
  const map = new Map<string, { variants: Product["variants"]; images: string[]; collectionHandles: string[] }>();
  if (!productIds.length) return map;

  const variants = await db
    .select()
    .from(schema.productVariants)
    .where(inArray(schema.productVariants.productId, productIds));

  const images = await db
    .select()
    .from(schema.productImages)
    .where(inArray(schema.productImages.productId, productIds))
    .orderBy(asc(schema.productImages.sortOrder));

  const joins = await db
    .select({
      productId: schema.productCollections.productId,
      handle: schema.collections.handle,
    })
    .from(schema.productCollections)
    .innerJoin(schema.collections, eq(schema.productCollections.collectionId, schema.collections.id))
    .where(inArray(schema.productCollections.productId, productIds));

  for (const id of productIds) {
    map.set(id, { variants: [], images: [], collectionHandles: [] });
  }

  for (const v of variants) {
    const entry = map.get(v.productId)!;
    entry.variants.push({
      id: v.id,
      title: v.title,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? undefined,
      inventoryQty: v.inventoryQty,
      options: v.options ?? [{ name: "Title", value: v.title }],
    });
  }

  for (const img of images) {
    map.get(img.productId)!.images.push(img.url);
  }

  for (const j of joins) {
    map.get(j.productId)!.collectionHandles.push(j.handle);
  }

  return map;
}

function mapProduct(
  row: typeof schema.products.$inferSelect,
  rel: { variants: Product["variants"]; images: string[]; collectionHandles: string[] }
): Product {
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    description: row.description ?? "",
    descriptionHtml: row.descriptionHtml ?? undefined,
    fabric: row.fabric ?? undefined,
    tags: row.tags ?? [],
    featuredImageUrl: row.featuredImageUrl ?? undefined,
    images: rel.images.length ? rel.images : row.featuredImageUrl ? [row.featuredImageUrl] : [],
    variants: rel.variants,
    collectionHandles: rel.collectionHandles,
  };
}

export async function listProductsDb(limit = 100, publishedOnly = false): Promise<Product[]> {
  const db = getDb();
  if (!db) return [];

  const rows = publishedOnly
    ? await db.select().from(schema.products).where(eq(schema.products.published, true)).limit(limit)
    : await db.select().from(schema.products).limit(limit);

  const rel = await loadProductRelations(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((r) => mapProduct(r, rel.get(r.id)!));
}

export async function getProductByIdDb(id: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  if (!row) return null;
  const rel = await loadProductRelations(db, [row.id]);
  return mapProduct(row, rel.get(row.id)!);
}

export async function getProductByHandleDb(handle: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.products).where(eq(schema.products.handle, handle)).limit(1);
  if (!row) return null;
  const rel = await loadProductRelations(db, [row.id]);
  return mapProduct(row, rel.get(row.id)!);
}

export async function createProductDb(input: {
  title: string;
  handle: string;
  description?: string;
  fabric?: string;
  price: string;
  inventoryQty?: number;
  featuredImageUrl?: string;
  images?: string[];
  collectionHandles?: string[];
  published?: boolean;
  tags?: string[];
}): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;

  const [product] = await db
    .insert(schema.products)
    .values({
      title: input.title,
      handle: input.handle,
      description: input.description ?? "",
      fabric: input.fabric ?? null,
      featuredImageUrl: input.featuredImageUrl ?? null,
      tags: input.tags ?? [],
      published: input.published ?? true,
    })
    .returning();

  await db.insert(schema.productVariants).values({
    productId: product.id,
    title: "Standard",
    price: input.price,
    inventoryQty: input.inventoryQty ?? 5,
    options: [{ name: "Title", value: "Standard" }],
  });

  const imageUrls = input.images?.length ? input.images : input.featuredImageUrl ? [input.featuredImageUrl] : [];
  for (let i = 0; i < imageUrls.length; i++) {
    await db.insert(schema.productImages).values({
      productId: product.id,
      url: imageUrls[i],
      sortOrder: i,
    });
  }

  if (input.collectionHandles?.length) {
    const cols = await db
      .select()
      .from(schema.collections)
      .where(inArray(schema.collections.handle, input.collectionHandles));
    for (const col of cols) {
      await db.insert(schema.productCollections).values({ productId: product.id, collectionId: col.id });
    }
  }

  return getProductByIdDb(product.id);
}

export async function updateProductDb(
  id: string,
  input: Partial<{
    title: string;
    handle: string;
    description: string;
    fabric: string;
    price: string;
    inventoryQty: number;
    featuredImageUrl: string;
    images: string[];
    collectionHandles: string[];
    published: boolean;
    tags: string[];
  }>
): Promise<Product | null> {
  const db = getDb();
  if (!db) return null;

  await db
    .update(schema.products)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.handle !== undefined ? { handle: input.handle } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.fabric !== undefined ? { fabric: input.fabric } : {}),
      ...(input.featuredImageUrl !== undefined ? { featuredImageUrl: input.featuredImageUrl } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    })
    .where(eq(schema.products.id, id));

  if (input.price !== undefined || input.inventoryQty !== undefined) {
    const variants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, id))
      .limit(1);
    if (variants[0]) {
      await db
        .update(schema.productVariants)
        .set({
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.inventoryQty !== undefined ? { inventoryQty: input.inventoryQty } : {}),
        })
        .where(eq(schema.productVariants.id, variants[0].id));
    }
  }

  if (input.images !== undefined) {
    await db.delete(schema.productImages).where(eq(schema.productImages.productId, id));
    for (let i = 0; i < input.images.length; i++) {
      await db.insert(schema.productImages).values({ productId: id, url: input.images[i], sortOrder: i });
    }
  }

  if (input.collectionHandles !== undefined) {
    await db.delete(schema.productCollections).where(eq(schema.productCollections.productId, id));
    if (input.collectionHandles.length) {
      const cols = await db
        .select()
        .from(schema.collections)
        .where(inArray(schema.collections.handle, input.collectionHandles));
      for (const col of cols) {
        await db.insert(schema.productCollections).values({ productId: id, collectionId: col.id });
      }
    }
  }

  return getProductByIdDb(id);
}

export async function countProductsDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select().from(schema.products);
  return rows.length;
}
