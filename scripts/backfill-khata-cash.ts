#!/usr/bin/env tsx
/**
 * Link khata payment entries that have no cash_transaction_id to Daily Cash cash-out rows.
 * Usage: npx tsx scripts/backfill-khata-cash.ts
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

const root = resolve(__dirname, "..");
for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  const orphans = await db
    .select()
    .from(schema.supplierLedgerEntries)
    .where(
      and(
        eq(schema.supplierLedgerEntries.type, "payment"),
        isNull(schema.supplierLedgerEntries.cashTransactionId)
      )
    )
    .orderBy(schema.supplierLedgerEntries.businessDate);

  let linked = 0;
  let skipped = 0;

  for (const entry of orphans) {
    const occurredAt = new Date(`${entry.businessDate}T12:00:00`);
    const [tx] = await db
      .insert(schema.cashTransactions)
      .values({
        direction: "out",
        type: "supplier_payment",
        amount: entry.amountGbp,
        method: "cash",
        description: entry.description ?? "Supplier payment (khata backfill)",
        businessDate: entry.businessDate,
        occurredAt,
        supplierId: entry.supplierId,
        source: "manual",
      })
      .returning();

    if (!tx) {
      skipped++;
      continue;
    }

    await db
      .update(schema.supplierLedgerEntries)
      .set({ cashTransactionId: tx.id, updatedAt: new Date() })
      .where(eq(schema.supplierLedgerEntries.id, entry.id));

    linked++;
    console.log(`Linked ${entry.id} → cash transaction ${tx.id} (${entry.businessDate}, £${entry.amountGbp})`);
  }

  console.log(`Backfill complete: ${linked} linked, ${skipped} skipped.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
