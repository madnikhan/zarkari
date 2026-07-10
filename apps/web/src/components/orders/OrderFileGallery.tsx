"use client";

import { useState } from "react";
import { FileText, Play, X } from "lucide-react";
import { AudioPlayer } from "@/components/boms/AudioPlayer";
import type { OrderFile } from "@/lib/data/seed";
import { publicAssetUrl } from "@/lib/image-url";
import { getMediaKind } from "@/lib/upload/mime";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  measurements: "Measurements",
  voice: "Voice",
  completion: "Completion",
  supplier_progress: "Progress update",
  "supplier-progress": "Progress update",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

interface Props {
  files: OrderFile[];
  groupByCategory?: boolean;
  emptyMessage?: string;
  columns?: 2 | 3;
}

export function OrderFileGallery({
  files,
  groupByCategory = true,
  emptyMessage = "No files yet.",
  columns = 3,
}: Props) {
  const [preview, setPreview] = useState<OrderFile | null>(null);

  if (!files.length) {
    return <p className="text-sm text-slate-400">{emptyMessage}</p>;
  }

  const grouped = groupByCategory
    ? files.reduce<Record<string, OrderFile[]>>((acc, file) => {
        const key = file.category || "other";
        acc[key] = acc[key] ? [...acc[key], file] : [file];
        return acc;
      }, {})
    : { all: files };

  const gridClass = columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <>
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            {groupByCategory && (
              <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                {categoryLabel(category)}
              </h4>
            )}
            <div className={cn("grid gap-2", gridClass)}>
              {items.map((file) => (
                <FileTile key={file.id} file={file} onOpen={() => setPreview(file)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-medium text-slate-900 truncate pr-4">{preview.fileName}</p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-4rem)] overflow-auto flex items-center justify-center bg-slate-50">
              <PreviewContent file={preview} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FileTile({ file, onOpen }: { file: OrderFile; onOpen: () => void }) {
  const src = publicAssetUrl(file.url) ?? file.url;
  const kind = getMediaKind(file.fileName, file.mimeType, file.category);

  if (kind === "audio") {
    return (
      <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-600 mb-2 truncate">{file.fileName}</p>
        <AudioPlayer
          src={src}
          mimeType={file.mimeType ?? (/\.m4a$/i.test(file.fileName) ? "audio/mp4" : undefined)}
          className="w-full h-9"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]"
    >
      {kind === "video" ? (
        <>
          <video src={src} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
            <Play className="h-8 w-8 text-white drop-shadow" />
          </div>
        </>
      ) : kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={file.fileName} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-slate-500">
          <FileText className="h-6 w-6" />
          <span className="text-[10px] text-center line-clamp-2">{file.fileName}</span>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <p className="text-[10px] text-white truncate">{file.fileName}</p>
      </div>
    </button>
  );
}

function PreviewContent({ file }: { file: OrderFile }) {
  const src = publicAssetUrl(file.url) ?? file.url;
  const kind = getMediaKind(file.fileName, file.mimeType, file.category);

  if (kind === "video") {
    return <video src={src} controls playsInline className="max-h-[70vh] w-full rounded-lg bg-black" />;
  }
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={file.fileName} className="max-h-[70vh] w-full object-contain rounded-lg" />
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="text-[#4C3BCF] hover:underline text-sm">
      Download {file.fileName}
    </a>
  );
}
