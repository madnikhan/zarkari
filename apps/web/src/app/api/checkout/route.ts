import { NextResponse } from "next/server";
import { getCart, CART_COOKIE_NAME } from "@/lib/cart";
import { createRetailOrder } from "@/lib/data/products";
import { randomUUID } from "crypto";

const FREE_SHIPPING_THRESHOLD = 75;
const SHIPPING_FEE = 6.95;

function siteUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
}

function absoluteUrl(origin: string, path?: string) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function POST(request: Request) {
  const cart = await getCart();
  const origin = siteUrl(request);

  if (!cart.length) {
    return NextResponse.redirect(new URL("/cart", origin));
  }

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const orderDraftId = randomUUID();
  const cartSnapshot = cart.map((c) => ({
    lineId: c.lineId,
    variantId: c.variantId,
    productId: c.productId,
    title: c.title,
    quantity: c.quantity,
    price: c.price,
    handle: c.handle,
    sizeSelection: c.sizeSelection,
  }));

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey || stripeKey.includes("placeholder")) {
    const order = createRetailOrder({
      customerEmail: "demo@zarkari.co.uk",
      customerName: "Demo Customer",
      items: cart.map((c) => ({
        title: c.title,
        quantity: c.quantity,
        price: c.price,
        variantId: c.variantId,
        productId: c.productId,
        sizeSelection: c.sizeSelection,
      })),
    });
    const res = NextResponse.redirect(new URL(`/checkout/success?demo=1&order=${order.orderNumber}`, origin));
    res.cookies.set(CART_COOKIE_NAME, "[]", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    type LineItem = {
      quantity: number;
      price_data: {
        currency: "gbp";
        unit_amount: number;
        product_data: { name: string; images?: string[] };
      };
    };

    const lineItems: LineItem[] = cart.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(parseFloat(item.price) * 100),
        product_data: {
          name: item.title,
          images: item.imageUrl ? [absoluteUrl(origin, item.imageUrl)!] : undefined,
        },
      },
    }));

    if (subtotal < FREE_SHIPPING_THRESHOLD) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: Math.round(SHIPPING_FEE * 100),
          product_data: { name: "Standard UK Delivery" },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "gbp",
      line_items: lineItems,
      customer_email: undefined,
      shipping_address_collection: { allowed_countries: ["GB"] },
      success_url: `${origin}/checkout/success?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?cancelled=1`,
      metadata: {
        orderDraftId,
        cartJson: JSON.stringify(cartSnapshot),
        subtotal: subtotal.toFixed(2),
      },
    });

    if (session.url) return NextResponse.redirect(session.url);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
