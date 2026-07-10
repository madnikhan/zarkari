"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerMessage } from "@/lib/data/seed";
import { MessageAttachment } from "@/components/orders/MessageAttachment";

interface Props {
  orderId: string;
  pending: CustomerMessage[];
}

export function PendingSupplierUpdates({ orderId, pending: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!items.length) return null;

  async function act(messageId: string, action: "forward" | "dismiss") {
    setLoadingId(messageId);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/${messageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          customerNote: notes[messageId]?.trim(),
        }),
      });
      if (!res.ok) throw new Error("Action failed");
      setItems((prev) => prev.filter((m) => m.id !== messageId));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
      <h3 className="text-sm font-semibold text-amber-900 mb-2">Pending supplier updates</h3>
      <p className="text-xs text-amber-800 mb-3">
        Review progress photos/videos before sending to the customer as a ZARKARI update.
      </p>
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className="bg-white rounded-lg border border-amber-100 p-3">
            <p className="text-sm text-slate-800 mb-2">{m.message}</p>
            <MessageAttachment message={m} />
            <textarea
              value={notes[m.id] ?? ""}
              onChange={(e) => setNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
              rows={2}
              placeholder="Optional note for customer (defaults to supplier message)"
              className="w-full mt-2 border border-slate-200 rounded-lg px-3 py-2 text-xs"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                disabled={loadingId === m.id}
                onClick={() => act(m.id, "forward")}
                className="flex-1 py-2 bg-[#4C3BCF] text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Forward to customer
              </button>
              <button
                type="button"
                disabled={loadingId === m.id}
                onClick={() => act(m.id, "dismiss")}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
