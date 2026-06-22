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
import type { SizeSelection } from "@/lib/sizing";

const COOKIE_OPTS = { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 14 };

function setCartCookie(res: NextResponse, cart: Awaited<ReturnType<typeof getCart>>) {
  res.cookies.set(CART_COOKIE_NAME, JSON.stringify(cart), COOKIE_OPTS);
}

function isSizeSelection(value: unknown): value is SizeSelection {
  if (!value || typeof value !== "object") return false;
  const v = value as SizeSelection;
  return (
    (v.mode === "standard" || v.mode === "custom") &&
    typeof v.label === "string" &&
    typeof v.measurements === "object" &&
    v.measurements !== null
  );
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
  const { variantId, quantity = 1, sizeSelection } = body as {
    variantId?: string;
    quantity?: number;
    sizeSelection?: SizeSelection;
  };
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });
  if (!isSizeSelection(sizeSelection)) {
    return NextResponse.json({ error: "sizeSelection required" }, { status: 400 });
  }

  const item = buildCartItem(variantId, quantity, sizeSelection);
  if (!item) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  const cart = mergeCartItems(await getCart(), item);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { lineId, quantity } = body as { lineId?: string; quantity?: number };
  if (!lineId || quantity === undefined) {
    return NextResponse.json({ error: "lineId and quantity required" }, { status: 400 });
  }

  const cart = updateCartQuantity(await getCart(), lineId, quantity);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get("lineId");
  if (!lineId) return NextResponse.json({ error: "lineId required" }, { status: 400 });

  const cart = removeCartItem(await getCart(), lineId);
  const res = NextResponse.json({ cart, ok: true });
  setCartCookie(res, cart);
  return res;
}
