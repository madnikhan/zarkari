import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isUuid } from "@/lib/db";
import { getProductByIdDb } from "@/lib/db/cms-products";
import { StockError, transferStock } from "@/lib/stock/service";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";
import { getSizeFromVariant } from "@/lib/stock/sizes";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, size, quantity, direction, notes } = body as {
    productId?: string;
    size?: StandardSizeKey;
    quantity?: number;
    direction?: "to_storefront" | "to_internal";
    notes?: string;
  };

  if (!productId || !size || !quantity || !direction) {
    return NextResponse.json(
      { error: "productId, size, quantity, and direction required" },
      { status: 400 }
    );
  }

  if (!STANDARD_SIZES.includes(size)) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  if (direction !== "to_storefront" && direction !== "to_internal") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const product = await getProductByIdDb(productId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const variant = product.variants.find((v) => getSizeFromVariant(v) === size);
  if (!variant) return NextResponse.json({ error: "Size variant not found" }, { status: 404 });

  try {
    const result = await transferStock({
      variantId: variant.id,
      productId,
      quantity: Math.abs(quantity),
      direction,
      notes,
      createdByUserId: isUuid(session.id) ? session.id : undefined,
    });
    if (!result) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof StockError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to transfer stock";
    console.error("[stock/transfer POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
