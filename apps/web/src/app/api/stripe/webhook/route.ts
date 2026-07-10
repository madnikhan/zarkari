import { NextResponse } from "next/server";
import { createRetailOrder } from "@/lib/data/products";
import { CART_COOKIE_NAME } from "@/lib/cart";
import { sendOrderConfirmation } from "@/lib/email";
import { createRetailOrderDb, findRetailOrderByStripeSession } from "@/lib/db/retail-orders";
import { isDbConfigured } from "@/lib/db";

interface CartSnapshotItem {
  lineId?: string;
  variantId?: string;
  productId?: string;
  title: string;
  quantity: number;
  price: string;
  sizeSelection?: {
    mode: "standard" | "custom";
    label: string;
    measurements: Record<string, number>;
  };
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secret || !key || key.includes("placeholder")) {
    return NextResponse.json({ received: true, demo: true });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

    const event = stripe.webhooks.constructEvent(body, sig, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        customer_email?: string | null;
        customer_details?: { email?: string; name?: string } | null;
        metadata?: { cartJson?: string; subtotal?: string };
        amount_total?: number | null;
      };

      const existing = await findRetailOrderByStripeSession(session.id);
      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const email =
        session.customer_email ?? session.customer_details?.email ?? "customer@example.com";
      const name = session.customer_details?.name ?? undefined;

      let items: CartSnapshotItem[] = [];
      if (session.metadata?.cartJson) {
        try {
          items = JSON.parse(session.metadata.cartJson) as CartSnapshotItem[];
        } catch {
          items = [];
        }
      }

      if (!items.length) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        items = lineItems.data
          .filter((li) => li.description !== "Standard UK Delivery")
          .map((li) => ({
            title: li.description ?? "Item",
            quantity: li.quantity ?? 1,
            price: ((li.amount_total ?? 0) / (li.quantity ?? 1) / 100).toFixed(2),
          }));
      }

      const total =
        session.metadata?.subtotal ??
        (session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00");

      const orderInput = {
        customerEmail: email,
        customerName: name,
        items: items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          variantId: i.variantId,
          productId: i.productId,
          sizeSelection: i.sizeSelection,
        })),
        stripeSessionId: session.id,
      };

      const order = isDbConfigured()
        ? (await createRetailOrderDb(orderInput)) ?? createRetailOrder(orderInput)
        : createRetailOrder(orderInput);

      if (isDbConfigured() && order) {
        const { autoPostCashTransaction } = await import("@/lib/db/cash-ledger");
        await autoPostCashTransaction({
          direction: "in",
          type: "ready_made_sale",
          amount: total,
          method: "online",
          reference: order.orderNumber,
          description: order.items.map((i) => i.title).join(", ") || "Online shop sale",
          retailOrderId: order.id,
        });

        const { deductForRetailOrder } = await import("@/lib/stock/service");
        await deductForRetailOrder(
          order.id,
          orderInput.items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            quantity: i.quantity,
            title: i.title,
          }))
        ).catch(console.error);
      }

      await sendOrderConfirmation(email, order.orderNumber, total);

      const res = NextResponse.json({ received: true, orderNumber: order.orderNumber });
      res.cookies.set(CART_COOKIE_NAME, "[]", { httpOnly: true, path: "/", maxAge: 0 });
      return res;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
