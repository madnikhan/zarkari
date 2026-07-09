import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/config";

const CUSTOMER_ORDER_COOKIE = "zarkari-customer-order";

export async function POST() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: "Firebase not configured" }, { status: 503 });
  }

  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Firebase auth unavailable" }, { status: 503 });

  const session = await getSession();
  const cookieStore = await cookies();
  const customerOrderId = cookieStore.get(CUSTOMER_ORDER_COOKIE)?.value;

  if (session) {
    const role = session.role === "supplier" ? "supplier" : "admin";
    const token = await auth.createCustomToken(session.id, {
      role,
      userId: session.id,
      supplierId: session.supplierId ?? null,
    });
    return NextResponse.json({ token, role, userId: session.id });
  }

  if (customerOrderId) {
    const token = await auth.createCustomToken(`customer-${customerOrderId}`, {
      role: "customer",
      orderId: customerOrderId,
    });
    return NextResponse.json({ token, role: "customer", orderId: customerOrderId });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
