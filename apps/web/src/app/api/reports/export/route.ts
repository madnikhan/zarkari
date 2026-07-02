import { NextResponse } from "next/server";
import { getReportsData, getExportOrders } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  try {
    const period = (new URL(request.url).searchParams.get("period") ?? "monthly") as "daily" | "weekly" | "monthly" | "yearly";
    const data = await getReportsData(period);
    const orders = await getExportOrders(period);

    const rows = [
      ["Order Number", "Customer", "Status", "Total", "Deposit", "Delivery Date"],
      ...orders.map((o) => [
        o.orderNumber,
        o.customerName ?? "",
        o.status,
        o.totalPrice,
        o.depositPaid,
        o.deliveryDate.slice(0, 10),
      ]),
    ];

    const csv = [
      `Period,${period}`,
      `Orders,${data.orderCount}`,
      `Revenue,${Number(data.revenue).toFixed(2)}`,
      `Outstanding,${Number(data.outstanding).toFixed(2)}`,
      "",
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="zarkari-report-${period}.csv"`,
      },
    });
  } catch (err) {
    console.error("CSV export failed:", err);
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
