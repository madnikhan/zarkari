"use client";

import { useEffect, useState } from "react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { MediaAssetGrid } from "@/components/admin/content/MediaAssetGrid";
import type { MediaKind } from "@/lib/upload/mime";

const CMS_ACCEPT = "image/*,video/*,.mov";
const CMS_HINT = "Images up to 4 MB · Videos up to 10 min / 200 MB";

const TYPE_TABS: { id: MediaKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
];

const DEFAULT_CATEGORIES = ["cms", "order-voice", "general", "supplier-completion", "audit"];

export function MediaLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<MediaKind | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/api/media?includeCategories=1")
      .then((r) => r.json())
      .then((data: { categories?: string[] }) => {
        const fromApi = data.categories ?? [];
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...fromApi])).sort();
        setCategories(merged);
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Upload images and videos once, then pick them when editing products, collections, or blog posts.
        Click any item to preview; use filters to find content by type or category.
      </p>
      <MediaUploadZone
        label="Upload images or videos for products, collections, or blog"
        accept={CMS_ACCEPT}
        category="cms"
        sizeHint={CMS_HINT}
        onUploaded={() => setRefreshKey((k) => k + 1)}
        onSingleUploaded={() => setRefreshKey((k) => k + 1)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === tab.id
                  ? "bg-[#4C3BCF] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <MediaAssetGrid
        refreshKey={refreshKey}
        showCopy
        showDelete
        enablePreview
        typeFilter={typeFilter}
        categoryFilter={categoryFilter}
        emptyMessage="No media matches these filters."
      />
    </div>
  );
}
