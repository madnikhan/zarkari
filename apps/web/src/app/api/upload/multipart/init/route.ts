import { NextResponse } from "next/server";
import { createMultipartUpload } from "@/lib/r2-multipart";
import { isR2Configured, r2ObjectKey, r2PublicUrl } from "@/lib/r2";
import { maxDirectUploadBytesFromEnv } from "@/lib/upload/constants";
import { requireUploadSession } from "@/lib/upload/upload-auth";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await requireUploadSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const fileName = String(body.fileName ?? "upload.bin");
    const contentType = String(body.contentType ?? "application/octet-stream");
    const category = String(body.category ?? "general");
    const fileSize = Number(body.fileSize ?? 0);

    if (!fileSize || fileSize <= 0) {
      return NextResponse.json({ error: "fileSize required" }, { status: 400 });
    }

    if (fileSize > maxDirectUploadBytesFromEnv()) {
      return NextResponse.json(
        { error: `File too large (max ${Math.round(maxDirectUploadBytesFromEnv() / 1024 / 1024)} MB)` },
        { status: 413 }
      );
    }

    if (!contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Multipart upload is for video files only" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ demo: true, fileName, category, mimeType: contentType });
    }

    const key = r2ObjectKey(category, fileName);
    const publicUrl = r2PublicUrl(key);
    const uploadId = await createMultipartUpload(key, contentType);

    return NextResponse.json({ uploadId, key, publicUrl, fileName, category, mimeType: contentType });
  } catch (err) {
    console.error("Multipart init failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start video upload" },
      { status: 500 }
    );
  }
}
