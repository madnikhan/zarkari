"use client";

import { useState } from "react";
import type { CustomerMessage } from "@/lib/data/seed";
import { MessageAttachment, MessageStatusBadge } from "@/components/orders/MessageAttachment";

interface Props {
  orderId: string;
  initialMessages?: CustomerMessage[];
}

export function SupplierMessagesPanel({ orderId, initialMessages = [] }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/supplier/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          orderId,
          senderType: "supplier",
          message: message.trim(),
          audience: "supplier",
          createdAt: new Date().toISOString(),
        },
      ]);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="boms-card p-4 mb-6">
      <h2 className="text-sm font-semibold mb-1">Messages from ZARKARI</h2>
      <p className="text-xs text-slate-500 mb-3">Reply here — shop staff will see your message.</p>
      {messages.length === 0 ? (
        <p className="text-sm text-slate-400 mb-3">No messages yet.</p>
      ) : (
        <ul className="space-y-2 mb-3 max-h-56 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.senderType === "supplier" ? "bg-[#F4F3FF] ml-4" : "bg-slate-50 mr-4"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {m.senderType === "supplier" ? "You" : "ZARKARI"}
                </span>
                {m.senderType === "staff" && <MessageStatusBadge message={m} />}
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
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Reply to ZARKARI…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full py-2.5 boms-btn-primary rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reply"}
        </button>
      </form>
    </section>
  );
}
