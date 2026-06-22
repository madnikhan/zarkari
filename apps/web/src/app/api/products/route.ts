import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createProduct, updateProduct } from "@/lib/data/products";
import { getProductById } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await request.json();
  const product = createProduct({
    title: body.title,
    handle: body.handle ?? body.title.toLowerCase().replace(/\s+/g, "-"),
    description: body.description ?? "",
    fabric: body.fabric,
    price: body.price ?? "0",
    collectionHandles: body.collectionHandles ?? [],
    featuredImageUrl: body.featuredImageUrl,
  });

  return NextResponse.json({ product });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await request.json();
  const product = updateProduct(body.id, body);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}
