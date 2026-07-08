import { NextResponse } from "next/server";
import { isR2Configured } from "@/lib/r2";
import { appendUploadRelayChunk } from "@/lib/db/upload-relay";
import { requireUploadSession } from "@/lib/upload/upload-auth";
import { SERVER_RELAY_CHUNK_BYTES } from "@/lib/upload/constants";

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

    const form = await request.formData();
    const uploadId = String(form.get("uploadId") ?? "");
    const key = String(form.get("key") ?? "");
    const chunk = form.get("file");

    if (!uploadId || !key) {
      return NextResponse.json({ error: "uploadId and key required" }, { status: 400 });
    }

    if (!(chunk instanceof File)) {
      return NextResponse.json({ error: "No chunk provided" }, { status: 400 });
    }

    if (chunk.size > SERVER_RELAY_CHUNK_BYTES) {
      return NextResponse.json(
        { error: `Chunk too large (max ${Math.round(SERVER_RELAY_CHUNK_BYTES / 1024 / 1024)} MB)` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    const result = await appendUploadRelayChunk(uploadId, key, buffer);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Upload relay failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload relay failed" },
      { status: 500 }
    );
  }
}
