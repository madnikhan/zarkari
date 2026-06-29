import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../..");

for (const file of [".env", ".env.local", "apps/web/.env.local", "apps/web/.env"]) {
  const path = resolve(root, file);
  if (existsSync(path)) config({ path, override: false });
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env at the repo root or apps/web/.env.local, then run:\n" +
      "  DATABASE_URL=postgresql://... npm run db:push"
  );
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
