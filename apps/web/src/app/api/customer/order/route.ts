import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getBridalOrderById,
  getBridalOrderByNumber,
  getOrderFiles,
  getMessages,
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

  const [files, messages] = await Promise.all([
    getOrderFiles(order.id, true),
    getMessages(order.id),
  ]);

  return NextResponse.json({ order, files, messages });
}
