"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2, Video } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/content/MediaPickerModal";
import {
  heroClipLabel,
  isHeroMediaUrl,
  parseHeroVideos,
  serializeHeroVideos,
  type HeroVideoClip,
} from "@/lib/data/hero-videos";
import { HERO_MEDIA_CATEGORY } from "@/lib/upload/constants";

interface Settings {
  announcement?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroVideos?: string;
  featuredCollectionHandle?: string;
  featuredProductHandles?: string;
}

export function HomepageEditor({ initial, isOwner = true }: { initial: Settings; isOwner?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [heroClips, setHeroClips] = useState<HeroVideoClip[]>(() =>
    parseHeroVideos(initial.heroVideos).map((clip) => ({
      url: clip.src,
      poster: clip.poster,
    }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
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
        body: JSON.stringify({
          ...form,
          heroVideos: serializeHeroVideos(heroClips),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function moveClip(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= heroClips.length) return;
    setHeroClips((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removeClip(index: number) {
    setHeroClips((prev) => prev.filter((_, i) => i !== index));
  }

  function addClips(urls: string[]) {
    const heroOnly = urls.filter((url) => isHeroMediaUrl(url));
    setHeroClips((prev) => {
      const existing = new Set(prev.map((clip) => clip.url));
      const additions = heroOnly
        .filter((url) => !existing.has(url))
        .map((url) => ({ url }));
      return [...prev, ...additions];
    });
  }

  const fields: { key: keyof Settings; label: string; hint?: string }[] = [
    { key: "announcement", label: "Top bar announcement" },
    { key: "heroHeadline", label: "Hero headline", hint: "Shown on homepage video hero" },
    { key: "heroSubheadline", label: "Hero subheadline" },
    { key: "featuredCollectionHandle", label: "Featured collection handle", hint: "Optional — collection handle for homepage" },
    { key: "featuredProductHandles", label: "Featured product handles", hint: "Comma-separated product handles" },
  ];

  return (
    <>
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

        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs text-slate-500 uppercase">Hero videos</label>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            Pick clips from the{" "}
            <Link href="/admin/content/hero" className="text-[#4C3BCF] hover:underline">
              Hero Media
            </Link>{" "}
            folder only (<code className="text-[10px]">uploads/hero/</code>). They autoplay muted and
            rotate on the homepage. H.264 MP4 works best on all devices.
          </p>

          {heroClips.length > 0 ? (
            <ul className="space-y-2 mb-3">
              {heroClips.map((clip, index) => (
                <li
                  key={`${clip.url}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <Video className="h-4 w-4 shrink-0 text-[#4C3BCF]" />
                  <span className="flex-1 text-sm text-slate-700 truncate" title={clip.url}>
                    {heroClipLabel(clip.url)}
                    {!isHeroMediaUrl(clip.url) && (
                      <span className="ml-2 text-xs text-amber-600">(not in hero folder)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={!isOwner || index === 0}
                      onClick={() => moveClip(index, -1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      disabled={!isOwner || index === heroClips.length - 1}
                      onClick={() => moveClip(index, 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      disabled={!isOwner}
                      onClick={() => removeClip(index)}
                      className="p-1 rounded hover:bg-red-50 disabled:opacity-30"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 mb-3">No hero videos selected — homepage shows text over a dark background.</p>
          )}

          <button
            type="button"
            disabled={!isOwner}
            onClick={() => setPickerOpen(true)}
            className="text-sm font-medium text-[#4C3BCF] hover:underline disabled:opacity-50"
          >
            Add from hero library
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Homepage saved — live site updates immediately.</p>}
        <button type="submit" disabled={loading || !isOwner} className="boms-btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50">
          {loading ? "Saving…" : "Save homepage"}
        </button>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => addClips([url])}
        onSelectMultiple={addClips}
        multiple
        videosOnly
        uploadCategory={HERO_MEDIA_CATEGORY}
        categoryFilter={HERO_MEDIA_CATEGORY}
        title="Choose hero videos"
      />
    </>
  );
}
