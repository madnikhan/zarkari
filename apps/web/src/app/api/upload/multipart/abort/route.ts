import { NextResponse } from "next/server";
import { abortMultipartUpload } from "@/lib/r2-multipart";
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

    if (!uploadId || !key) {
      return NextResponse.json({ error: "uploadId and key required" }, { status: 400 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ ok: true, demo: true });
    }

    await abortMultipartUpload(key, uploadId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Multipart abort failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not abort upload" },
      { status: 500 }
    );
  }
}
