import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addCustomerMessage } from "@/lib/data/actions";
import { getBridalOrderById, getMessages } from "@/lib/data";

export async function POST(request: Request) {
  const store = await cookies();
  const sessionOrderId = store.get("zarkari-customer-order")?.value;
  const { orderId, message } = await request.json();

  if (!sessionOrderId || sessionOrderId !== orderId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await getBridalOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  addCustomerMessage(orderId, message);
  const messages = await getMessages(orderId);

  return NextResponse.json({ messages });
}
