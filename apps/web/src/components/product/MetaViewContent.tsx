"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaViewContent({ productId, title, price }: { productId: string; title: string; price: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_ids: [productId],
        content_name: title,
        content_type: "product",
        value: parseFloat(price),
        currency: "GBP",
      });
    }
  }, [productId, title, price]);

  return null;
}
