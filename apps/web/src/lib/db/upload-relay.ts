import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { uploadMultipartPart } from "@/lib/r2-multipart";
import { R2_MIN_PART_BYTES } from "@/lib/upload/constants";
import type { UploadRelayPart } from "@zarkari/db";

const memorySessions = new Map<
  string,
  {
    objectKey: string;
    nextPartNumber: number;
    buffer: Buffer;
    completedParts: UploadRelayPart[];
  }
>();

function getMemorySession(uploadId: string, objectKey: string) {
  let session = memorySessions.get(uploadId);
  if (!session) {
    session = { objectKey, nextPartNumber: 1, buffer: Buffer.alloc(0), completedParts: [] };
    memorySessions.set(uploadId, session);
  }
  return session;
}

async function flushPartsFromBuffer(
  uploadId: string,
  objectKey: string,
  buffer: Buffer,
  nextPartNumber: number,
  completedParts: UploadRelayPart[],
  allowSmallPart: boolean
): Promise<{ buffer: Buffer; nextPartNumber: number; completedParts: UploadRelayPart[] }> {
  let remaining = buffer;
  let partNum = nextPartNumber;
  const parts = [...completedParts];

  while (remaining.length >= R2_MIN_PART_BYTES) {
    const chunk = remaining.subarray(0, R2_MIN_PART_BYTES);
    remaining = remaining.subarray(R2_MIN_PART_BYTES);
    const etag = await uploadMultipartPart(objectKey, uploadId, partNum, chunk);
    parts.push({ partNumber: partNum, etag: etag.replace(/"/g, "") });
    partNum++;
  }

  if (allowSmallPart && remaining.length > 0) {
    const etag = await uploadMultipartPart(objectKey, uploadId, partNum, remaining);
    parts.push({ partNumber: partNum, etag: etag.replace(/"/g, "") });
    remaining = Buffer.alloc(0);
    partNum++;
  }

  return { buffer: remaining, nextPartNumber: partNum, completedParts: parts };
}

export async function appendUploadRelayChunk(
  uploadId: string,
  objectKey: string,
  chunk: Buffer
): Promise<{ bytesBuffered: number; partsFlushed: number }> {
  const db = getDb();
  if (!db) {
    const session = getMemorySession(uploadId, objectKey);
    session.buffer = Buffer.concat([session.buffer, chunk]);
    const priorCount = session.completedParts.length;
    const flushed = await flushPartsFromBuffer(
      uploadId,
      objectKey,
      session.buffer,
      session.nextPartNumber,
      session.completedParts,
      false
    );
    session.buffer = flushed.buffer;
    session.nextPartNumber = flushed.nextPartNumber;
    session.completedParts = flushed.completedParts;
    return {
      bytesBuffered: session.buffer.length,
      partsFlushed: flushed.completedParts.length - priorCount,
    };
  }

  const [existing] = await db
    .select()
    .from(schema.uploadRelaySessions)
    .where(eq(schema.uploadRelaySessions.uploadId, uploadId))
    .limit(1);

  const priorBuffer = existing?.bufferBase64
    ? Buffer.from(existing.bufferBase64, "base64")
    : Buffer.alloc(0);
  const combined = Buffer.concat([priorBuffer, chunk]);
  const nextPartNumber = existing?.nextPartNumber ?? 1;
  const completedParts = (existing?.completedParts ?? []) as UploadRelayPart[];

  const flushed = await flushPartsFromBuffer(
    uploadId,
    objectKey,
    combined,
    nextPartNumber,
    completedParts,
    false
  );

  const row = {
    uploadId,
    objectKey,
    nextPartNumber: flushed.nextPartNumber,
    bufferBase64: flushed.buffer.toString("base64"),
    completedParts: flushed.completedParts,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(schema.uploadRelaySessions)
      .set(row)
      .where(eq(schema.uploadRelaySessions.uploadId, uploadId));
  } else {
    await db.insert(schema.uploadRelaySessions).values(row);
  }

  return {
    bytesBuffered: flushed.buffer.length,
    partsFlushed: flushed.completedParts.length - completedParts.length,
  };
}

export async function flushUploadRelaySession(
  uploadId: string,
  objectKey: string
): Promise<UploadRelayPart[]> {
  const db = getDb();
  if (!db) {
    const session = memorySessions.get(uploadId);
    if (!session) return [];
    const flushed = await flushPartsFromBuffer(
      uploadId,
      objectKey,
      session.buffer,
      session.nextPartNumber,
      session.completedParts,
      true
    );
    memorySessions.delete(uploadId);
    return flushed.completedParts;
  }

  const [existing] = await db
    .select()
    .from(schema.uploadRelaySessions)
    .where(eq(schema.uploadRelaySessions.uploadId, uploadId))
    .limit(1);

  const buffer = existing?.bufferBase64
    ? Buffer.from(existing.bufferBase64, "base64")
    : Buffer.alloc(0);
  const nextPartNumber = existing?.nextPartNumber ?? 1;
  const completedParts = (existing?.completedParts ?? []) as UploadRelayPart[];

  const flushed = await flushPartsFromBuffer(
    uploadId,
    objectKey,
    buffer,
    nextPartNumber,
    completedParts,
    true
  );

  await db.delete(schema.uploadRelaySessions).where(eq(schema.uploadRelaySessions.uploadId, uploadId));
  return flushed.completedParts;
}

export async function deleteUploadRelaySession(uploadId: string): Promise<void> {
  memorySessions.delete(uploadId);
  const db = getDb();
  if (db) {
    await db.delete(schema.uploadRelaySessions).where(eq(schema.uploadRelaySessions.uploadId, uploadId));
  }
}
