import { NextResponse } from "next/server";
import { getBridalOrders } from "@/lib/data";
import { getCountdown } from "@/lib/orders/status-machine";
import { demoNotifications } from "@/lib/data/seed";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getBridalOrders();
  const active = orders.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));
  let alerts = 0;

  for (const order of active) {
    const { tone } = getCountdown(order.deliveryDate);
    if (tone === "red" || tone === "overdue") {
      demoNotifications.unshift({
        id: `cron-${Date.now()}-${order.id}`,
        orderId: order.id,
        title: tone === "overdue" ? "Overdue order" : "Deadline approaching",
        body: `${order.orderNumber} — ${getCountdown(order.deliveryDate).label}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      alerts++;
    }
  }

  return NextResponse.json({ ok: true, alertsCreated: alerts, checked: active.length });
}
