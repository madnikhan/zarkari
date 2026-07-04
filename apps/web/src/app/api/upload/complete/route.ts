import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createMediaDb } from "@/lib/db/media";
import { isR2Configured } from "@/lib/r2";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fileName = String(body.fileName ?? "upload.bin");
  const contentType = String(body.contentType ?? "application/octet-stream");
  const category = String(body.category ?? "general");
  const publicUrl = String(body.publicUrl ?? "");

  if (!publicUrl) {
    return NextResponse.json({ error: "publicUrl required" }, { status: 400 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ url: publicUrl, fileName, category, demo: true });
  }

  const asset = await createMediaDb({
    fileName,
    url: publicUrl,
    mimeType: contentType,
    category,
    uploadedByUserId: session.id,
  });

  return NextResponse.json({ url: publicUrl, fileName, category, asset });
}
