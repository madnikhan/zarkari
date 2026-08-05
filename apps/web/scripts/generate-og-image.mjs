#!/usr/bin/env node
/**
 * Regenerate public brand images from live ImageResponse routes.
 * Run with dev server up: npm run og:generate --workspace=web
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base =
  process.env.OG_SOURCE_URL?.trim()?.replace(/\/opengraph-image\/?$/, "") ||
  `http://127.0.0.1:${process.env.PORT || 3000}`;

const jobs = [
  { path: "/opengraph-image", out: join(root, "public/og-image.png") },
  { path: "/brand/logo-square", out: join(root, "public/brand/logo-square.png") },
  { path: "/brand/logo-square?v=light", out: join(root, "public/brand/logo-square-light.png") },
  { path: "/brand/social-banner", out: join(root, "public/brand/social-banner.png") },
  {
    path: "/brand/social-banner?v=light",
    out: join(root, "public/brand/social-banner-light.png"),
  },
  { path: "/brand/logo-square?lang=ur", out: join(root, "public/brand/logo-square-ur.png") },
  {
    path: "/brand/logo-square?lang=ur&v=light",
    out: join(root, "public/brand/logo-square-ur-light.png"),
  },
  {
    path: "/brand/social-banner?lang=ur",
    out: join(root, "public/brand/social-banner-ur.png"),
  },
  {
    path: "/brand/social-banner?lang=ur&v=light",
    out: join(root, "public/brand/social-banner-ur-light.png"),
  },
];

mkdirSync(join(root, "public/brand"), { recursive: true });

for (const job of jobs) {
  const source = `${base}${job.path}`;
  const res = await fetch(source);
  if (!res.ok) {
    console.error(`Failed to fetch ${source}: HTTP ${res.status}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(job.out, buf);
  console.log(`Wrote ${job.out} (${buf.length} bytes) from ${source}`);
}
