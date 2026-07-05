import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteMediaDb, getMediaDb } from "@/lib/db/media";
import { deleteFromR2, isR2Configured, r2KeyFromPublicUrl } from "@/lib/r2";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const asset = await getMediaDb(id);
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteMediaDb(id);
  if (!deleted) {
    return NextResponse.json({ error: "Could not delete asset" }, { status: 503 });
  }

  if (isR2Configured()) {
    const key = r2KeyFromPublicUrl(asset.url);
    if (key) {
      try {
        await deleteFromR2(key);
      } catch (err) {
        console.warn("R2 delete failed (DB row removed):", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
