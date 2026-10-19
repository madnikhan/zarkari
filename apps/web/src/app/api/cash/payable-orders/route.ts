import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPayableOrders } from "@/lib/data";
import { isDbConfigured } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (q && isDbConfigured()) {
    const { getBridalOrderByNumberDb } = await import("@/lib/db/bridal-orders");
    const { getCustomer } = await import("@/lib/data");
    const order = await getBridalOrderByNumberDb(q);
    if (
      order &&
      !["cancelled", "refunded"].includes(order.status) &&
      parseFloat(order.remainingBalance) > 0
    ) {
      const customer = await getCustomer(order.customerId);
      return NextResponse.json({
        orders: [
          {
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: customer?.name ?? "",
            remainingBalance: order.remainingBalance,
            depositPaid: order.depositPaid,
            totalPrice: order.totalPrice,
          },
        ],
      });
    }
    // Also try case-insensitive list match from payable set
    const payable = await getPayableOrders();
    const matched = payable.filter(
      (o) => o.orderNumber.toLowerCase() === q.toLowerCase()
    );
    return NextResponse.json({ orders: matched });
  }

  const orders = await getPayableOrders();
  return NextResponse.json({ orders });
}
