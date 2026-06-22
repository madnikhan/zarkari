"use client";

import { useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-client";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  variantId: string;
  available: boolean;
  className?: string;
}

export function AddToCartButton({ variantId, available, className }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      if (res.ok) {
        setAdded(true);
        notifyCartUpdated();
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!available || loading}
      className={cn(
        "w-full py-4 text-xs tracking-[0.2em] uppercase transition-all duration-300",
        available
          ? "bg-charcoal text-cream hover:bg-gold hover:text-charcoal"
          : "bg-sand text-charcoal/40 cursor-not-allowed",
        className
      )}
    >
      {!available ? "Sold Out" : loading ? "Adding..." : added ? "Added to Bag" : "Add to Bag"}
    </button>
  );
}
