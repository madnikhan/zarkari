"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PRODUCTION_STAGES } from "@/lib/orders/status-machine";
import type { BridalOrder, OrderFile, TimelineEvent } from "@/lib/data/seed";
import { getStatusLabel } from "@/lib/orders/status-machine";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { CheckCircle } from "lucide-react";
import { CustomerOrderProgressTracker } from "@/components/customer/OrderProgressTracker";

type CargoCompany = { id: string; name: string };

interface Props {
  params: Promise<{ id: string }>;
}

export default function SupplierOrderPage({ params }: Props) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<BridalOrder | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [revertReason, setRevertReason] = useState("");
  const [showUndo, setShowUndo] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    billNumber: "",
    deliveryDate: new Date().toISOString().slice(0, 10),
    courierName: "",
    trackingNumber: "",
    manufacturingCostPkr: "",
    photoUrl: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<{ name: string; url: string }[]>([]);
  const [cargoCompanies, setCargoCompanies] = useState<CargoCompany[]>([]);

  useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id);
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data.order);
          setCustomerName(data.customerName);
          setFiles(data.files ?? []);
          setTimeline(data.timeline ?? []);
        });
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/cargo/companies")
      .then((r) => r.json())
      .then((d) => setCargoCompanies(d.companies ?? []))
      .catch(() => setCargoCompanies([]));
  }, []);

  async function action(type: string, body: Record<string, string> = {}) {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/supplier/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
      const data = await res.json();
      if (data.order) setOrder(data.order);
      if (data.timeline) setTimeline(data.timeline);
      if (data.files) setFiles(data.files);
      if (type === "accept") setAccepted(true);
      if (type === "complete") setShowComplete(false);
      if (type === "reject") setShowReject(false);
    } finally {
      setLoading(false);
    }
  }

  if (!order) return <p className="text-slate-400 p-8">Loading...</p>;

  const filesUnlocked = !!order.filesUnlockedAt;
  const canAccept = order.status === "sent_to_supplier";
  const currentStageIdx = PRODUCTION_STAGES.indexOf(order.status as (typeof PRODUCTION_STAGES)[number]);
  const nextStage =
    currentStageIdx >= 0 && currentStageIdx < PRODUCTION_STAGES.length - 1
      ? PRODUCTION_STAGES[currentStageIdx + 1]
      : null;
  const canComplete = order.status === "delivered_to_shop" || order.status === "shipping";
  const canUndo =
    !!order.lastSupplierActionAt &&
    Date.now() - new Date(order.lastSupplierActionAt).getTime() <= 24 * 60 * 60 * 1000 &&
    (order.status === "order_received" || currentStageIdx > 0);

  if (accepted) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Order Accepted</h1>
        <p className="text-sm text-slate-500 mb-6">You can now view order files and begin production.</p>
        <button type="button" onClick={() => setAccepted(false)} className="boms-btn-primary px-6 py-2.5 rounded-lg text-sm">
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <p className="font-mono text-xs text-[#4C3BCF] mb-1">{order.orderNumber}</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">{customerName}</h1>
      <StatusBadge status={order.status} className="mb-6" />

      <div className="boms-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Order Journey</h2>
        <CustomerOrderProgressTracker status={order.status} />
      </div>

      {canUndo && !canAccept && !order.supplierLocked && (
        <div className="mb-6">
          {!showUndo ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowUndo(true)}
              className="w-full py-3 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              Undo last step (within 24 hours)
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Reason for undo *"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setShowUndo(false)} className="py-2.5 border border-slate-200 rounded-lg text-sm">
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading || !revertReason.trim()}
                  onClick={() =>
                    action(order.status === "order_received" ? "revert-accept" : "revert-stage", { reason: revertReason })
                  }
                  className="py-2.5 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Confirm Undo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canAccept && (
        <div className="space-y-3 mb-8">
          <button type="button" disabled={loading} onClick={() => action("accept")} className="w-full py-3.5 boms-btn-primary rounded-lg text-sm font-medium">
            Accept Order
          </button>
          {!showReject ? (
            <button type="button" disabled={loading} onClick={() => setShowReject(true)} className="w-full py-3.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
              Reject Order
            </button>
          ) : (
            <div className="boms-card p-4 space-y-3">
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <button type="button" disabled={loading || !rejectReason.trim()} onClick={() => action("reject", { comment: rejectReason })} className="w-full py-3 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
                Confirm Reject
              </button>
            </div>
          )}
        </div>
      )}

      {filesUnlocked ? (
        <section className="boms-card p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Order Files</h2>
          <ul className="text-sm space-y-1">
            {files.map((f) => (
              <li key={f.id}>
                <a href={f.url} className="text-[#4C3BCF] hover:underline">{f.fileName}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : canAccept ? null : (
        <p className="text-sm text-slate-500 boms-card p-4 mb-6">Files unlock after you accept this order.</p>
      )}

      {filesUnlocked && !canComplete && order.status !== "ready_for_collection" && !order.supplierLocked && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Production Stages</h2>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTION_STAGES.map((stage, idx) => {
              const currentIdx = PRODUCTION_STAGES.indexOf(
                order.status as (typeof PRODUCTION_STAGES)[number]
              );
              const isDone = currentIdx > idx;
              const isCurrent = order.status === stage;
              const isNext = currentIdx >= 0 && idx === currentIdx + 1;
              const canClick = isNext && nextStage === stage;

              return (
                <button
                  key={stage}
                  type="button"
                  disabled={loading || !canClick}
                  onClick={() => canClick && action("advance", { stage })}
                  className={`py-2.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                    isDone
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : isCurrent
                        ? "bg-[#4C3BCF] text-white"
                        : canClick
                          ? "boms-btn-primary"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {getStatusLabel(stage)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {canComplete && !order.supplierLocked && (
        <>
          {!showComplete ? (
            <button type="button" disabled={loading} onClick={() => setShowComplete(true)} className="w-full py-3.5 mb-6 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Dispatched from Pakistan
            </button>
          ) : (
            <div className="boms-card p-6 mb-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Dispatched from Pakistan</h2>
              <input value={completeForm.billNumber} onChange={(e) => setCompleteForm({ ...completeForm, billNumber: e.target.value })} placeholder="Bill / Invoice number *" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
              <input type="date" value={completeForm.deliveryDate} onChange={(e) => setCompleteForm({ ...completeForm, deliveryDate: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              {cargoCompanies.length ? (
                <select
                  value={completeForm.courierName}
                  onChange={(e) => setCompleteForm({ ...completeForm, courierName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select cargo service *</option>
                  {cargoCompanies.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={completeForm.courierName}
                  onChange={(e) => setCompleteForm({ ...completeForm, courierName: e.target.value })}
                  placeholder="Cargo service name *"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              )}
              <input value={completeForm.trackingNumber} onChange={(e) => setCompleteForm({ ...completeForm, trackingNumber: e.target.value })} placeholder="Tracking number *" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
              <input
                type="number"
                step="0.01"
                min="0"
                value={completeForm.manufacturingCostPkr}
                onChange={(e) => setCompleteForm({ ...completeForm, manufacturingCostPkr: e.target.value })}
                placeholder="Manufacturing cost (PKR) *"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                required
              />
              <MediaUploadZone
                label="Upload final photos / videos"
                onUploaded={(files) => {
                  setUploadedPhotos(files);
                  setCompleteForm((f) => ({ ...f, photoUrl: files[0]?.url ?? "" }));
                }}
              />
              <button
                type="button"
                disabled={
                  loading ||
                  !completeForm.billNumber ||
                  !completeForm.courierName ||
                  !completeForm.trackingNumber ||
                  !completeForm.manufacturingCostPkr ||
                  !completeForm.photoUrl
                }
                onClick={() => action("complete", completeForm)}
                className="w-full py-3.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Mark as Dispatched
              </button>
            </div>
          )}
        </>
      )}

      <section className="boms-card p-6">
        <h2 className="text-sm font-semibold mb-4">Timeline</h2>
        <OrderTimeline events={timeline} />
      </section>
    </div>
  );
}
