"use client";

import { useState } from "react";
import { notifyCartUpdated } from "@/lib/cart-client";
import { MEASUREMENT_FIELDS, formatInches } from "@/lib/sizing";
import type { CartItem } from "@/lib/data/seed";

interface Props {
  lineId: string;
  quantity: number;
}

export function CartItemControls({ lineId, quantity }: Props) {
  const [busy, setBusy] = useState(false);

  async function updateQty(newQty: number) {
    if (newQty < 1) return;
    setBusy(true);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, quantity: newQty }),
      });
      notifyCartUpdated();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/cart?lineId=${encodeURIComponent(lineId)}`, { method: "DELETE" });
      notifyCartUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        type="button"
        disabled={busy || quantity <= 1}
        onClick={() => updateQty(quantity - 1)}
        className="w-8 h-8 border border-sand text-charcoal disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="text-sm w-6 text-center">{quantity}</span>
      <button
        type="button"
        disabled={busy}
        onClick={() => updateQty(quantity + 1)}
        className="w-8 h-8 border border-sand text-charcoal"
        aria-label="Increase quantity"
      >
        +
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        className="text-xs text-charcoal/50 hover:text-charcoal ml-2 uppercase tracking-wider"
      >
        Remove
      </button>
    </div>
  );
}

export function CartSizeDetails({ item }: { item: CartItem }) {
  const [expanded, setExpanded] = useState(false);
  const { sizeSelection } = item;

  if (!sizeSelection) return null;

  const preview =
    sizeSelection.mode === "standard"
      ? `Size ${sizeSelection.label}`
      : `Custom — Bust ${formatInches(sizeSelection.measurements.bust)}, Waist ${formatInches(sizeSelection.measurements.waist)}, Hip ${formatInches(sizeSelection.measurements.hip)}`;

  return (
    <div className="mt-2 text-xs text-charcoal/60">
      <p>{preview}</p>
      {sizeSelection.mode === "custom" && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-gold hover:underline mt-1"
        >
          {expanded ? "Hide measurements" : "View all measurements"}
        </button>
      )}
      {expanded && (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-charcoal/70">
          {MEASUREMENT_FIELDS.map((field) => (
            <div key={field.key}>
              <dt className="inline">{field.label}: </dt>
              <dd className="inline font-medium">
                {formatInches(sizeSelection.measurements[field.key])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
