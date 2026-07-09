import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function getDb() {
  if (!isDbConfigured()) return null;
  if (!db) {
    const url = process.env.DATABASE_URL!;
    const usePooler = url.includes("-pooler") || url.includes("pooler");
    client = postgres(url, {
      max: process.env.VERCEL ? 1 : 3,
      prepare: !usePooler,
    });
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
