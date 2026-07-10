"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { MediaAssetGrid } from "@/components/admin/content/MediaAssetGrid";

const CMS_ACCEPT = "image/*,video/*,.mov";
const CMS_HINT = "Images up to 4 MB · Videos up to 10 min / 200 MB";
const VIDEO_ACCEPT = "video/*,.mov,.mp4,.webm";
const VIDEO_HINT = "Videos up to 10 min / 200 MB · H.264 MP4 recommended";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  multiple?: boolean;
  onSelectMultiple?: (urls: string[]) => void;
  title?: string;
  imagesOnly?: boolean;
  videosOnly?: boolean;
  uploadCategory?: string;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  onSelectMultiple,
  title = "Choose image",
  imagesOnly = false,
  videosOnly = false,
  uploadCategory = "cms",
}: Props) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pending, setPending] = useState<string[]>([]);

  if (!open) return null;

  function handleSelect(url: string) {
    if (multiple) {
      setPending((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
      return;
    }
    onSelect(url);
    onClose();
    setPending([]);
  }

  function confirmMultiple() {
    if (pending.length) {
      onSelectMultiple?.(pending);
    }
    onClose();
    setPending([]);
  }

  function handleUploaded(files: { url: string }[]) {
    const latest = files[files.length - 1];
    if (!latest) return;
    setRefreshKey((k) => k + 1);
    if (multiple) {
      setPending((prev) => (prev.includes(latest.url) ? prev : [...prev, latest.url]));
      setTab("library");
    } else {
      onSelect(latest.url);
      onClose();
    }
  }

  function handleSingleUploaded(file: { url: string }) {
    setRefreshKey((k) => k + 1);
    if (multiple) {
      setPending((prev) => (prev.includes(file.url) ? prev : [...prev, file.url]));
      setTab("library");
    } else {
      onSelect(file.url);
      onClose();
    }
  }

  const uploadLabel = imagesOnly
    ? "Upload images for products, collections, or blog"
    : videosOnly
      ? "Upload hero videos"
      : "Upload images or videos for products, collections, or blog";

  const uploadAccept = imagesOnly ? "image/*" : videosOnly ? VIDEO_ACCEPT : CMS_ACCEPT;
  const uploadHint = imagesOnly ? "Images up to 4 MB" : videosOnly ? VIDEO_HINT : CMS_HINT;
  const emptyMessage = imagesOnly
    ? "No images yet. Switch to Upload to add one."
    : videosOnly
      ? "No videos yet. Switch to Upload to add one."
      : "No media yet. Switch to Upload to add one.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl max-h-[90vh] sm:rounded-xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {(["library", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize ${
                tab === t ? "text-[#4C3BCF] border-b-2 border-[#4C3BCF]" : "text-slate-500"
              }`}
            >
              {t === "library" ? "Media library" : "Upload new"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "upload" ? (
            <MediaUploadZone
              label={uploadLabel}
              accept={uploadAccept}
              category={uploadCategory}
              sizeHint={uploadHint}
              onUploaded={handleUploaded}
              onSingleUploaded={handleSingleUploaded}
            />
          ) : (
            <MediaAssetGrid
              selectable
              selectedUrls={pending}
              onSelect={handleSelect}
              refreshKey={refreshKey}
              showCopy={false}
              imagesOnly={imagesOnly}
              videosOnly={videosOnly}
              typeFilter={videosOnly ? "video" : imagesOnly ? "image" : "all"}
              emptyMessage={emptyMessage}
            />
          )}
        </div>

        {multiple && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{pending.length} selected</span>
            <button
              type="button"
              disabled={!pending.length}
              onClick={confirmMultiple}
              className="boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Add selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
