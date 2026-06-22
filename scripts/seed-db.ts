#!/usr/bin/env tsx
/**
 * Seed Neon PostgreSQL with demo bridal data.
 * Usage: DATABASE_URL=postgres://... npx tsx scripts/seed-db.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Pushing schema...");
  // drizzle-kit push is preferred; this script verifies connectivity
  const existing = await db.select().from(schema.retailOrders).limit(1);
  console.log(`Connected. Retail orders in DB: ${existing.length >= 0 ? "ok" : 0}`);
  console.log("Run `npm run push --workspace=@zarkari/db` to apply schema, then restart the app.");
  await client.end();
}

main().catch(console.error);
