"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BomsActionButton } from "@/components/boms/BomsActionButton";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";

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
  const [activeModal, setActiveModal] = useState<"cancel" | "refund" | "redesign" | "collect" | null>(null);
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
      setActiveModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  const showOwnerActions = canOwnerActions && !["collected", "cancelled", "refunded"].includes(status);

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {!activeModal && (
        <div className="grid grid-cols-2 gap-3">
          {status === "order_created" && (
            <BomsActionButton color="green" disabled={!!loading} onClick={() => action("send-to-supplier")}>
              {loading === "send-to-supplier" ? "Sending…" : "Send to Supplier"}
            </BomsActionButton>
          )}
          {showOwnerActions && (
            <>
              <BomsActionButton color="red" disabled={!!loading} onClick={() => setActiveModal("cancel")}>
                Cancel Order
              </BomsActionButton>
              <BomsActionButton color="purple" disabled={!!loading} onClick={() => setActiveModal("refund")}>
                Refund Order
              </BomsActionButton>
              <BomsActionButton color="orange" disabled={!!loading} onClick={() => setActiveModal("redesign")}>
                Send for Redesign
              </BomsActionButton>
            </>
          )}
          {status === "ready_for_collection" && (
            <BomsActionButton color="blue" disabled={!!loading} onClick={() => setActiveModal("collect")} className="col-span-2">
              Order Collected
            </BomsActionButton>
          )}
        </div>
      )}

      {activeModal === "cancel" && (
        <div className="boms-card p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Cancel Order</h3>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation *"
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <BomsActionButton color="slate" onClick={() => setActiveModal(null)}>Back</BomsActionButton>
            <BomsActionButton
              color="red"
              disabled={!cancelReason.trim() || !!loading}
              onClick={() => action("cancel", { reason: cancelReason })}
            >
              Confirm Cancel
            </BomsActionButton>
          </div>
        </div>
      )}

      {activeModal === "refund" && (
        <div className="boms-card p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Refund Order</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="Refund amount (£)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason for refund *"
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <BomsActionButton color="slate" onClick={() => setActiveModal(null)}>Back</BomsActionButton>
            <BomsActionButton
              color="purple"
              disabled={!refundReason.trim() || !refundAmount || !!loading}
              onClick={() => action("refund", { amount: refundAmount, reason: refundReason })}
            >
              Confirm Refund
            </BomsActionButton>
          </div>
        </div>
      )}

      {activeModal === "redesign" && (
        <div className="boms-card p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Send for Redesign</h3>
          <select
            value={redesignReason}
            onChange={(e) => setRedesignReason(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Reason for redesign</option>
            <option value="wrong_measurements">Wrong Measurements</option>
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
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <MediaUploadZone category="redesign" showCameraButtons label="Upload photos or video" />
          <div className="grid grid-cols-2 gap-2">
            <BomsActionButton color="slate" onClick={() => setActiveModal(null)}>Back</BomsActionButton>
            <BomsActionButton
              color="orange"
              disabled={!redesignReason || !!loading}
              onClick={() => action("redesign", { reason: redesignReason, comment: redesignComment })}
            >
              Submit Redesign
            </BomsActionButton>
          </div>
        </div>
      )}

      {activeModal === "collect" && (
        <div className="boms-card p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Order Collected</h3>
          <input
            type="number"
            step="0.01"
            min="0"
            value={collectAmount}
            onChange={(e) => setCollectAmount(e.target.value)}
            placeholder="Balance collected (£)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <textarea
            value={alterationNotes}
            onChange={(e) => setAlterationNotes(e.target.value)}
            placeholder="Alteration notes (optional)"
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <BomsActionButton color="slate" onClick={() => setActiveModal(null)}>Back</BomsActionButton>
            <BomsActionButton
              color="blue"
              disabled={!!loading}
              onClick={() =>
                action("collect", { balancePaid: true, amountPaid: collectAmount, alterationNotes })
              }
            >
              Confirm Collection
            </BomsActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
