import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildCartItem,
  CART_COOKIE_NAME,
  getCart,
  mergeCartItems,
  removeCartItem,
  updateCartQuantity,
} from "@/lib/cart";

const COOKIE_OPTS = { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 14 };

function setCartCookie(res: NextResponse, cart: Awaited<ReturnType<typeof getCart>>) {
  res.cookies.set(CART_COOKIE_NAME, JSON.stringify(cart), COOKIE_OPTS);
}

export async function GET() {
  const cart = await getCart();
  const store = await cookies();
  const raw = store.get(CART_COOKIE_NAME)?.value;
  const res = NextResponse.json({ cart });
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (JSON.stringify(parsed) !== JSON.stringify(cart)) {
        setCartCookie(res, cart);
      }
    } catch {
      /* ignore malformed cookie */
    }
  }
  return res;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { variantId, quantity = 1 } = body as { variantId?: string; quantity?: number };
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  const item = buildCartItem(variantId, quantity);
  if (!item) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  const cart = mergeCartItems(await getCart(), item);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { variantId, quantity } = body as { variantId?: string; quantity?: number };
  if (!variantId || quantity === undefined) {
    return NextResponse.json({ error: "variantId and quantity required" }, { status: 400 });
  }

  const cart = updateCartQuantity(await getCart(), variantId, quantity);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  const cart = removeCartItem(await getCart(), variantId);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}
