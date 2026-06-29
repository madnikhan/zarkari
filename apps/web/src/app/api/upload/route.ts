import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createMediaDb } from "@/lib/db/media";
import { createR2PresignedUploadUrl, isR2Configured, r2PublicUrl } from "@/lib/r2";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fileName, contentType, category } = body as { fileName?: string; contentType?: string; category?: string };

  const key = `uploads/${category ?? "general"}/${Date.now()}-${fileName ?? "file"}`;

  if (!isR2Configured()) {
    const url = body.url ?? "/catalog/guldaan/1.png";
    const asset = await createMediaDb({
      fileName: fileName ?? "upload.jpg",
      url,
      mimeType: contentType,
      category: category ?? "general",
      uploadedByUserId: session.id,
    });
    return NextResponse.json({
      demo: true,
      url,
      fileName: fileName ?? "upload.jpg",
      category: category ?? "general",
      asset,
    });
  }

  const publicUrl = r2PublicUrl(key);
  const uploadUrl = await createR2PresignedUploadUrl(key, contentType ?? "application/octet-stream");

  const asset = await createMediaDb({
    fileName: fileName ?? "upload.jpg",
    url: publicUrl,
    mimeType: contentType,
    category: category ?? "general",
    uploadedByUserId: session.id,
  });

  return NextResponse.json({
    uploadUrl,
    url: publicUrl,
    key,
    contentType: contentType ?? "application/octet-stream",
    asset,
  });
}
