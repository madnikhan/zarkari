"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  announcement?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  featuredCollectionHandle?: string;
  featuredProductHandles?: string;
}

export function HomepageEditor({ initial, isOwner = true }: { initial: Settings; isOwner?: boolean }) {
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

  const fields: { key: keyof Settings; label: string; hint?: string }[] = [
    { key: "announcement", label: "Top bar announcement" },
    { key: "heroHeadline", label: "Hero headline", hint: "Shown on homepage video hero" },
    { key: "heroSubheadline", label: "Hero subheadline" },
    { key: "featuredCollectionHandle", label: "Featured collection handle", hint: "Optional — collection handle for homepage" },
    { key: "featuredProductHandles", label: "Featured product handles", hint: "Comma-separated product handles" },
  ];

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-4 max-w-xl">
      {fields.map(({ key, label, hint }) => (
        <div key={key}>
          <label className="text-xs text-slate-500 uppercase">{label}</label>
          <input
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Homepage saved — live site updates immediately.</p>}
      <button type="submit" disabled={loading || !isOwner} className="boms-btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50">
        {loading ? "Saving…" : "Save homepage"}
      </button>
    </form>
  );
}
