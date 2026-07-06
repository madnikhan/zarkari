import { NextResponse } from "next/server";
import { getPresignedPartUrl } from "@/lib/r2-multipart";
import { isR2Configured } from "@/lib/r2";
import { requireUploadSession } from "@/lib/upload/upload-auth";

export async function POST(request: Request) {
  try {
    const session = await requireUploadSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
    }

    const body = await request.json();
    const uploadId = String(body.uploadId ?? "");
    const key = String(body.key ?? "");
    const partNumber = Number(body.partNumber ?? 0);

    if (!uploadId || !key || !partNumber || partNumber < 1) {
      return NextResponse.json({ error: "uploadId, key, and partNumber required" }, { status: 400 });
    }

    const uploadUrl = await getPresignedPartUrl(key, uploadId, partNumber);
    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error("Multipart presign failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not presign upload part" },
      { status: 500 }
    );
  }
}
