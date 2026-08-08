import { NextResponse } from "next/server";
import { createPastBridalOrder } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { isBridalStatus } from "@/lib/orders/status-machine";

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
  if (!body.bookingDate) {
    return NextResponse.json({ error: "Booking date required" }, { status: 400 });
  }
  if (!body.deliveryDate) {
    return NextResponse.json({ error: "Delivery date required" }, { status: 400 });
  }
  if (!body.dressType?.trim()) {
    return NextResponse.json({ error: "Dress type required" }, { status: 400 });
  }
  const status = body.status ? String(body.status) : "collected";
  if (!isBridalStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const total = parseFloat(String(body.totalPrice));
    const deposit =
      body.depositPaid != null && body.depositPaid !== ""
        ? parseFloat(String(body.depositPaid))
        : total;
    if (!Number.isFinite(total) || deposit < 0 || deposit > total) {
      return NextResponse.json({ error: "Deposit must be between 0 and total price" }, { status: 400 });
    }

    const order = await createPastBridalOrder({
      customerName: body.customerName.trim(),
      customerPhone: String(body.customerPhone).replace(/\s/g, ""),
      dressType: String(body.dressType).trim(),
      totalPrice: total.toFixed(2),
      depositPaid: deposit.toFixed(2),
      remainingBalance:
        body.remainingBalance != null && body.remainingBalance !== ""
          ? String(body.remainingBalance)
          : undefined,
      bookingDate: body.bookingDate,
      deliveryDate: body.deliveryDate,
      status,
      orderNumber: body.orderNumber?.trim() || undefined,
      supplierId: body.supplierId || undefined,
      notes: body.notes?.trim() || undefined,
      createdById: session.id,
      createdByName: session.name,
    });

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create past order";
    console.error("Create past order failed:", err);
    const statusCode = /already exists|Invalid|must be/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
