import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { maxDirectUploadBytesFromEnv } from "@/lib/upload/constants";
import { createR2PresignedUploadUrl, isR2Configured, r2ObjectKey, r2PublicUrl } from "@/lib/r2";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
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
      {
        error: `File too large (max ${Math.round(maxDirectUploadBytesFromEnv() / 1024 / 1024)} MB)`,
      },
      { status: 413 }
    );
  }

  const isMedia =
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/") ||
    fileSize > 4 * 1024 * 1024;

  if (!isMedia) {
    return NextResponse.json({ error: "Direct upload is for video, audio, or large files only" }, { status: 400 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({
      uploadUrl: "/api/upload",
      publicUrl: "/catalog/guldaan/1.png",
      key: "demo",
      fileName,
      demo: true,
    });
  }

  const key = r2ObjectKey(category, fileName);
  const publicUrl = r2PublicUrl(key);
  const uploadUrl = await createR2PresignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, publicUrl, key, fileName });
}
