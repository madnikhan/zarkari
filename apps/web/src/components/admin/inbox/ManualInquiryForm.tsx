"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { MANUAL_PLATFORMS, SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social-inbox/types";

interface ManualInquiryFormProps {
  open: boolean;
  onClose: () => void;
}

export function ManualInquiryForm({ open, onClose }: ManualInquiryFormProps) {
  const router = useRouter();
  const [platform, setPlatform] = useState<SocialPlatform>("tiktok");
  const [contactName, setContactName] = useState("");
  const [contactHandle, setContactHandle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inbox/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          contactName: contactName || undefined,
          contactHandle: contactHandle || undefined,
          contactPhone: contactPhone || undefined,
          subject: subject || undefined,
          message,
          sourceUrl: sourceUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log inquiry");
      onClose();
      router.push(`/admin/inbox/${data.thread.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Log inquiry</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {MANUAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {SOCIAL_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Handle / URL</label>
              <input
                value={contactHandle}
                onChange={(e) => setContactHandle(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="@handle or profile link"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phone (optional)</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="+44..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. TikTok comment on Guldaan video"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Source URL (optional)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="https://tiktok.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="What did the customer ask?"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="boms-btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Saving…" : "Log inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
