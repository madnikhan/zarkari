"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import type { SocialMessage, SocialThread } from "@/lib/social-inbox/types";
import { isManualPlatform } from "@/lib/social-inbox/types";
import { PlatformBadge, ThreadStatusBadge } from "./PlatformBadge";
import { cn } from "@/lib/utils";

interface InboxThreadViewProps {
  thread: SocialThread;
  messages: SocialMessage[];
}

export function InboxThreadView({ thread, messages: initialMessages }: InboxThreadViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState(thread.status);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState("");

  const contactLabel =
    thread.contactName ??
    thread.contactHandle ??
    thread.contactPhone ??
    "Unknown contact";

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    setError("");
    setNote(null);
    try {
      const res = await fetch(`/api/inbox/${thread.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setMessages((prev) => [...prev, data.message]);
      setReply("");
      setStatus("replied");
      if (data.note) setNote(data.note);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(next: string) {
    const res = await fetch(`/api/inbox/${thread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next as typeof status);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/admin/inbox"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{contactLabel}</h1>
            <PlatformBadge platform={thread.platform} />
            <ThreadStatusBadge status={status} />
          </div>
          {thread.contactHandle && thread.contactName && (
            <p className="text-sm text-slate-500">{thread.contactHandle}</p>
          )}
          {thread.subject && <p className="text-sm text-slate-500 truncate">{thread.subject}</p>}
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-600"
        >
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="boms-card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.direction === "inbound"
                  ? "bg-slate-100 text-slate-800 mr-auto"
                  : "bg-[#4C3BCF] text-white ml-auto"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.body}</p>
              <p
                className={cn(
                  "text-[10px] mt-1",
                  msg.direction === "inbound" ? "text-slate-400" : "text-white/70"
                )}
              >
                {new Date(msg.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="border-t border-slate-100 p-4">
          {isManualPlatform(thread.platform) && (
            <p className="text-xs text-slate-500 mb-2">
              Replies are logged here for your records. Respond to the customer on{" "}
              {thread.platform === "tiktok" ? "TikTok" : "the native app"} directly.
            </p>
          )}
          {note && <p className="text-xs text-amber-700 mb-2">{note}</p>}
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              placeholder="Type your reply…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <button
              type="submit"
              disabled={loading || !reply.trim()}
              className="boms-btn-primary px-4 rounded-lg flex items-center gap-1.5 text-sm self-end disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
