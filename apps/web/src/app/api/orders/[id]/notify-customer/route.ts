import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBridalOrderById, getCustomer } from "@/lib/data";
import { sendOrderTrackingWhatsApp } from "@/lib/customer-notifications";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = await getCustomer(order.customerId);
  if (!customer?.phone) {
    return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 });
  }

  const result = await sendOrderTrackingWhatsApp(customer.phone, customer.name, order.orderNumber);
  return NextResponse.json(result);
}
