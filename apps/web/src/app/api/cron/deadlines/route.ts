import { NextResponse } from "next/server";
import { getCountdown } from "@/lib/orders/status-machine";
import { isDbConfigured } from "@/lib/db";
import { demoNotifications } from "@/lib/data/seed";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orders: { id: string; orderNumber: string; deliveryDate: string; status: string }[] = [];

  if (isDbConfigured()) {
    const { listActiveBridalOrdersForDeadlinesDb } = await import("@/lib/db/bridal-orders");
    orders = await listActiveBridalOrdersForDeadlinesDb();
  } else {
    const { getBridalOrders } = await import("@/lib/data");
    const all = await getBridalOrders({ limit: 200 });
    orders = all.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));
  }

  let alerts = 0;

  for (const order of orders) {
    const { tone } = getCountdown(order.deliveryDate);
    if (tone === "red" || tone === "overdue") {
      const title = tone === "overdue" ? "Overdue order" : "Deadline approaching";
      const body = `${order.orderNumber} — ${getCountdown(order.deliveryDate).label}`;
      if (isDbConfigured()) {
        const { createNotificationDb } = await import("@/lib/db/notifications");
        await createNotificationDb({
          orderId: order.id,
          title,
          body,
          href: `/admin/orders/${order.id}`,
        });
      } else {
        demoNotifications.unshift({
          id: `cron-${Date.now()}-${order.id}`,
          orderId: order.id,
          title,
          body,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      alerts++;
    }
  }

  return NextResponse.json({ ok: true, alertsCreated: alerts, checked: orders.length });
}
