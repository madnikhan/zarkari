"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  orderId: string;
  status: string;
  canOwnerActions?: boolean;
}

export function OrderActionButtons({ orderId, status, canOwnerActions = true }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showRedesign, setShowRedesign] = useState(false);
  const [redesignReason, setRedesignReason] = useState("");
  const [redesignComment, setRedesignComment] = useState("");

  async function action(name: string, body?: Record<string, string>) {
    setLoading(name);
    try {
      const res = await fetch(`/api/orders/${orderId}/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
      setShowRedesign(false);
    }
  }

  const btnClass = "w-full py-3.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className="space-y-2">
      {status === "order_created" && (
        <button type="button" disabled={!!loading} onClick={() => action("send-to-supplier")} className={cn(btnClass, "boms-btn-primary")}>
          {loading === "send-to-supplier" ? "Sending..." : "Send to Supplier"}
        </button>
      )}

      {canOwnerActions && !["collected", "cancelled", "refunded"].includes(status) && (
        <>
          <button type="button" disabled={!!loading} onClick={() => action("cancel")} className={cn(btnClass, "bg-red-50 text-red-700 hover:bg-red-100")}>
            Cancel Order
          </button>
          <button type="button" disabled={!!loading} onClick={() => action("refund")} className={cn(btnClass, "bg-red-50 text-red-700 hover:bg-red-100")}>
            Refund Order
          </button>
          {!showRedesign ? (
            <button type="button" onClick={() => setShowRedesign(true)} className={cn(btnClass, "bg-amber-50 text-amber-800 hover:bg-amber-100")}>
              Send for Redesign
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <select value={redesignReason} onChange={(e) => setRedesignReason(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Reason for redesign</option>
                <option value="fit_issue">Fit issue</option>
                <option value="colour_mismatch">Colour mismatch</option>
                <option value="embroidery_error">Embroidery error</option>
                <option value="other">Other</option>
              </select>
              <textarea value={redesignComment} onChange={(e) => setRedesignComment(e.target.value)} placeholder="Comments" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <button
                type="button"
                disabled={!redesignReason || !!loading}
                onClick={() => action("redesign", { reason: redesignReason, comment: redesignComment })}
                className={cn(btnClass, "boms-btn-primary")}
              >
                Submit Redesign Request
              </button>
            </div>
          )}
        </>
      )}

      {status === "ready_for_collection" && (
        <button type="button" disabled={!!loading} onClick={() => action("collect")} className={cn(btnClass, "bg-green-600 text-white hover:bg-green-700")}>
          Order Collected
        </button>
      )}
    </div>
  );
}
