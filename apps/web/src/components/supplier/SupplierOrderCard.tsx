"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { BomsActionButton } from "@/components/boms/BomsActionButton";
import { formatPrice } from "@/lib/utils";

interface Props {
  orderId: string;
  orderNumber: string;
  customerName: string;
  dressType?: string;
  totalPrice: string;
  deliveryDate: string;
  status: string;
}

export function SupplierOrderCard({
  orderId,
  orderNumber,
  customerName,
  dressType,
  totalPrice,
  deliveryDate,
  status,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function action(type: "accept" | "reject") {
    setLoading(type);
    try {
      const body = type === "reject" ? { comment: rejectReason } : {};
      const res = await fetch(`/api/orders/${orderId}/supplier/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (type === "accept") {
          router.push(`/supplier/orders/${orderId}?accepted=1`);
        } else {
          router.refresh();
        }
      }
    } finally {
      setLoading(null);
    }
  }

  const isPending = status === "sent_to_supplier";

  return (
    <div className="boms-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-sm font-semibold text-[#4C3BCF]">{orderNumber}</p>
          <p className="font-medium text-slate-900 mt-1">{customerName}</p>
          {dressType && <p className="text-sm text-slate-500">{dressType}</p>}
        </div>
        <div className="text-right">
          <CountdownBadge deliveryDate={deliveryDate} />
          <p className="text-base font-semibold text-slate-900 mt-2">{formatPrice(totalPrice)}</p>
        </div>
      </div>

      {isPending ? (
        showReject ? (
          <div className="space-y-3 mt-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <BomsActionButton color="slate" onClick={() => setShowReject(false)}>Back</BomsActionButton>
              <BomsActionButton
                color="red"
                disabled={!rejectReason.trim() || loading === "reject"}
                onClick={() => action("reject")}
              >
                Confirm Reject
              </BomsActionButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <BomsActionButton color="green" disabled={loading === "accept"} onClick={() => action("accept")}>
              {loading === "accept" ? "Accepting…" : "Accept Order"}
            </BomsActionButton>
            <BomsActionButton color="red" disabled={!!loading} onClick={() => setShowReject(true)}>
              Reject Order
            </BomsActionButton>
          </div>
        )
      ) : (
        <Link
          href={`/supplier/orders/${orderId}`}
          className="block text-center text-sm text-[#4C3BCF] font-medium mt-3 hover:underline"
        >
          View Order Details →
        </Link>
      )}
    </div>
  );
}
