import { NextResponse } from "next/server";
import { createBridalOrder, sendToSupplier } from "@/lib/data/actions";
import { getSession } from "@/lib/auth/session";
import { sendOrderTrackingWhatsApp } from "@/lib/customer-notifications";

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
    const total = parseFloat(String(body.totalPrice));
    const deposit = body.depositPaid != null ? parseFloat(String(body.depositPaid)) : total * 0.5;
    if (deposit < 0 || deposit > total) {
      return NextResponse.json({ error: "Deposit must be between 0 and total price" }, { status: 400 });
    }

    const order = await createBridalOrder({
      customer: {
        name: body.customerName.trim(),
        phone: String(body.customerPhone).replace(/\s/g, ""),
      },
      supplierId: body.supplierId || undefined,
      dressType: body.dressType,
      totalPrice: String(body.totalPrice),
      depositPaid: deposit.toFixed(2),
      deliveryDate: body.deliveryDate
        ? new Date(body.deliveryDate).toISOString()
        : undefined,
      customisationNotes: body.customisationNotes,
      mediaFiles: body.mediaFiles,
      createdById: session.id,
      createdByName: session.name,
    });

    if (body.sendToSupplier && body.supplierId) {
      await sendToSupplier(order.id, session.name);
    }

    let whatsApp: { sent: boolean; skipped?: boolean; error?: string } | undefined;
    if (body.notifyCustomerWhatsApp !== false) {
      whatsApp = await sendOrderTrackingWhatsApp(
        String(body.customerPhone).replace(/\s/g, ""),
        body.customerName.trim(),
        order.orderNumber
      );
    }

    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber, whatsApp });
  } catch (err) {
    console.error("Create order failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
