import { NextResponse } from "next/server";
import { createBridalOrder, sendToSupplier } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.customerName?.trim()) {
    return NextResponse.json({ error: "Customer name required" }, { status: 400 });
  }
  if (!body.customerPhone?.trim()) {
    return NextResponse.json({ error: "Customer phone required" }, { status: 400 });
  }
  if (!body.totalPrice) {
    return NextResponse.json({ error: "Total price required" }, { status: 400 });
  }

  try {
    const order = await createBridalOrder({
      customer: {
        name: body.customerName.trim(),
        phone: String(body.customerPhone).replace(/\s/g, ""),
        email: body.customerEmail?.trim(),
      },
      supplierId: body.supplierId || undefined,
      dressType: body.dressType,
      colour: body.colour,
      size: body.size,
      totalPrice: String(body.totalPrice),
      customisationNotes: body.customisationNotes,
      createdById: session.id,
      createdByName: session.name,
    });

    if (body.sendToSupplier && body.supplierId) {
      await sendToSupplier(order.id, session.name);
    }

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
  } catch (err) {
    console.error("Create order failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
