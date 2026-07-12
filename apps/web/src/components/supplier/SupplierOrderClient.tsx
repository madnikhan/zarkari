"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRODUCTION_STAGES } from "@/lib/orders/status-machine";
import type { BridalOrder, BridalStatus, OrderFile, TimelineEvent } from "@/lib/data/seed";
import type { BridalOrderWithRelations } from "@/lib/data";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderStatusLive } from "@/components/orders/OrderStatusLive";
import { ProductionStageStepper } from "@/components/supplier/ProductionStageStepper";
import { SupplierOtherOrders } from "@/components/supplier/SupplierOtherOrders";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { OrderFileGallery } from "@/components/orders/OrderFileGallery";
import { SupplierMessagesPanel } from "@/components/supplier/SupplierMessagesPanel";
import type { CustomerMessage } from "@/lib/data/seed";
import { CheckCircle } from "lucide-react";
import { CustomerOrderProgressTracker } from "@/components/customer/OrderProgressTracker";
import { MeasurementsReadOnly } from "@/components/orders/MeasurementsReadOnly";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type CargoCompany = { id: string; name: string };

interface Props {
  initialOrder: BridalOrder;
  customerName: string;
  initialFiles: OrderFile[];
  initialMessages: CustomerMessage[];
  initialTimeline: TimelineEvent[];
  otherOrders: BridalOrderWithRelations[];
}

export function SupplierOrderClient({
  initialOrder,
  customerName: initialCustomerName,
  initialFiles,
  initialMessages,
  initialTimeline,
  otherOrders,
}: Props) {
  const { ready } = useFirebaseAuth();
  const orderId = initialOrder.id;
  const [order, setOrder] = useState<BridalOrder>(initialOrder);
  const [customerName] = useState(initialCustomerName);
  const [files, setFiles] = useState(initialFiles);
  const [supplierMessages] = useState(initialMessages);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [loading, setLoading] = useState(false);
  const [stageLoading, setStageLoading] = useState(false);
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
  const [progressNote, setProgressNote] = useState("");
  const [progressUploading, setProgressUploading] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [progressSuccess, setProgressSuccess] = useState(false);
  const [cargoCompanies, setCargoCompanies] = useState<CargoCompany[]>([]);

  useEffect(() => {
    void fetch(`/api/orders/${orderId}/supplier/message`).catch(() => {});
  }, [orderId]);

  useEffect(() => {
    fetch("/api/cargo/companies")
      .then((r) => r.json())
      .then((d) => setCargoCompanies(d.companies ?? []))
      .catch(() => setCargoCompanies([]));
  }, []);

  useEffect(() => {
    if (!orderId || !ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const unsub = onSnapshot(doc(db, "live_orders", orderId), (snapshot) => {
      const data = snapshot.data();
      if (data?.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status as BridalStatus } : prev));
      }
    });

    return () => unsub();
  }, [orderId, ready]);

  async function action(type: string, body: Record<string, string> = {}) {
    if (!orderId) return;
    const isAdvance = type === "advance";
    if (isAdvance) setStageLoading(true);
    else setLoading(true);

    const prevOrder = order;
    if (isAdvance && body.stage && order) {
      setOrder({ ...order, status: body.stage as BridalStatus });
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/supplier/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (isAdvance && prevOrder) setOrder(prevOrder);
        return;
      }
      if (data.order) setOrder(data.order);
      if (data.timeline) setTimeline(data.timeline);
      if (data.files) setFiles(data.files);
      if (type === "accept") setAccepted(true);
      if (type === "complete") setShowComplete(false);
      if (type === "reject") setShowReject(false);
    } catch {
      if (isAdvance && prevOrder) setOrder(prevOrder);
    } finally {
      if (isAdvance) setStageLoading(false);
      else setLoading(false);
    }
  }

  async function submitProgress(file: { url: string; name: string; mediaType?: string }) {
    if (!orderId) return;
    setProgressUploading(true);
    setProgressError("");
    setProgressSuccess(false);
    try {
      const mimeType =
        file.mediaType === "video"
          ? "video/mp4"
          : file.mediaType === "audio"
            ? "audio/mp4"
            : "image/jpeg";
      const res = await fetch(`/api/orders/${orderId}/supplier/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: file.url,
          fileName: file.name,
          mimeType,
          message: progressNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setProgressNote("");
      setProgressSuccess(true);
    } catch (err) {
      setProgressError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgressUploading(false);
    }
  }

  const filesUnlocked = !!order.filesUnlockedAt;
  const filesVisible = true; // suppliers can view design/measurement files before accept
  const productionUnlocked = filesUnlocked;
  const canAccept = order.status === "sent_to_supplier";
  const currentStageIdx = PRODUCTION_STAGES.indexOf(order.status as (typeof PRODUCTION_STAGES)[number]);
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
        <p className="text-sm text-slate-500 mb-6">You can now begin production stages.</p>
        <button type="button" onClick={() => setAccepted(false)} className="boms-btn-primary px-6 py-2.5 rounded-lg text-sm">
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <Link href="/supplier" className="inline-flex text-sm text-[#4C3BCF] hover:underline mb-4">
        ← All orders
      </Link>
      <p className="font-mono text-xs text-[#4C3BCF] mb-1">{order.orderNumber}</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">{customerName}</h1>
      <OrderStatusLive orderId={order.id} initialStatus={order.status} className="mb-6" />

      <div className="boms-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Order Journey</h2>
        <CustomerOrderProgressTracker status={order.status} />
      </div>

      <div className="mb-6">
        <MeasurementsReadOnly measurements={order.measurements} showEmpty />
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

      {filesVisible ? (
        <section className="boms-card p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Order Files</h2>
          <p className="text-xs text-slate-500 mb-3">Tap a thumbnail to view the full image or video.</p>
          {files.length ? (
            <OrderFileGallery files={files} columns={2} />
          ) : (
            <p className="text-sm text-slate-500">No design or measurement files attached yet.</p>
          )}
        </section>
      ) : null}

      {productionUnlocked && (
        <SupplierMessagesPanel orderId={order.id} initialMessages={supplierMessages} />
      )}

      {productionUnlocked && !canComplete && order.status !== "ready_for_collection" && !order.supplierLocked && (
        <section className="boms-card p-4 mb-6">
          <h2 className="text-sm font-semibold mb-1">Send progress update</h2>
          <p className="text-xs text-slate-500 mb-3">
            Upload a photo or video so ZARKARI can share progress with the customer.
          </p>
          <textarea
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
            rows={2}
            placeholder="Optional note about this update…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 resize-none"
          />
          <MediaUploadZone
            label="Upload progress photo or video"
            category="supplier-progress"
            accept="image/*,video/*,.mov,.mp4"
            onSingleUploaded={(file) => void submitProgress(file)}
          />
          {progressUploading && <p className="text-xs text-slate-500 mt-2">Sending to ZARKARI…</p>}
          {progressError && <p className="text-xs text-red-600 mt-2">{progressError}</p>}
          {progressSuccess && (
            <p className="text-xs text-emerald-600 mt-2">Update sent — ZARKARI will review before sharing with customer.</p>
          )}
        </section>
      )}

      {productionUnlocked && !canComplete && order.status !== "ready_for_collection" && !order.supplierLocked && (
        <section className="boms-card p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Production Stages</h2>
          <ProductionStageStepper
            status={order.status}
            loading={stageLoading}
            onAdvance={(stage) => action("advance", { stage })}
          />
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

      <section className="boms-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Timeline</h2>
        <OrderTimeline events={timeline} />
      </section>

      <SupplierOtherOrders orders={otherOrders} currentOrderId={order.id} />
    </div>
  );
}
