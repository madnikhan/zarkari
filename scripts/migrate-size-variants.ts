/**
 * Migrates single "Standard" product variants to per-size variants (S–XXL).
 * Existing inventory_qty is assigned to size M; other sizes start at 0.
 *
 * Run: npx tsx scripts/migrate-size-variants.ts
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

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "@zarkari/db";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const products = await db.select().from(schema.products);
  let migrated = 0;

  for (const product of products) {
    const variants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, product.id));

    const hasSizeVariants = variants.some((v) =>
      v.options?.some((o) => o.name === "Size" && SIZES.includes(o.value as (typeof SIZES)[number]))
    );

    if (hasSizeVariants) continue;

    if (variants.length === 0) {
      const price = "0.00";
      for (const size of SIZES) {
        await db.insert(schema.productVariants).values({
          productId: product.id,
          title: size,
          price,
          inventoryQty: 0,
          lowStockThreshold: 2,
          options: [{ name: "Size", value: size }],
        });
      }
      migrated++;
      continue;
    }

    const base = variants[0];
    const mQty = base.inventoryQty;

    await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, product.id));

    for (const size of SIZES) {
      await db.insert(schema.productVariants).values({
        productId: product.id,
        title: size,
        price: base.price,
        compareAtPrice: base.compareAtPrice,
        inventoryQty: size === "M" ? mQty : 0,
        lowStockThreshold: 2,
        sku: base.sku ? `${base.sku}-${size}` : null,
        options: [{ name: "Size", value: size }],
      });
    }
    migrated++;
    console.log(`Migrated product: ${product.title}`);
  }

  // Backfill retail order source for existing rows
  await client.unsafe(`UPDATE retail_orders SET source = 'online' WHERE source IS NULL OR source = ''`);

  console.log(`Done. Migrated ${migrated} product(s).`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
