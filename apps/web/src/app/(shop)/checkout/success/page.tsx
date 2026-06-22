import Link from "next/link";
import { getRetailOrderBySession, getRetailOrderByNumber } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

interface Props {
  searchParams: Promise<{ success?: string; demo?: string; session_id?: string; order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { success, demo, session_id, order: orderParam } = await searchParams;

  let orderNumber: string | null = orderParam ?? null;
  let total: string | null = null;

  if (session_id) {
    const order = await getRetailOrderBySession(session_id);
    if (order) {
      orderNumber = order.orderNumber;
      total = order.total;
    }
  } else if (orderParam) {
    const order = await getRetailOrderByNumber(orderParam);
    if (order) {
      orderNumber = order.orderNumber;
      total = order.total;
    }
  }

  return (
    <section className="py-20 md:py-32 text-center">
      <div className="max-w-lg mx-auto px-4">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">Thank You</p>
        <h1 className="font-display text-3xl md:text-4xl text-charcoal mb-4">Order Confirmed</h1>
        <p className="text-charcoal/60 mb-4">
          {demo === "1"
            ? "Demo checkout complete — your order was recorded. Connect Stripe for live payments."
            : success === "1"
              ? "Your payment was successful. A confirmation email is on its way."
              : "Your order has been placed. You will receive a confirmation email shortly."}
        </p>
        {orderNumber && (
          <p className="text-sm font-mono text-charcoal mb-2">Order {orderNumber}</p>
        )}
        {total && <p className="text-lg text-charcoal mb-8">Total: {formatPrice(total)}</p>}
        <Link
          href="/"
          className="inline-flex px-8 py-4 bg-charcoal text-cream text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-charcoal transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
