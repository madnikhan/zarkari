"use client";

import { useState } from "react";
import { MessageCircle, Copy, Send } from "lucide-react";
import { orderTrackingMessage, whatsAppUrl, getSiteUrl } from "@/lib/whatsapp";

interface Props {
  phone: string;
  customerName: string;
  orderNumber?: string;
  orderId?: string;
  className?: string;
}

export function WhatsAppButton({ phone, customerName, orderNumber, orderId, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");

  if (!phone?.trim()) return null;

  const siteUrl = getSiteUrl();
  const message = orderNumber
    ? orderTrackingMessage(customerName, orderNumber, siteUrl)
    : `Hi ${customerName}, this is ZARKARI.`;
  const href = whatsAppUrl(phone, message);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function resendViaApi() {
    if (!orderId) return;
    setResending(true);
    setResendNote("");
    try {
      const res = await fetch(`/api/orders/${orderId}/notify-customer`, { method: "POST" });
      const data = await res.json();
      if (data.sent) setResendNote("Sent via WhatsApp API");
      else if (data.skipped) setResendNote(data.error ?? "Auto-send skipped — use Open WhatsApp");
      else setResendNote(data.error ?? "Could not send");
    } catch {
      setResendNote("Could not send");
    } finally {
      setResending(false);
    }
  }

  const btnClass =
    className ??
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors";

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <MessageCircle className="h-4 w-4" />
        Open WhatsApp
      </a>
      <button
        type="button"
        onClick={() => void copyMessage()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copied!" : "Copy message"}
      </button>
      {orderId && (
        <button
          type="button"
          onClick={() => void resendViaApi()}
          disabled={resending}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-50 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {resending ? "Sending…" : "Send via API"}
        </button>
      )}
      {resendNote && <p className="w-full text-xs text-slate-500">{resendNote}</p>}
    </div>
  );
}
