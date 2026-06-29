import { NextResponse } from "next/server";
import { getReportsData, getBridalOrders, getCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const period = (new URL(request.url).searchParams.get("period") ?? "monthly") as "daily" | "weekly" | "monthly" | "yearly";
  const data = await getReportsData(period);
  const orders = await getBridalOrders();

  const rows = [
    ["Order Number", "Customer", "Status", "Total", "Deposit", "Delivery Date"],
    ...(await Promise.all(
      orders.map(async (o) => {
        const c = await getCustomer(o.customerId);
        return [o.orderNumber, c?.name ?? "", o.status, o.totalPrice, o.depositPaid, o.deliveryDate.slice(0, 10)];
      })
    )),
  ];

  const csv = [
    `Period,${period}`,
    `Orders,${data.orderCount}`,
    `Revenue,${data.revenue.toFixed(2)}`,
    `Outstanding,${data.outstanding.toFixed(2)}`,
    "",
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="zarkari-report-${period}.csv"`,
    },
  });
}
