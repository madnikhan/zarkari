export const CART_UPDATED_EVENT = "zarkari-cart-updated";
const CART_CHANNEL = "zarkari-cart";

export function notifyCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  try {
    const channel = new BroadcastChannel(CART_CHANNEL);
    channel.postMessage({ type: "cart-updated" });
    channel.close();
  } catch {
    /* BroadcastChannel unsupported */
  }
}

export function subscribeCartUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onLocal = () => handler();
  window.addEventListener(CART_UPDATED_EVENT, onLocal);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CART_CHANNEL);
    channel.onmessage = () => handler();
  } catch {
    /* ignore */
  }

  const onFocus = () => handler();
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") handler();
  });

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, onLocal);
    window.removeEventListener("focus", onFocus);
    channel?.close();
  };
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

export async function fetchCartItems<T = unknown>(): Promise<T[]> {
  try {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { cart?: T[] };
    return data.cart ?? [];
  } catch {
    return [];
  }
}
