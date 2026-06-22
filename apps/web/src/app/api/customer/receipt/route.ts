import { NextResponse } from "next/server";
import { getBridalOrderById, getCustomer, getPayments } from "@/lib/data";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/utils";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const store = await cookies();
  if (store.get("zarkari-customer-order")?.value !== orderId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await getBridalOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [customer, payments] = await Promise.all([getCustomer(order.customerId), getPayments(orderId)]);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${order.orderNumber}</title>
<style>body{font-family:Georgia,serif;max-width:480px;margin:40px auto;padding:24px;color:#1a1a1a}
h1{font-size:20px;letter-spacing:0.2em}table{width:100%;margin-top:24px;font-size:14px}
td{padding:8px 0;border-bottom:1px solid #e8e0d5}.right{text-align:right}</style></head>
<body>
<h1>ZARKARI</h1>
<p>Payment Receipt</p>
<table>
<tr><td>Order</td><td class="right">${order.orderNumber}</td></tr>
<tr><td>Customer</td><td class="right">${customer?.name ?? ""}</td></tr>
<tr><td>Total</td><td class="right">${formatPrice(order.totalPrice)}</td></tr>
<tr><td>Deposit Paid</td><td class="right">${formatPrice(order.depositPaid)}</td></tr>
<tr><td>Balance Due</td><td class="right">${formatPrice(order.remainingBalance)}</td></tr>
</table>
${payments.map((p) => `<p style="font-size:12px;margin-top:16px">${p.type}: ${formatPrice(p.amount)} (${p.method ?? "—"}) — ${new Date(p.createdAt).toLocaleDateString("en-GB")}</p>`).join("")}
<p style="font-size:11px;color:#888;margin-top:32px">zarkari.co.uk</p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
