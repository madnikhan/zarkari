import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Bucket(): string {
  return process.env.R2_BUCKET!;
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      !process.env.R2_ACCESS_KEY_ID.includes("placeholder")
  );
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function createR2PresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn: 3600 });
}

export function r2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}

export function r2ObjectKey(category: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `uploads/${category}/${Date.now()}-${safeName}`;
}
