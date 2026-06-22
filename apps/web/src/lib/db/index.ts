import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@zarkari/db";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  if (!isDbConfigured()) return null;
  if (!db) {
    client = postgres(process.env.DATABASE_URL!, { max: 1 });
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
