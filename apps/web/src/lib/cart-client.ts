export const CART_UPDATED_EVENT = "zarkari-cart-updated";

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export async function fetchCartCount(): Promise<number> {
  try {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { cart?: { quantity: number }[] };
    return (data.cart ?? []).reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}
