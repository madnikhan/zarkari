import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Product } from "@/lib/data/seed";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";
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
      lowStockThreshold: v.lowStockThreshold ?? undefined,
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

export async function getVariantByIdDb(variantId: string) {
  const db = getDb();
  if (!db || !isUuid(variantId)) return null;
  const [row] = await db
    .select()
    .from(schema.productVariants)
    .where(eq(schema.productVariants.id, variantId))
    .limit(1);
  if (!row) return null;
  const product = await getProductByIdDb(row.productId);
  if (!product) return null;
  const variant = product.variants.find((v) => v.id === row.id);
  if (!variant) return null;
  return { variant, product };
}

async function upsertSizeVariants(
  db: NonNullable<ReturnType<typeof getDb>>,
  productId: string,
  price: string,
  sizeStock: Partial<Record<StandardSizeKey, number>>,
  lowStockThreshold = 2
) {
  const existing = await db
    .select()
    .from(schema.productVariants)
    .where(eq(schema.productVariants.productId, productId));

  for (const size of STANDARD_SIZES) {
    const match = existing.find(
      (v) => v.options?.some((o) => o.name === "Size" && o.value === size) || v.title === size
    );
    const qty = sizeStock[size] ?? 0;
    if (match) {
      await db
        .update(schema.productVariants)
        .set({
          price,
          inventoryQty: qty,
          lowStockThreshold,
          title: size,
          options: [{ name: "Size", value: size }],
        })
        .where(eq(schema.productVariants.id, match.id));
    } else {
      await db.insert(schema.productVariants).values({
        productId,
        title: size,
        price,
        inventoryQty: qty,
        lowStockThreshold,
        options: [{ name: "Size", value: size }],
      });
    }
  }

  const stale = existing.filter(
    (v) =>
      !STANDARD_SIZES.some(
        (s) => v.options?.some((o) => o.name === "Size" && o.value === s) || v.title === s
      )
  );
  for (const v of stale) {
    await db.delete(schema.productVariants).where(eq(schema.productVariants.id, v.id));
  }
}

export async function createProductDb(input: {
  title: string;
  handle: string;
  description?: string;
  fabric?: string;
  price: string;
  inventoryQty?: number;
  sizeStock?: Partial<Record<StandardSizeKey, number>>;
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

  const defaultQty = input.inventoryQty ?? 5;
  const sizeStock =
    input.sizeStock ??
    (Object.fromEntries(STANDARD_SIZES.map((s) => [s, s === "M" ? defaultQty : 0])) as Record<
      StandardSizeKey,
      number
    >);

  await upsertSizeVariants(db, product.id, input.price, sizeStock);

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
    sizeStock: Partial<Record<StandardSizeKey, number>>;
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

  if (input.price !== undefined || input.inventoryQty !== undefined || input.sizeStock !== undefined) {
    const variants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, id));
    const price = input.price ?? variants[0]?.price ?? "0";

    if (input.sizeStock) {
      await upsertSizeVariants(db, id, price, input.sizeStock);
    } else if (input.inventoryQty !== undefined) {
      const sizeStock = Object.fromEntries(
        STANDARD_SIZES.map((s) => [s, s === "M" ? input.inventoryQty! : 0])
      ) as Record<StandardSizeKey, number>;
      await upsertSizeVariants(db, id, price, sizeStock);
    } else if (input.price !== undefined) {
      await db
        .update(schema.productVariants)
        .set({ price: input.price })
        .where(eq(schema.productVariants.productId, id));
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

export type StockOverviewRow = {
  id: string;
  title: string;
  handle: string;
  featuredImageUrl?: string;
  sizeStock: Record<StandardSizeKey, number>;
  totalStock: number;
  lowStock: boolean;
  variants: { id: string; size: StandardSizeKey; inventoryQty: number; lowStockThreshold?: number }[];
};

export async function listStockOverviewDb(): Promise<StockOverviewRow[]> {
  const db = getDb();
  if (!db) return [];

  const products = await db.select().from(schema.products).orderBy(asc(schema.products.title));
  if (!products.length) return [];

  const productIds = products.map((p) => p.id);
  const variants = await db
    .select()
    .from(schema.productVariants)
    .where(inArray(schema.productVariants.productId, productIds));

  return products.map((p) => {
    const pVariants = variants.filter((v) => v.productId === p.id);
    const sizeStock = Object.fromEntries(STANDARD_SIZES.map((s) => [s, 0])) as Record<StandardSizeKey, number>;
    const variantRows: StockOverviewRow["variants"] = [];

    for (const v of pVariants) {
      const sizeOpt = v.options?.find((o) => o.name === "Size");
      const size = (sizeOpt?.value ?? v.title) as StandardSizeKey;
      if (STANDARD_SIZES.includes(size)) {
        sizeStock[size] = v.inventoryQty;
        const threshold = v.lowStockThreshold ?? 2;
        variantRows.push({
          id: v.id,
          size,
          inventoryQty: v.inventoryQty,
          lowStockThreshold: threshold,
        });
      }
    }

    const totalStock = Object.values(sizeStock).reduce((a, b) => a + b, 0);
    const lowStock = variantRows.some(
      (v) => v.inventoryQty > 0 && v.inventoryQty <= (v.lowStockThreshold ?? 2)
    );

    return {
      id: p.id,
      title: p.title,
      handle: p.handle,
      featuredImageUrl: p.featuredImageUrl ?? undefined,
      sizeStock,
      totalStock,
      lowStock,
      variants: variantRows,
    };
  });
}

export async function listStockMovementsDb(productId: string, limit = 50) {
  const db = getDb();
  if (!db || !isUuid(productId)) return [];

  return db
    .select()
    .from(schema.stockMovements)
    .where(eq(schema.stockMovements.productId, productId))
    .orderBy(desc(schema.stockMovements.createdAt))
    .limit(limit);
}
