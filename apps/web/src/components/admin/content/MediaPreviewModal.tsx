"use client";

import { Copy, Check, X } from "lucide-react";
import { useState } from "react";
import { AudioPlayer } from "@/components/boms/AudioPlayer";
import { publicAssetUrl } from "@/lib/image-url";
import { getMediaKind, type MediaKind } from "@/lib/upload/mime";
import type { MediaAsset } from "@/components/admin/content/MediaAssetGrid";

interface Props {
  asset: MediaAsset | null;
  open: boolean;
  onClose: () => void;
}

function kindLabel(kind: MediaKind): string {
  if (kind === "video") return "Video";
  if (kind === "audio") return "Audio";
  return "Image";
}

export function MediaPreviewModal({ asset, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open || !asset) return null;

  const src = publicAssetUrl(asset.url) ?? asset.url;
  const kind = getMediaKind(asset.fileName, asset.mimeType, asset.category);
  const created = new Date(asset.createdAt).toLocaleString();

  async function copyUrl() {
    await navigator.clipboard.writeText(asset!.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-xl sm:rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">{asset.fileName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {kindLabel(kind)}
              {asset.category && ` · ${asset.category}`} · {created}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 shrink-0" aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center min-h-[200px]">
            {kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={asset.fileName} className="max-w-full max-h-[60vh] object-contain" />
            )}
            {kind === "video" && (
              <video src={src} controls playsInline preload="metadata" className="max-w-full max-h-[60vh] w-full" />
            )}
            {kind === "audio" && (
              <div className="w-full p-6">
                <AudioPlayer src={src} mimeType={asset.mimeType} className="w-full h-10" label={asset.fileName} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void copyUrl()}
            className="inline-flex items-center gap-2 text-sm text-[#4C3BCF] hover:underline"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied URL" : "Copy URL"}
          </button>
        </div>
      </div>
    </div>
  );
}
