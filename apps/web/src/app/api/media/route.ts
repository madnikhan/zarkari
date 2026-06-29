import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listMediaDb, createMediaDb } from "@/lib/db/media";

export async function GET() {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const assets = await listMediaDb(200);
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const asset = await createMediaDb({
    fileName: body.fileName,
    url: body.url,
    mimeType: body.mimeType,
    category: body.category,
    uploadedByUserId: session.id,
  });
  if (!asset) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  return NextResponse.json({ asset });
}
