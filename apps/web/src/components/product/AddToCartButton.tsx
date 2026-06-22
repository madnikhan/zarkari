"use client";

import { useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-client";
import type { SizeSelection } from "@/lib/sizing";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  variantId: string;
  sizeSelection: SizeSelection | null;
  available: boolean;
  className?: string;
}

export function AddToCartButton({
  variantId,
  sizeSelection,
  available,
  className,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const canAdd = available && sizeSelection !== null;

  async function handleAdd() {
    if (!sizeSelection) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1, sizeSelection }),
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
      disabled={!canAdd || loading}
      className={cn(
        "w-full py-4 text-xs tracking-[0.2em] uppercase transition-all duration-300",
        canAdd
          ? "bg-charcoal text-cream hover:bg-gold hover:text-charcoal"
          : "bg-sand text-charcoal/40 cursor-not-allowed",
        className
      )}
    >
      {!available
        ? "Sold Out"
        : !sizeSelection
          ? "Select Size"
          : loading
            ? "Adding..."
            : added
              ? "Added to Bag"
              : "Add to Bag"}
    </button>
  );
}
