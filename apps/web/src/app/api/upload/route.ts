import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createMediaDb } from "@/lib/db/media";
import { isR2Configured, r2ObjectKey, r2PublicUrl, uploadToR2 } from "@/lib/r2";

/** Vercel serverless request body limit is ~4.5 MB */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  if (isMultipart) {
    const form = await request.formData();
    const file = form.get("file");
    const category = String(form.get("category") ?? "general");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large for server upload (max 4 MB). Compress the image or contact support." },
        { status: 413 }
      );
    }

    const fileName = file.name || "upload.jpg";
    const mimeType = file.type || "application/octet-stream";

    if (!isR2Configured()) {
      const url = "/catalog/guldaan/1.png";
      const asset = await createMediaDb({
        fileName,
        url,
        mimeType,
        category,
        uploadedByUserId: session.id,
      });
      return NextResponse.json({ demo: true, url, fileName, category, asset });
    }

    const key = r2ObjectKey(category, fileName);
    const publicUrl = r2PublicUrl(key);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, mimeType);

    const asset = await createMediaDb({
      fileName,
      url: publicUrl,
      mimeType,
      category,
      uploadedByUserId: session.id,
    });

    return NextResponse.json({ url: publicUrl, key, fileName, category, asset });
  }

  // Legacy JSON body (demo / compatibility)
  const body = await request.json();
  const { fileName, contentType: mimeType, category } = body as {
    fileName?: string;
    contentType?: string;
    category?: string;
  };
  const cat = category ?? "general";
  const name = fileName ?? "upload.jpg";

  if (!isR2Configured()) {
    const url = body.url ?? "/catalog/guldaan/1.png";
    const asset = await createMediaDb({
      fileName: name,
      url,
      mimeType,
      category: cat,
      uploadedByUserId: session.id,
    });
    return NextResponse.json({ demo: true, url, fileName: name, category: cat, asset });
  }

  return NextResponse.json(
    { error: "Use multipart/form-data upload (file + category fields)" },
    { status: 400 }
  );
}
