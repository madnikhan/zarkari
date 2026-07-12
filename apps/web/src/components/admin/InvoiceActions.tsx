"use client";

import { useState } from "react";
import { Download, Printer, MessageCircle } from "lucide-react";
import { whatsAppUrl } from "@/lib/whatsapp";
import type { InvoiceKind } from "@/lib/invoices/invoice-token";

interface Props {
  kind: InvoiceKind;
  orderId: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  className?: string;
  /** Compact buttons for dense headers */
  size?: "sm" | "md";
}

export function InvoiceActions({
  kind,
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  className = "",
  size = "md",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const btn =
    size === "sm"
      ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border"
      : "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border";

  const staffInvoicePath = `/api/invoices/${kind}/${orderId}`;

  async function getShareUrl(): Promise<string> {
    const res = await fetch(`/api/invoices/share?kind=${kind}&id=${encodeURIComponent(orderId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create share link");
    return data.url as string;
  }

  function openInvoice() {
    window.open(staffInvoicePath, "_blank", "noopener,noreferrer");
  }

  function printInvoice() {
    const w = window.open(staffInvoicePath, "_blank", "noopener,noreferrer");
    if (!w) {
      setError("Allow pop-ups to print the invoice.");
      return;
    }
    const tryPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* wait for load */
      }
    };
    w.addEventListener("load", () => setTimeout(tryPrint, 300));
    setTimeout(tryPrint, 800);
  }

  async function shareWhatsApp() {
    if (!customerPhone?.trim()) {
      setError("Add a customer phone number to send on WhatsApp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const shareUrl = await getShareUrl();
      const name = customerName?.trim() || "there";
      const message = `Hi ${name},

Thank you for shopping at Zarkari.

Your invoice for order ${orderNumber}:
${shareUrl}

438-A Stratford Road, B11 4AD Birmingham UK
+44 7863 176321
https://zarkari.co.uk`;
      window.open(whatsAppUrl(customerPhone, message), "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WhatsApp share failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openInvoice}
          className={`${btn} border-[#4C3BCF] text-[#4C3BCF] hover:bg-[#F4F3FF]`}
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
        <button
          type="button"
          onClick={printInvoice}
          className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`}
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
        <button
          type="button"
          onClick={() => void shareWhatsApp()}
          disabled={busy}
          className={`${btn} border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> {busy ? "Preparing…" : "WhatsApp"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
