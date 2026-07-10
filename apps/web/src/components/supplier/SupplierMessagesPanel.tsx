"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CustomerMessage } from "@/lib/data/seed";
import { MessageAttachment, MessageStatusBadge } from "@/components/orders/MessageAttachment";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface Props {
  orderId: string;
  initialMessages?: CustomerMessage[];
}

function mapDoc(orderId: string, doc: { id: string; data: () => Record<string, unknown> }): CustomerMessage {
  const data = doc.data();
  return {
    id: doc.id,
    orderId,
    senderType: data.senderType as CustomerMessage["senderType"],
    senderName: (data.senderName as string) ?? undefined,
    message: data.message as string,
    createdAt: data.createdAt as string,
    attachmentUrl: (data.attachmentUrl as string) ?? undefined,
    attachmentKind: (data.attachmentKind as string) ?? undefined,
    readAt: (data.readAt as string) ?? undefined,
    audience: "supplier",
  };
}

export function SupplierMessagesPanel({ orderId, initialMessages = [] }: Props) {
  const { ready } = useFirebaseAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current) {
      setMessages(initialMessages);
      seededRef.current = true;
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const q = query(
      collection(db, "live_orders", orderId, "supplier_messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const remote = snapshot.docs.map((doc) => mapDoc(orderId, doc));
      setMessages((prev) => {
        const remoteIds = new Set(remote.map((m) => m.id));
        const optimistic = prev.filter((m) => m.id.startsWith("local-") && !remoteIds.has(m.id));
        return [...remote, ...optimistic].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    });

    return () => unsub();
  }, [orderId, ready]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    const trimmed = message.trim();
    const localId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        orderId,
        senderType: "supplier",
        message: trimmed,
        audience: "supplier",
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${orderId}/supplier/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== localId));
      setMessage(trimmed);
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
