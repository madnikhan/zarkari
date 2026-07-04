"use client";

import { useState } from "react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { MediaAssetGrid } from "@/components/admin/content/MediaAssetGrid";

export function MediaLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Upload images once, then pick them directly when editing products, collections, or blog posts.
      </p>
      <MediaUploadZone
        label="Upload images for products, collections, or blog"
        accept="image/*"
        category="cms"
        onUploaded={() => setRefreshKey((k) => k + 1)}
        onSingleUploaded={() => setRefreshKey((k) => k + 1)}
      />
      <MediaAssetGrid refreshKey={refreshKey} showCopy />
    </div>
  );
}
