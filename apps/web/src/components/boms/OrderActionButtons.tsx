"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  orderId: string;
  status: string;
  canOwnerActions?: boolean;
  remainingBalance?: string;
}

export function OrderActionButtons({
  orderId,
  status,
  canOwnerActions = true,
  remainingBalance = "0",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showRedesign, setShowRedesign] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [redesignReason, setRedesignReason] = useState("");
  const [redesignComment, setRedesignComment] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(remainingBalance);
  const [refundReason, setRefundReason] = useState("");
  const [collectAmount, setCollectAmount] = useState(remainingBalance);
  const [alterationNotes, setAlterationNotes] = useState("");

  async function action(name: string, body?: Record<string, string | boolean>) {
    setLoading(name);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Action failed (${res.status})`);
      setShowRedesign(false);
      setShowCancel(false);
      setShowRefund(false);
      setShowCollect(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  const btnClass = "w-full py-3.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {status === "order_created" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => action("send-to-supplier")}
          className={cn(btnClass, "boms-btn-primary")}
        >
          {loading === "send-to-supplier" ? "Sending…" : "Send to Supplier"}
        </button>
      )}

      {canOwnerActions && !["collected", "cancelled", "refunded"].includes(status) && (
        <>
          {!showCancel ? (
            <button
              type="button"
              disabled={!!loading}
              onClick={() => setShowCancel(true)}
              className={cn(btnClass, "bg-red-50 text-red-700 hover:bg-red-100")}
            >
              Cancel Order
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation *"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCancel(false)} className="flex-1 py-2 text-sm text-slate-600">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim() || !!loading}
                  onClick={() => action("cancel", { reason: cancelReason })}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}

          {!showRefund ? (
            <button
              type="button"
              disabled={!!loading}
              onClick={() => setShowRefund(true)}
              className={cn(btnClass, "bg-red-50 text-red-700 hover:bg-red-100")}
            >
              Refund Order
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Refund amount (£)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason for refund *"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRefund(false)} className="flex-1 py-2 text-sm text-slate-600">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!refundReason.trim() || !refundAmount || !!loading}
                  onClick={() => action("refund", { amount: refundAmount, reason: refundReason })}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Confirm Refund
                </button>
              </div>
            </div>
          )}

          {!showRedesign ? (
            <button
              type="button"
              onClick={() => setShowRedesign(true)}
              className={cn(btnClass, "bg-amber-50 text-amber-800 hover:bg-amber-100")}
            >
              Send for Redesign
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <select
                value={redesignReason}
                onChange={(e) => setRedesignReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Reason for redesign</option>
                <option value="fit_issue">Fit issue</option>
                <option value="colour_mismatch">Colour mismatch</option>
                <option value="embroidery_error">Embroidery error</option>
                <option value="other">Other</option>
              </select>
              <textarea
                value={redesignComment}
                onChange={(e) => setRedesignComment(e.target.value)}
                placeholder="Comments"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
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
        <>
          {!showCollect ? (
            <button
              type="button"
              disabled={!!loading}
              onClick={() => setShowCollect(true)}
              className={cn(btnClass, "bg-green-600 text-white hover:bg-green-700")}
            >
              Order Collected
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                placeholder="Balance collected (£)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={alterationNotes}
                onChange={(e) => setAlterationNotes(e.target.value)}
                placeholder="Alteration notes (optional)"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCollect(false)} className="flex-1 py-2 text-sm text-slate-600">
                  Back
                </button>
                <button
                  type="button"
                  disabled={!!loading}
                  onClick={() =>
                    action("collect", {
                      balancePaid: true,
                      amountPaid: collectAmount,
                      alterationNotes,
                    })
                  }
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Confirm Collection
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
