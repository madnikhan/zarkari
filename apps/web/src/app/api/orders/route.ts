import { NextResponse } from "next/server";
import { createBridalOrder, sendToSupplier } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const order = createBridalOrder({
    customer: {
      name: body.customerName,
      phone: body.customerPhone.replace(/\s/g, ""),
      email: body.customerEmail,
    },
    supplierId: body.supplierId,
    dressType: body.dressType,
    colour: body.colour,
    size: body.size,
    totalPrice: body.totalPrice,
    customisationNotes: body.customisationNotes,
    createdById: session.id,
    createdByName: session.name,
  });

  if (body.sendToSupplier && body.supplierId) {
    sendToSupplier(order.id, session.name);
  }

  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
}
