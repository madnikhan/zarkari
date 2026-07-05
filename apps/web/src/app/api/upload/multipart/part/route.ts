import { NextResponse } from "next/server";
import { uploadMultipartPart } from "@/lib/r2-multipart";
import { isR2Configured } from "@/lib/r2";
import { requireUploadSession } from "@/lib/upload/upload-auth";

const MAX_PART_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await requireUploadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const uploadId = String(form.get("uploadId") ?? "");
  const key = String(form.get("key") ?? "");
  const partNumber = Number(form.get("partNumber") ?? 0);
  const chunk = form.get("file");

  if (!uploadId || !key || !partNumber || partNumber < 1) {
    return NextResponse.json({ error: "uploadId, key, and partNumber required" }, { status: 400 });
  }

  if (!(chunk instanceof File)) {
    return NextResponse.json({ error: "No chunk provided" }, { status: 400 });
  }

  if (chunk.size > MAX_PART_BYTES) {
    return NextResponse.json({ error: "Chunk too large (max 4 MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await chunk.arrayBuffer());
  const etag = await uploadMultipartPart(key, uploadId, partNumber, buffer);

  return NextResponse.json({ etag, partNumber });
}
