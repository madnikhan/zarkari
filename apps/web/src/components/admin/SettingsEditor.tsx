"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  announcement?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
}

export function SettingsEditor({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-4">
      <div>
        <label className="text-xs text-slate-500 uppercase">Shop Announcement</label>
        <input
          value={form.announcement ?? ""}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 uppercase">Hero Headline</label>
        <input
          value={form.heroHeadline ?? ""}
          onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 uppercase">Hero Subheadline</label>
        <input
          value={form.heroSubheadline ?? ""}
          onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 uppercase">WhatsApp Number</label>
        <p className="mt-1 text-sm font-mono text-slate-600">
          {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "Set NEXT_PUBLIC_WHATSAPP_NUMBER in env"}
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Settings saved.</p>}
      <button type="submit" disabled={loading} className="boms-btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50">
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
