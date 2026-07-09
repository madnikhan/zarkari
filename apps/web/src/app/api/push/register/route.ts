import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { upsertDeviceTokenDb, deleteDeviceTokenDb } from "@/lib/db/device-tokens";

const CUSTOMER_ORDER_COOKIE = "zarkari-customer-order";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fcmToken = typeof body.fcmToken === "string" ? body.fcmToken.trim() : "";
  if (!fcmToken) return NextResponse.json({ error: "fcmToken required" }, { status: 400 });

  const session = await getSession();
  const cookieStore = await cookies();
  const customerOrderId = cookieStore.get(CUSTOMER_ORDER_COOKIE)?.value;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  if (session) {
    const role = session.role === "supplier" ? "supplier" : "admin";
    await upsertDeviceTokenDb({
      fcmToken,
      role,
      userId: session.id,
      userAgent,
    });
    return NextResponse.json({ ok: true, role });
  }

  if (customerOrderId) {
    await upsertDeviceTokenDb({
      fcmToken,
      role: "customer",
      orderId: customerOrderId,
      userAgent,
    });
    return NextResponse.json({ ok: true, role: "customer" });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fcmToken = typeof body.fcmToken === "string" ? body.fcmToken.trim() : "";
  if (!fcmToken) return NextResponse.json({ error: "fcmToken required" }, { status: 400 });
  await deleteDeviceTokenDb(fcmToken);
  return NextResponse.json({ ok: true });
}
