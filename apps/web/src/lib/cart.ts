import { cookies } from "next/headers";
import type { CartItem } from "@/lib/data/seed";
import { demoProducts } from "@/lib/data/seed";
import { sanitizeImageUrl } from "@/lib/image-url";
import { buildLineId, formatSizeSummary, type SizeSelection } from "@/lib/sizing";
import { getVariantByIdDb } from "@/lib/db/cms-products";
import { isDbConfigured } from "@/lib/db";

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
      const resolved = await resolveCartLine(item.variantId, item.sizeSelection as SizeSelection);
      if (!resolved) continue;
      cleaned.push({
        ...item,
        title: formatCartTitle(resolved.product.title, item.sizeSelection as SizeSelection),
        handle: resolved.product.handle,
        productId: resolved.product.id,
        variantId: resolved.variant.id,
        price: resolved.variant.price,
        imageUrl: sanitizeImageUrl(resolved.product.featuredImageUrl),
      });
    }
    return cleaned;
  } catch {
    return [];
  }
}

async function resolveCartLine(variantId: string, _sizeSelection: SizeSelection) {
  if (isDbConfigured()) {
    const row = await getVariantByIdDb(variantId);
    if (row) {
      return { product: row.product, variant: row.variant };
    }
  }
  for (const product of demoProducts) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      return {
        product,
        variant: {
          id: variant.id,
          title: variant.title,
          price: variant.price,
          inventoryQty: variant.inventoryQty,
        },
      };
    }
  }
  return null;
}

export async function buildCartItem(
  variantId: string,
  quantity: number,
  sizeSelection: SizeSelection
): Promise<CartItem | null> {
  const resolved = await resolveCartLine(variantId, sizeSelection);
  if (!resolved) return null;

  const lineId = buildLineId(variantId, sizeSelection);
  return {
    lineId,
    variantId: resolved.variant.id,
    productId: resolved.product.id,
    title: formatCartTitle(resolved.product.title, sizeSelection),
    handle: resolved.product.handle,
    price: resolved.variant.price,
    quantity,
    imageUrl: sanitizeImageUrl(resolved.product.featuredImageUrl),
    sizeSelection,
  };
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
