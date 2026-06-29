#!/usr/bin/env tsx
/**
 * Seed Neon PostgreSQL with demo users, catalog, and shop settings.
 * Usage: npx tsx scripts/seed-db.ts
 * Loads DATABASE_URL from .env or apps/web/.env.local
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";
import bcrypt from "bcryptjs";
import { catalogProducts, catalogCollectionImages } from "../apps/web/src/lib/data/catalog-products";

const DEMO_USERS = [
  { email: "owner@zarkari.co.uk", password: "demo123", name: "Owner", role: "owner" as const },
  { email: "staff@zarkari.co.uk", password: "demo123", name: "Staff", role: "staff" as const },
  {
    email: "supplier@zarkari.co.uk",
    password: "demo123",
    name: "Karachi Atelier",
    role: "supplier" as const,
    supplierId: null as string | null,
  },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  announcement: "Shop the ZARKARI catalogue",
  heroHeadline: "ZARKARI",
  heroSubheadline: "Designer formal wear — hand-finished pieces from our catalogue.",
};

const COLLECTIONS = [
  {
    handle: "catalogue",
    title: "Catalogue",
    description: "The full ZARKARI collection from our WhatsApp catalogue.",
    imageUrl: catalogCollectionImages.catalogue,
    sortOrder: 0,
  },
  {
    handle: "coming-soon",
    title: "Coming Soon",
    description: "Preview upcoming ZARKARI designs.",
    imageUrl: catalogCollectionImages["coming-soon"],
    sortOrder: 1,
  },
];

async function seedCatalog(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existingProducts = await db.select().from(schema.products).limit(1);
  if (existingProducts.length) {
    console.log("Catalog already seeded — skipping.");
    return;
  }

  const collectionIds = new Map<string, string>();
  for (const col of COLLECTIONS) {
    const [row] = await db
      .insert(schema.collections)
      .values({
        handle: col.handle,
        title: col.title,
        description: col.description,
        imageUrl: col.imageUrl,
        sortOrder: col.sortOrder,
      })
      .returning();
    collectionIds.set(col.handle, row.id);
    console.log(`Seeded collection: ${col.handle}`);
  }

  for (const product of catalogProducts) {
    const [row] = await db
      .insert(schema.products)
      .values({
        handle: product.handle,
        title: product.title,
        description: product.description,
        fabric: product.fabric ?? null,
        tags: product.tags,
        featuredImageUrl: product.featuredImageUrl ?? null,
        published: true,
      })
      .returning();

    const variant = product.variants[0];
    await db.insert(schema.productVariants).values({
      productId: row.id,
      title: variant?.title ?? "Standard",
      price: variant?.price ?? "0",
      inventoryQty: variant?.inventoryQty ?? 5,
      options: variant?.options ?? [{ name: "Title", value: "Standard" }],
    });

    for (let i = 0; i < product.images.length; i++) {
      await db.insert(schema.productImages).values({
        productId: row.id,
        url: product.images[i],
        sortOrder: i,
      });
    }

    for (const handle of product.collectionHandles) {
      const colId = collectionIds.get(handle);
      if (colId) {
        await db.insert(schema.productCollections).values({ productId: row.id, collectionId: colId });
      }
    }
  }
  console.log(`Seeded ${catalogProducts.length} products.`);
}

async function seedSettings(db: ReturnType<typeof drizzle<typeof schema>>) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.select().from(schema.shopSettings).where(eq(schema.shopSettings.key, key)).limit(1);
    if (existing.length) continue;
    await db.insert(schema.shopSettings).values({ key, value });
    console.log(`Seeded setting: ${key}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Connected to database.");

  const suppliers = await db.select().from(schema.suppliers).limit(1);
  let supplierId = suppliers[0]?.id;
  if (!supplierId) {
    const [sup] = await db
      .insert(schema.suppliers)
      .values({ name: "Karachi Atelier", email: "supplier@zarkari.co.uk" })
      .returning();
    supplierId = sup.id;
    console.log("Created default supplier.");
  }

  for (const u of DEMO_USERS) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, u.email))
      .limit(1);
    if (existing.length) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db.insert(schema.users).values({
      email: u.email,
      passwordHash,
      name: u.name,
      role: u.role,
      supplierId: u.role === "supplier" ? supplierId : null,
    });
    console.log(`Seeded user: ${u.email}`);
  }

  await seedCatalog(db);
  await seedSettings(db);

  console.log("Done. Run `npm run db:push` first if tables are missing.");
  await client.end();
}

main().catch(console.error);
