import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createRetailOrderDb } from "@/lib/db/retail-orders";
import { getProductByIdDb } from "@/lib/db/cms-products";
import { validateStockAvailability, deductForRetailOrder, StockError } from "@/lib/stock/service";
import { getVariantForSize } from "@/lib/stock/sizes";
import { STANDARD_SIZES, buildStandardSelection, type StandardSizeKey, type SizeSelection } from "@/lib/sizing";
import { autoPostCashTransaction } from "@/lib/db/cash-ledger";
import { isDbConfigured } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database required" }, { status: 503 });
  }

  const body = await request.json();
  const {
    customerName,
    customerPhone,
    customerEmail,
    paymentMethod,
    items,
  } = body as {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    paymentMethod?: "cash" | "card";
    items?: {
      productId: string;
      size: StandardSizeKey;
      quantity: number;
    }[];
  };

  if (!items?.length) {
    return NextResponse.json({ error: "At least one item required" }, { status: 400 });
  }

  if (!paymentMethod || !["cash", "card"].includes(paymentMethod)) {
    return NextResponse.json({ error: "paymentMethod must be cash or card" }, { status: 400 });
  }

  const orderItems: {
    title: string;
    quantity: number;
    price: string;
    variantId: string;
    productId: string;
    sizeSelection: SizeSelection;
  }[] = [];

  for (const item of items) {
    if (!STANDARD_SIZES.includes(item.size)) {
      return NextResponse.json({ error: `Invalid size: ${item.size}` }, { status: 400 });
    }
    const product = await getProductByIdDb(item.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const variant = getVariantForSize(product, item.size);
    if (!variant) {
      return NextResponse.json({ error: `No variant for size ${item.size}` }, { status: 400 });
    }
    orderItems.push({
      title: `${product.title} (${item.size})`,
      quantity: item.quantity,
      price: variant.price,
      variantId: variant.id,
      productId: product.id,
      sizeSelection: buildStandardSelection(item.size),
    });
  }

  const stockCheck = await validateStockAvailability(
    orderItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity, title: i.title }))
  );
  if (!stockCheck.ok) {
    return NextResponse.json({ error: stockCheck.error }, { status: 400 });
  }

  try {
    const order = await createRetailOrderDb({
      customerName: customerName || "Ready-made customer",
      customerPhone,
      customerEmail,
      source: "walk_in",
      paymentMethod,
      status: "paid",
      items: orderItems,
    });

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    await deductForRetailOrder(
      order.id,
      orderItems.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        quantity: i.quantity,
        title: i.title,
      })),
      session.id
    );

    await autoPostCashTransaction({
      direction: "in",
      type: "ready_made_sale",
      amount: order.total,
      method: paymentMethod === "card" ? "online" : "cash",
      reference: order.orderNumber,
      description: orderItems.map((i) => i.title).join(", "),
      retailOrderId: order.id,
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    if (err instanceof StockError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
