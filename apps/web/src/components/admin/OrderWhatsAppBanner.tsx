"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BannerInner() {
  const params = useSearchParams();
  const wa = params.get("wa");
  if (!wa) return null;

  if (wa === "sent") {
    return (
      <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
        Order tracking link sent to customer on WhatsApp.
      </p>
    );
  }

  return (
    <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      WhatsApp auto-send: {decodeURIComponent(wa)} — use Open WhatsApp or Copy message below.
    </p>
  );
}

export function OrderWhatsAppBanner() {
  return (
    <Suspense>
      <BannerInner />
    </Suspense>
  );
}
