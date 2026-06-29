import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { PutObjectCommand, S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function findEnvFile(): string {
  const candidates = [
    resolve(rootDir, "apps/web/.env.local"),
    resolve(process.cwd(), "apps/web/.env.local"),
    resolve(process.cwd(), ".env.local"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return candidates[0];
}

function loadEnvFile(path: string) {
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const envPath = findEnvFile();
loadEnvFile(envPath);

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.R2_BUCKET?.trim();
const publicUrl = process.env.R2_PUBLIC_URL?.trim();

type Check = { status: "ok" | "fail" | "warn"; name: string; detail: string };
const checks: Check[] = [];
const ok = (name: string, detail: string) => checks.push({ status: "ok", name, detail });
const fail = (name: string, detail: string) => checks.push({ status: "fail", name, detail });
const warn = (name: string, detail: string) => checks.push({ status: "warn", name, detail });

async function main() {
  if (!accountId || !accessKey || !secretKey || !bucket) {
    fail("env", `Set R2_* vars in ${envPath} (account=${!!accountId}, key=${!!accessKey}, secret=${!!secretKey}, bucket=${!!bucket})`);
    print();
    process.exit(1);
  }

  if (publicUrl?.includes(".r2.cloudflarestorage.com")) {
    warn(
      "R2_PUBLIC_URL",
      "You set the S3 API endpoint. Public files need https://pub-xxxx.r2.dev or a custom domain (e.g. files.zarkari.co.uk)."
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    ok("bucket", `Bucket "${bucket}" is reachable with your API token`);
  } catch (e) {
    fail("bucket", e instanceof Error ? e.message : String(e));
    print();
    process.exit(1);
  }

  const testKey = `uploads/test/r2-smoke-${Date.now()}.txt`;
  const testBody = `zarkari-r2-smoke-test ${new Date().toISOString()}`;
  const contentType = "text/plain";

  try {
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: testKey, ContentType: contentType }),
      { expiresIn: 300 }
    );
    ok("presign", "Presigned upload URL created (same flow as /api/upload)");

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: testBody,
    });
    if (putRes.ok) ok("upload", `Direct PUT to R2 succeeded (${putRes.status})`);
    else fail("upload", `PUT failed: HTTP ${putRes.status}`);
  } catch (e) {
    fail("upload", e instanceof Error ? e.message : String(e));
  }

  if (publicUrl) {
    const fileUrl = `${publicUrl.replace(/\/$/, "")}/${testKey}`;
    try {
      const getRes = await fetch(fileUrl);
      if (getRes.ok && (await getRes.text()) === testBody) {
        ok("public", "Uploaded file is readable at R2_PUBLIC_URL");
      } else {
        fail("public", `GET ${getRes.status} — fix R2_PUBLIC_URL or enable public access on the bucket`);
      }
    } catch (e) {
      fail("public", e instanceof Error ? e.message : String(e));
    }
  } else {
    warn("public", "R2_PUBLIC_URL not set — skipped public read test");
  }

  print();
  process.exit(checks.some((c) => c.status === "fail") ? 1 : 0);
}

function print() {
  for (const c of checks) {
    const icon = c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✗";
    console.log(`${icon} ${c.name}: ${c.detail}`);
  }
}

main();
