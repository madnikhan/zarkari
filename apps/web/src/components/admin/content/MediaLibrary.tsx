"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Check, Loader2 } from "lucide-react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { publicAssetUrl } from "@/lib/image-url";

interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
}

export function MediaLibrary() {
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
  }, [load]);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <MediaUploadZone
        label="Upload images for products, collections, or blog"
        accept="image/*"
        category="cms"
        onUploaded={() => load()}
      />
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : assets.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No uploads yet. Images appear here after upload.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="boms-card overflow-hidden group">
              <div className="relative aspect-square bg-slate-100">
                <Image src={publicAssetUrl(asset.url) ?? asset.url} alt={asset.fileName} fill sizes="200px" className="object-cover" />
              </div>
              <div className="p-2">
                <p className="text-xs text-slate-600 truncate" title={asset.fileName}>
                  {asset.fileName}
                </p>
                <button
                  type="button"
                  onClick={() => copyUrl(asset.url)}
                  className="mt-1 flex items-center gap-1 text-xs text-[#4C3BCF] hover:underline"
                >
                  {copied === asset.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === asset.url ? "Copied" : "Copy URL"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
