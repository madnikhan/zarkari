"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Loader2 } from "lucide-react";
import { publicAssetUrl } from "@/lib/image-url";

export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
}

interface Props {
  onSelect?: (url: string) => void;
  selectedUrls?: string[];
  selectable?: boolean;
  showCopy?: boolean;
  emptyMessage?: string;
  refreshKey?: number;
}

export function MediaAssetGrid({
  onSelect,
  selectedUrls = [],
  selectable = false,
  showCopy = true,
  emptyMessage = "No uploads yet.",
  refreshKey = 0,
}: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setAssets(data.assets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (assets.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {assets.map((asset) => {
        const selected = selectedUrls.includes(asset.url);
        const src = publicAssetUrl(asset.url) ?? asset.url;
        return (
          <div
            key={asset.id}
            className={`boms-card overflow-hidden group ${selectable ? "cursor-pointer" : ""} ${
              selected ? "ring-2 ring-[#4C3BCF]" : ""
            }`}
            onClick={selectable ? () => onSelect?.(asset.url) : undefined}
            onKeyDown={
              selectable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(asset.url);
                    }
                  }
                : undefined
            }
            role={selectable ? "button" : undefined}
            tabIndex={selectable ? 0 : undefined}
          >
            <div className="relative aspect-square bg-slate-100">
              <Image src={src} alt={asset.fileName} fill sizes="200px" className="object-cover" />
              {selected && (
                <div className="absolute inset-0 bg-[#4C3BCF]/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-white drop-shadow" />
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-slate-600 truncate" title={asset.fileName}>
                {asset.fileName}
              </p>
              {showCopy && !selectable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(asset.url);
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
  );
}
