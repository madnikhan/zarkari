import Link from "next/link";
import Image from "next/image";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { CartItemControls } from "@/components/cart/CartItemControls";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Bag" };

interface Props {
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function CartPage({ searchParams }: Props) {
  const { cancelled } = await searchParams;
  const cart = await getCart();
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 6.95;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl md:text-4xl text-charcoal mb-10">Your Bag</h1>

        {cancelled === "1" && (
          <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Checkout was cancelled. Your bag is unchanged.
          </div>
        )}

        {!cart.length ? (
          <div className="text-center py-16">
            <p className="text-charcoal/60 mb-8">Your bag is empty.</p>
            <Link
              href="/"
              className="inline-flex px-8 py-4 bg-charcoal text-cream text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-charcoal transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-sand mb-8">
              {cart.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-6">
                  {item.imageUrl && (
                    <div className="relative w-24 h-32 flex-shrink-0 bg-sand/20">
                      <Image src={item.imageUrl} alt={item.title} fill sizes="96px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Link href={`/products/${item.handle}`} className="text-sm font-medium text-charcoal hover:text-gold">
                      {item.title}
                    </Link>
                    <CartItemControls variantId={item.variantId} quantity={item.quantity} />
                    <p className="text-sm text-charcoal mt-2">{formatPrice(String(parseFloat(item.price) * item.quantity))}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-sand pt-6 space-y-2 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="tracking-wide uppercase text-charcoal/60">Subtotal</span>
                <span className="text-charcoal">{formatPrice(String(subtotal))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="tracking-wide uppercase text-charcoal/60">Shipping</span>
                <span className="text-charcoal">{shipping === 0 ? "Free" : formatPrice(String(shipping))}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm tracking-wide uppercase text-charcoal/60">Total</span>
                <span className="text-lg text-charcoal">{formatPrice(String(subtotal + shipping))}</span>
              </div>
            </div>
            <form action="/api/checkout" method="POST">
              <button
                type="submit"
                className="w-full py-4 bg-charcoal text-cream text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-charcoal transition-colors"
              >
                Checkout with Stripe
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
