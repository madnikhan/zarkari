import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getBridalOrderByNumber,
  getOrderFiles,
  getCustomerMessages,
  getCancellations,
  getRefunds,
} from "@/lib/data";

export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get("orderNumber");
  if (!orderNumber) return NextResponse.json({ error: "Missing order number" }, { status: 400 });

  const store = await cookies();
  const sessionOrderId = store.get("zarkari-customer-order")?.value;
  const order = await getBridalOrderByNumber(orderNumber);

  if (!order || order.id !== sessionOrderId) {
    return NextResponse.json({ error: "Please verify your order first" }, { status: 401 });
  }

  const [files, messages, cancellations, refunds] = await Promise.all([
    getOrderFiles(order.id, true),
    getCustomerMessages(order.id),
    getCancellations(order.id),
    getRefunds(order.id),
  ]);

  const cancellationReason =
    cancellations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]?.reason ?? undefined;
  const refundReason =
    refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      ?.reason ?? undefined;

  import("@/lib/firebase/sync")
    .then((m) => {
      m.syncOrderLive(order.id, { status: order.status, deliveryDate: order.deliveryDate });
      for (const msg of messages) {
        m.syncOrderMessage(order.id, msg);
      }
    })
    .catch(console.error);

  return NextResponse.json({
    order,
    files,
    messages,
    cancellationReason,
    refundReason,
  });
}
