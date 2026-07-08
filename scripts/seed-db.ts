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

const CARGO_COMPANIES = ["DHL Cargo", "FedEx", "UPS", "Leopards Cargo"];

async function seedCargo(db: ReturnType<typeof drizzle<typeof schema>>, supplierId: string) {
  const existing = await db.select().from(schema.cargoCompanies).limit(1);
  if (existing.length) {
    console.log("Cargo data already seeded — skipping.");
    return;
  }

  const companyIds: string[] = [];
  for (const name of CARGO_COMPANIES) {
    const [row] = await db.insert(schema.cargoCompanies).values({ name }).returning();
    companyIds.push(row.id);
  }
  console.log(`Seeded ${CARGO_COMPANIES.length} cargo companies.`);

  const orders = await db.select().from(schema.bridalOrders).limit(3);
  const year = new Date().getFullYear();

  const boxes = [
    {
      boxNumber: `BOX-${year}-0001`,
      cargoCompanyId: companyIds[0],
      trackingNumber: "DHL1234567890",
      receivedDate: "2026-06-15",
      weightKg: "12.50",
      notes: "Karachi shipment — bridal lehengas",
    },
    {
      boxNumber: `BOX-${year}-0002`,
      cargoCompanyId: companyIds[3],
      trackingNumber: "LCP9876543210",
      receivedDate: "2026-06-20",
      weightKg: "8.25",
      notes: "Accessories and fabric samples",
    },
  ];

  for (let i = 0; i < boxes.length; i++) {
    const spec = boxes[i];
    const [box] = await db
      .insert(schema.cargoBoxes)
      .values({
        ...spec,
        supplierId,
        exchangeRate: "355.50",
      })
      .returning();

    const items = [
      {
        itemDate: spec.receivedDate,
        articleName: i === 0 ? "Bridal Lehenga — Red" : "Embroidered Dupatta",
        bridalOrderId: orders[i]?.id ?? null,
        costPkr: i === 0 ? "85000" : "12000",
        costGbp: i === 0 ? "239.10" : "33.75",
        exchangeRate: "355.50",
        sortOrder: 0,
      },
      {
        itemDate: spec.receivedDate,
        articleName: i === 0 ? "Matching Blouse" : "Fabric swatches",
        bridalOrderId: orders[i + 1]?.id ?? null,
        costPkr: i === 0 ? "22000" : "5000",
        costGbp: i === 0 ? "61.88" : "14.06",
        exchangeRate: "355.50",
        sortOrder: 1,
      },
    ];

    for (const item of items) {
      await db.insert(schema.cargoBoxItems).values({ boxId: box.id, ...item });
    }
    console.log(`Seeded cargo box: ${spec.boxNumber}`);
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
  await seedCargo(db, supplierId);

  console.log("Done. Run `npm run db:push` first if tables are missing.");
  await client.end();
}

main().catch(console.error);
