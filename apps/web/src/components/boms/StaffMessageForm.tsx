"use client";

import { useState } from "react";
import type { CustomerMessage } from "@/lib/data/seed";
import { MessageAttachment, MessageStatusBadge } from "@/components/orders/MessageAttachment";

interface Props {
  orderId: string;
  audience: "customer" | "supplier";
  title: string;
  placeholder: string;
  successHint: string;
  messages: CustomerMessage[];
  showStatus?: boolean;
}

export function OrderMessageThread({
  orderId,
  audience,
  title,
  placeholder,
  successHint,
  messages,
  showStatus = false,
}: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/orders/${orderId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), audience }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setMessage("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">{title}</h3>
      {messages.length > 0 && (
        <ul className="space-y-2 mb-3 text-sm max-h-48 overflow-y-auto">
          {messages.map((m) => (
            <li key={m.id} className="bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-slate-400 capitalize">
                  {m.senderType === "staff" ? "ZARKARI" : m.senderType}
                  {m.senderName ? ` · ${m.senderName}` : ""}
                </span>
                {showStatus && <MessageStatusBadge message={m} />}
              </div>
              <p>{m.message}</p>
              <MessageAttachment message={m} />
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSuccess(false);
          }}
          rows={2}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{successHint}</p>}
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
