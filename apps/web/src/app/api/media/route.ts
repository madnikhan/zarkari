import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listMediaCategoriesDb, listMediaDb } from "@/lib/db/media";
import type { MediaKind } from "@/lib/upload/mime";

function parseMediaType(value: string | null): MediaKind | undefined {
  if (value === "image" || value === "video" || value === "audio") return value;
  return undefined;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim() || undefined;
  const type = parseMediaType(searchParams.get("type"));
  const includeCategories = searchParams.get("includeCategories") === "1";

  const assets = await listMediaDb({ limit: 200, category, type });
  const categories = includeCategories ? await listMediaCategoriesDb() : undefined;

  return NextResponse.json({ assets, categories });
}
