import { NextResponse } from "next/server";
import { getBridalOrderByNumber, getCustomer } from "@/lib/data";
import { generateOtp } from "@/lib/otp";
import { sendCustomerOtp } from "@/lib/email";

export async function POST(request: Request) {
  const { orderNumber, phone, otp } = await request.json();
  const order = await getBridalOrderByNumber(orderNumber?.trim());
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const customer = await getCustomer(order.customerId);
  const normalizedPhone = phone?.replace(/\s/g, "");
  if (!customer || customer.phone !== normalizedPhone) {
    return NextResponse.json({ error: "Phone number does not match" }, { status: 401 });
  }

  if (otp) {
    const { verifyOtp } = await import("@/lib/otp");
    const orderId = verifyOtp(orderNumber, otp);
    if (!orderId) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    const res = NextResponse.json({ ok: true, verified: true });
    res.cookies.set("zarkari-customer-order", orderId, { httpOnly: true, path: "/", maxAge: 3600 });
    return res;
  }

  const code = generateOtp(orderNumber, order.id);
  if (customer.email) {
    await sendCustomerOtp(customer.email, code, orderNumber);
  }

  const demo = !process.env.RESEND_API_KEY?.trim() || process.env.RESEND_API_KEY.includes("placeholder");
  return NextResponse.json({
    ok: true,
    otpSent: true,
    ...(demo ? { demoOtp: code } : {}),
  });
}
