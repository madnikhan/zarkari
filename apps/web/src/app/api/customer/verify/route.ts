import { NextResponse } from "next/server";
import { getBridalOrderByNumber, getCustomer } from "@/lib/data";

export async function POST(request: Request) {
  const { orderNumber, phone } = await request.json();
  const order = await getBridalOrderByNumber(orderNumber?.trim());
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = await getCustomer(order.customerId);
  const normalizedPhone = phone?.replace(/\s/g, "");
  if (!customer || customer.phone !== normalizedPhone) {
    return NextResponse.json({ error: "Phone number does not match" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, verified: true });
  res.cookies.set("zarkari-customer-order", order.id, {
    httpOnly: true,
    path: "/",
    maxAge: 3600,
    sameSite: "lax",
  });
  return res;
}
