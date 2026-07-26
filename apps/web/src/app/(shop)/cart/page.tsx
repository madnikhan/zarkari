import { getCart } from "@/lib/cart";
import { CartPageClient } from "@/components/cart/CartPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Bag" };

interface Props {
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function CartPage({ searchParams }: Props) {
  const { cancelled } = await searchParams;
  const cart = await getCart();

  return <CartPageClient initialCart={cart} cancelled={cancelled === "1"} />;
}
