#!/usr/bin/env node
/**
 * Regenerate public/og-image.png from the live opengraph-image route.
 * Run with dev server up: npm run og:generate --workspace=web
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source =
  process.env.OG_SOURCE_URL?.trim() ||
  `http://127.0.0.1:${process.env.PORT || 3000}/opengraph-image`;
const out = join(root, "public/og-image.png");

const res = await fetch(source);
if (!res.ok) {
  console.error(`Failed to fetch ${source}: HTTP ${res.status}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(out, buf);
console.log(`Wrote ${out} (${buf.length} bytes) from ${source}`);
