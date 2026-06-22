"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BridalStatus } from "@/lib/data/seed";
import { isFinalStatus } from "@/lib/orders/status-machine";

interface OrderActionBarProps {
  orderId: string;
  status: BridalStatus;
  isOwner: boolean;
  hasSupplier: boolean;
}

export function OrderActionBar({ orderId, status, isOwner, hasSupplier }: OrderActionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<"cancel" | "refund" | "redesign" | "collect" | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [collectDetails, setCollectDetails] = useState({ balancePaid: true, amountPaid: "", alterationNotes: "" });

  const inactive = isFinalStatus(status);

  async function action(type: string, body: Record<string, unknown> = {}) {
    setLoading(type);
    try {
      const res = await fetch(`/api/orders/${orderId}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setModal(null);
        setReason("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  if (inactive) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {hasSupplier && (status === "order_created" || status === "supplier_rejected") && (
          <button
            type="button"
            disabled={!!loading}
            onClick={() => action("send-to-supplier")}
            className="px-4 py-2 text-xs tracking-wide uppercase bg-charcoal text-cream hover:bg-gold hover:text-charcoal transition-colors rounded"
          >
            Send to Supplier
          </button>
        )}
        {isOwner && (
          <button type="button" onClick={() => setModal("cancel")} className="px-4 py-2 text-xs tracking-wide uppercase border border-red-200 text-red-700 rounded hover:bg-red-50">
            Cancel
          </button>
        )}
        {isOwner && (
          <button type="button" onClick={() => setModal("refund")} className="px-4 py-2 text-xs tracking-wide uppercase border border-sand rounded hover:bg-sand/30">
            Refund
          </button>
        )}
        {isOwner && (
          <button type="button" onClick={() => setModal("redesign")} className="px-4 py-2 text-xs tracking-wide uppercase border border-sand rounded hover:bg-sand/30">
            Send for Redesign
          </button>
        )}
        {(status === "ready_for_collection" || status === "delivered_to_shop") && (
          <button type="button" onClick={() => setModal("collect")} className="px-4 py-2 text-xs tracking-wide uppercase bg-gold text-charcoal rounded hover:bg-gold/80">
            Order Collected
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
          <div className="bg-cream rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="font-display text-xl mb-4 capitalize">{modal} Order</h3>
            {(modal === "cancel" || modal === "redesign" || modal === "refund") && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason / notes"
                className="w-full border border-sand rounded p-3 text-sm mb-4 min-h-[100px]"
              />
            )}
            {modal === "refund" && (
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Refund amount (£)"
                className="w-full border border-sand rounded p-3 text-sm mb-4"
              />
            )}
            {modal === "collect" && (
              <div className="space-y-3 mb-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={collectDetails.balancePaid} onChange={(e) => setCollectDetails({ ...collectDetails, balancePaid: e.target.checked })} />
                  Balance paid in full
                </label>
                <input
                  value={collectDetails.amountPaid}
                  onChange={(e) => setCollectDetails({ ...collectDetails, amountPaid: e.target.value })}
                  placeholder="Amount received (£)"
                  className="w-full border border-sand rounded p-3"
                />
                <textarea
                  value={collectDetails.alterationNotes}
                  onChange={(e) => setCollectDetails({ ...collectDetails, alterationNotes: e.target.value })}
                  placeholder="Alteration notes (optional)"
                  className="w-full border border-sand rounded p-3 min-h-[60px]"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-charcoal/60">Close</button>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => {
                  if (modal === "cancel") action("cancel", { reason });
                  else if (modal === "refund") action("refund", { amount, reason });
                  else if (modal === "redesign") action("redesign", { reason });
                  else if (modal === "collect") action("collect", collectDetails);
                }}
                className="px-4 py-2 text-sm bg-charcoal text-cream rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
