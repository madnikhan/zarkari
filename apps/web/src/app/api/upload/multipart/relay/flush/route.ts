import { NextResponse } from "next/server";
import { isR2Configured } from "@/lib/r2";
import { flushUploadRelaySession } from "@/lib/db/upload-relay";
import { requireUploadSession } from "@/lib/upload/upload-auth";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await requireUploadSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    const body = await request.json();
    const uploadId = String(body.uploadId ?? "");
    const key = String(body.key ?? "");

    if (!uploadId || !key) {
      return NextResponse.json({ error: "uploadId and key required" }, { status: 400 });
    }

    const parts = await flushUploadRelaySession(uploadId, key);
    return NextResponse.json({ parts });
  } catch (err) {
    console.error("Upload relay flush failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload relay flush failed" },
      { status: 500 }
    );
  }
}
