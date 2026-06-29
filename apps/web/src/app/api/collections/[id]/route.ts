import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateCollectionDb, deleteCollectionDb } from "@/lib/db/cms-collections";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const collection = await updateCollectionDb(id, body);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath("/collections/" + collection.handle);
  revalidatePath("/");
  return NextResponse.json({ collection });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { id } = await params;
  await deleteCollectionDb(id);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
