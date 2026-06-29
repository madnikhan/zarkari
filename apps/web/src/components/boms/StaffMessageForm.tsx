"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  senderName?: string;
}

export function StaffMessageForm({ orderId, senderName }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send");
      }
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-slate-100">
      <label className="text-xs font-medium text-slate-500 uppercase">Staff message to customer</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        placeholder="Note for customer (visible on my-order portal)"
        className="w-full mt-2 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="mt-2 boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
