import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { createProduct, deleteProduct, updateProduct } from "@/lib/data/products";
import { getProductById } from "@/lib/data";

function revalidateProduct(handle: string, collectionHandles?: string[]) {
  revalidatePath("/");
  revalidatePath(`/products/${handle}`);
  revalidatePath("/collections/catalogue");
  for (const h of collectionHandles ?? []) {
    revalidatePath(`/collections/${h}`);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await request.json();
  const product = await createProduct({
    title: body.title,
    handle: body.handle ?? body.title.toLowerCase().replace(/\s+/g, "-"),
    description: body.description ?? "",
    fabric: body.fabric,
    price: body.price ?? "0",
    collectionHandles: body.collectionHandles ?? [],
    featuredImageUrl: body.featuredImageUrl,
    images: body.images,
    inventoryQty: body.inventoryQty,
    published: body.published,
    tags: body.tags,
  });

  revalidateProduct(product.handle, product.collectionHandles);
  return NextResponse.json({ product });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await request.json();
  const existing = body.id ? await getProductById(body.id) : null;
  const product = await updateProduct(body.id, body);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateProduct(product.handle, [...(existing?.collectionHandles ?? []), ...product.collectionHandles]);
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const id =
    (typeof body.id === "string" && body.id) || searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getProductById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await deleteProduct(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidateProduct(existing.handle, existing.collectionHandles);
  revalidatePath("/admin/content/products");

  if (result.soft) {
    return NextResponse.json({
      ok: true,
      soft: true,
      product: result.product,
      message: "Product has order history and was unpublished instead of deleted",
    });
  }

  return NextResponse.json({ ok: true, soft: false });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
