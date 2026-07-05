import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { transcodeVoiceToMp4, voiceNeedsTranscode } from "@/lib/audio/transcode-voice";
import { createMediaDb } from "@/lib/db/media";
import { isR2Configured, r2ObjectKey, r2PublicUrl, uploadToR2 } from "@/lib/r2";

/** Vercel serverless request body limit is ~4.5 MB */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function isAudioMime(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

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

    let fileName = file.name || "upload.jpg";
    let mimeType = file.type || "application/octet-stream";

    if (!isR2Configured()) {
      if (isAudioMime(mimeType)) {
        return NextResponse.json({
          demo: true,
          keepLocal: true,
          fileName,
          category,
          mimeType,
        });
      }
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

    let uploadBuffer: Buffer = Buffer.from(await file.arrayBuffer());

    if (isAudioMime(mimeType) && voiceNeedsTranscode(mimeType)) {
      const ext = fileName.split(".").pop() ?? "webm";
      const mp4 = await transcodeVoiceToMp4(uploadBuffer, ext);
      if (mp4) {
        uploadBuffer = mp4;
        mimeType = "audio/mp4";
        fileName = fileName.replace(/\.(webm|ogg|opus)$/i, ".m4a");
        if (!/\.m4a$/i.test(fileName)) fileName = `${fileName.replace(/\.[^.]+$/, "")}.m4a`;
      }
    }

    const key = r2ObjectKey(category, fileName);
    const publicUrl = r2PublicUrl(key);
    await uploadToR2(key, uploadBuffer, mimeType);

    const asset = await createMediaDb({
      fileName,
      url: publicUrl,
      mimeType,
      category,
      uploadedByUserId: session.id,
    });

    return NextResponse.json({ url: publicUrl, key, fileName, category, mimeType, asset });
  }

  const body = await request.json();
  const { fileName, contentType: mimeType, category } = body as {
    fileName?: string;
    contentType?: string;
    category?: string;
  };
  const cat = category ?? "general";
  const name = fileName ?? "upload.jpg";
  const mime = mimeType ?? "application/octet-stream";

  if (!isR2Configured()) {
    if (isAudioMime(mime)) {
      return NextResponse.json({ demo: true, keepLocal: true, fileName: name, category: cat, mimeType: mime });
    }
    const url = body.url ?? "/catalog/guldaan/1.png";
    const asset = await createMediaDb({
      fileName: name,
      url,
      mimeType: mime,
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
