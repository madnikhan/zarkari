"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Eye, ImageIcon, Loader2, Mic, Trash2, Video } from "lucide-react";
import { AudioPlayer } from "@/components/boms/AudioPlayer";
import { MediaPreviewModal } from "@/components/admin/content/MediaPreviewModal";
import { publicAssetUrl } from "@/lib/image-url";
import { getMediaKind, type MediaKind } from "@/lib/upload/mime";

export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType?: string;
  category?: string;
  createdAt: string;
}

interface Props {
  onSelect?: (url: string) => void;
  selectedUrls?: string[];
  selectable?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
  enablePreview?: boolean;
  emptyMessage?: string;
  refreshKey?: number;
  imagesOnly?: boolean;
  videosOnly?: boolean;
  typeFilter?: MediaKind | "all";
  categoryFilter?: string;
}

function kindBadge(kind: MediaKind) {
  if (kind === "video") {
    return (
      <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 flex items-center gap-1">
        <Video className="h-3 w-3 text-white" />
        <span className="text-[10px] text-white font-medium">Video</span>
      </div>
    );
  }
  if (kind === "audio") {
    return (
      <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 flex items-center gap-1">
        <Mic className="h-3 w-3 text-white" />
        <span className="text-[10px] text-white font-medium">Audio</span>
      </div>
    );
  }
  return null;
}

function ImageThumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <ImageIcon className="h-8 w-8 mb-1" />
        <span className="text-[10px]">Unavailable</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function MediaAssetGrid({
  onSelect,
  selectedUrls = [],
  selectable = false,
  showCopy = true,
  showDelete = false,
  enablePreview = false,
  emptyMessage = "No uploads yet.",
  refreshKey = 0,
  imagesOnly = false,
  videosOnly = false,
  typeFilter = "all",
  categoryFilter = "",
}: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (showDelete || enablePreview) params.set("includeCategories", "1");
      const qs = params.toString();
      const res = await fetch(`/api/media${qs ? `?${qs}` : ""}`);
      const text = await res.text();
      if (!text.trim()) {
        setAssets([]);
        return;
      }
      const data = JSON.parse(text) as { assets?: MediaAsset[] };
      setAssets(data.assets ?? []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, typeFilter, showDelete, enablePreview]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteAsset(asset: MediaAsset) {
    if (!confirm(`Delete "${asset.fileName}"? This cannot be undone.`)) return;
    setDeletingId(asset.id);
    try {
      const res = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Delete failed");
      }
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (previewAsset?.id === asset.id) setPreviewAsset(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSelect(asset: MediaAsset) {
    const kind = getMediaKind(asset.fileName, asset.mimeType, asset.category);
    if (imagesOnly && kind !== "image") return;
    if (videosOnly && kind !== "video") return;
    onSelect?.(asset.url);
  }

  function handleTileClick(asset: MediaAsset) {
    if (selectable) {
      handleSelect(asset);
      return;
    }
    if (enablePreview) {
      setPreviewAsset(asset);
    }
  }

  const visibleAssets = assets.filter((asset) => {
    const kind = getMediaKind(asset.fileName, asset.mimeType, asset.category);
    if (imagesOnly) return kind === "image";
    if (videosOnly) return kind === "video";
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (visibleAssets.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleAssets.map((asset) => {
          const selected = selectedUrls.includes(asset.url);
          const src = publicAssetUrl(asset.url) ?? asset.url;
          const kind = getMediaKind(asset.fileName, asset.mimeType, asset.category);
          const isDeleting = deletingId === asset.id;

          return (
            <div
              key={asset.id}
              className={`boms-card overflow-hidden group relative ${selectable || enablePreview ? "cursor-pointer" : ""} ${
                selected ? "ring-2 ring-[#4C3BCF]" : ""
              } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => handleTileClick(asset)}
              onKeyDown={
                selectable || enablePreview
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTileClick(asset);
                      }
                    }
                  : undefined
              }
              role={selectable || enablePreview ? "button" : undefined}
              tabIndex={selectable || enablePreview ? 0 : undefined}
            >
              <div className="relative aspect-square bg-slate-100">
                {kind === "video" && (
                  <video src={src} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                )}
                {kind === "audio" && (
                  <div className="flex flex-col items-center justify-center h-full p-2 gap-1">
                    <Mic className="h-6 w-6 text-[#4C3BCF]" />
                    <AudioPlayer src={src} mimeType={asset.mimeType} className="w-full h-8 pointer-events-none" />
                  </div>
                )}
                {kind === "image" && <ImageThumb src={src} alt={asset.fileName} />}
                {kindBadge(kind)}
                {selected && (
                  <div className="absolute inset-0 bg-[#4C3BCF]/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-white drop-shadow" />
                  </div>
                )}
                {(enablePreview || showDelete) && !selectable && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {enablePreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewAsset(asset);
                        }}
                        className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                        aria-label="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {showDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteAsset(asset);
                        }}
                        className="p-1 rounded-full bg-black/50 text-white hover:bg-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-slate-600 truncate" title={asset.fileName}>
                  {asset.fileName}
                </p>
                {asset.category && (
                  <p className="text-[10px] text-slate-400 truncate capitalize">{asset.category}</p>
                )}
                {showCopy && !selectable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyUrl(asset.url);
                    }}
                    className="mt-1 flex items-center gap-1 text-xs text-[#4C3BCF] hover:underline"
                  >
                    {copied === asset.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === asset.url ? "Copied" : "Copy URL"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MediaPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
      />
    </>
  );
}
