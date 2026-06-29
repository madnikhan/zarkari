import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";

export async function getShopSettingsDb(): Promise<Record<string, string>> {
  const db = getDb();
  if (!db) return {};
  const rows = await db.select().from(schema.shopSettings);
  const out: Record<string, string> = {};
  for (const row of rows) {
    out[row.key] = row.value;
  }
  return out;
}

export async function setShopSettingsDb(settings: Record<string, string>): Promise<void> {
  const db = getDb();
  if (!db) return;
  for (const [key, value] of Object.entries(settings)) {
    const [existing] = await db.select().from(schema.shopSettings).where(eq(schema.shopSettings.key, key)).limit(1);
    if (existing) {
      await db.update(schema.shopSettings).set({ value }).where(eq(schema.shopSettings.key, key));
    } else {
      await db.insert(schema.shopSettings).values({ key, value });
    }
  }
}

export async function countShopSettingsDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select().from(schema.shopSettings);
  return rows.length;
}
