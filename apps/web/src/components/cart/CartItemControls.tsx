"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-client";

interface Props {
  variantId: string;
  quantity: number;
}

export function CartItemControls({ variantId, quantity }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateQty(newQty: number) {
    setLoading(true);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: newQty }),
      });
      notifyCartUpdated();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    try {
      await fetch(`/api/cart?variantId=${encodeURIComponent(variantId)}`, { method: "DELETE" });
      notifyCartUpdated();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="flex items-center border border-sand">
        <button
          type="button"
          disabled={loading || quantity <= 1}
          onClick={() => updateQty(quantity - 1)}
          className="px-3 py-1 text-charcoal hover:bg-sand/30 disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="px-3 py-1 text-sm min-w-[2rem] text-center">{quantity}</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => updateQty(quantity + 1)}
          className="px-3 py-1 text-charcoal hover:bg-sand/30"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={remove}
        className="text-xs text-charcoal/50 hover:text-red-600 uppercase tracking-wide"
      >
        Remove
      </button>
    </div>
  );
}
