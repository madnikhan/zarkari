import { cookies } from "next/headers";
import type { CartItem } from "@/lib/data/seed";
import { demoProducts } from "@/lib/data/seed";
import { sanitizeImageUrl } from "@/lib/image-url";
import { buildLineId, formatSizeSummary, type SizeSelection } from "@/lib/sizing";

const CART_COOKIE = "zarkari-cart";

function formatCartTitle(productTitle: string, sizeSelection: SizeSelection): string {
  const summary = formatSizeSummary(sizeSelection);
  return `${productTitle} — ${summary}`;
}

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as CartItem[];
    const cleaned: CartItem[] = [];
    for (const item of items) {
      if (!item.sizeSelection || !item.lineId) continue;
      const product = demoProducts.find(
        (p) => p.id === item.productId || p.handle === item.handle
      );
      if (!product) continue;
      const variant = product.variants.find((v) => v.id === item.variantId) ?? product.variants[0];
      if (!variant) continue;
      cleaned.push({
        ...item,
        title: formatCartTitle(product.title, item.sizeSelection as SizeSelection),
        handle: product.handle,
        price: variant.price,
        imageUrl: sanitizeImageUrl(product.featuredImageUrl),
      });
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function buildCartItem(
  variantId: string,
  quantity: number,
  sizeSelection: SizeSelection
): CartItem | null {
  for (const product of demoProducts) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      const lineId = buildLineId(variantId, sizeSelection);
      return {
        lineId,
        variantId: variant.id,
        productId: product.id,
        title: formatCartTitle(product.title, sizeSelection),
        handle: product.handle,
        price: variant.price,
        quantity,
        imageUrl: sanitizeImageUrl(product.featuredImageUrl),
        sizeSelection,
      };
    }
  }
  return null;
}

export function mergeCartItems(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((c) => c.lineId === item.lineId);
  if (existing) {
    return cart.map((c) =>
      c.lineId === item.lineId ? { ...c, quantity: c.quantity + item.quantity } : c
    );
  }
  return [...cart, item];
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function updateCartQuantity(cart: CartItem[], lineId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return cart.filter((c) => c.lineId !== lineId);
  return cart.map((c) => (c.lineId === lineId ? { ...c, quantity } : c));
}

export function removeCartItem(cart: CartItem[], lineId: string): CartItem[] {
  return cart.filter((c) => c.lineId !== lineId);
}

export const CART_COOKIE_NAME = CART_COOKIE;
