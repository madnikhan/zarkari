import { cookies } from "next/headers";
import type { CartItem } from "@/lib/data/seed";
import { demoProducts } from "@/lib/data/seed";
import { sanitizeImageUrl } from "@/lib/image-url";

const CART_COOKIE = "zarkari-cart";

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as CartItem[];
    const cleaned: CartItem[] = [];
    for (const item of items) {
      const product = demoProducts.find(
        (p) => p.id === item.productId || p.handle === item.handle
      );
      if (!product) continue;
      const variant = product.variants.find((v) => v.id === item.variantId) ?? product.variants[0];
      if (!variant) continue;
      cleaned.push({
        ...item,
        title: `${product.title} — ${variant.title}`,
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

export function buildCartItem(variantId: string, quantity: number): CartItem | null {
  for (const product of demoProducts) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      return {
        variantId: variant.id,
        productId: product.id,
        title: `${product.title} — ${variant.title}`,
        handle: product.handle,
        price: variant.price,
        quantity,
        imageUrl: sanitizeImageUrl(product.featuredImageUrl),
      };
    }
  }
  return null;
}

export function mergeCartItems(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((c) => c.variantId === item.variantId);
  if (existing) {
    return cart.map((c) =>
      c.variantId === item.variantId ? { ...c, quantity: c.quantity + item.quantity } : c
    );
  }
  return [...cart, item];
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function updateCartQuantity(cart: CartItem[], variantId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return cart.filter((c) => c.variantId !== variantId);
  return cart.map((c) => (c.variantId === variantId ? { ...c, quantity } : c));
}

export function removeCartItem(cart: CartItem[], variantId: string): CartItem[] {
  return cart.filter((c) => c.variantId !== variantId);
}

export const CART_COOKIE_NAME = CART_COOKIE;
