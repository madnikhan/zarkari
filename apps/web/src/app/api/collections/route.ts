import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { listCollectionsDb, createCollectionDb } from "@/lib/db/cms-collections";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collections = await listCollectionsDb();
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const body = await request.json();
  const collection = await createCollectionDb({
    handle: body.handle,
    title: body.title,
    description: body.description,
    imageUrl: body.imageUrl,
    sortOrder: body.sortOrder,
  });
  if (!collection) return NextResponse.json({ error: "Failed to create" }, { status: 500 });

  revalidatePath("/collections/" + collection.handle);
  return NextResponse.json({ collection });
}
