import { NextResponse } from "next/server";
import { completeMultipartUpload } from "@/lib/r2-multipart";
import { createMediaDb } from "@/lib/db/media";
import { isR2Configured } from "@/lib/r2";
import { requireUploadSession } from "@/lib/upload/upload-auth";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await requireUploadSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const uploadId = String(body.uploadId ?? "");
    const key = String(body.key ?? "");
    const fileName = String(body.fileName ?? "upload.bin");
    const contentType = String(body.contentType ?? "application/octet-stream");
    const category = String(body.category ?? "general");
    const publicUrl = String(body.publicUrl ?? "");
    const parts = (body.parts ?? []) as { partNumber?: number; etag?: string }[];

    if (!uploadId || !key || !publicUrl) {
      return NextResponse.json({ error: "uploadId, key, and publicUrl required" }, { status: 400 });
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ error: "parts required" }, { status: 400 });
    }

    const normalizedParts = parts
      .map((p) => ({ partNumber: Number(p.partNumber), etag: String(p.etag ?? "") }))
      .filter((p) => p.partNumber > 0 && p.etag);

    if (normalizedParts.length === 0) {
      return NextResponse.json({ error: "Invalid parts" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ url: publicUrl, fileName, category, demo: true });
    }

    await completeMultipartUpload(key, uploadId, normalizedParts);

    const asset = await createMediaDb({
      fileName,
      url: publicUrl,
      mimeType: contentType,
      category,
      uploadedByUserId: session.id,
    });

    return NextResponse.json({ url: publicUrl, fileName, category, mimeType: contentType, asset });
  } catch (err) {
    console.error("Multipart complete failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not finalize video upload" },
      { status: 500 }
    );
  }
}
