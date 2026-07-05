"use client";

import { useState } from "react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { MediaAssetGrid } from "@/components/admin/content/MediaAssetGrid";

const CMS_ACCEPT = "image/*,video/*,.mov";
const CMS_HINT = "Images up to 4 MB · Videos up to 10 min / 200 MB";

export function MediaLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Upload images and videos once, then pick them when editing products, collections, or blog posts.
      </p>
      <MediaUploadZone
        label="Upload images or videos for products, collections, or blog"
        accept={CMS_ACCEPT}
        category="cms"
        sizeHint={CMS_HINT}
        onUploaded={() => setRefreshKey((k) => k + 1)}
        onSingleUploaded={() => setRefreshKey((k) => k + 1)}
      />
      <MediaAssetGrid refreshKey={refreshKey} showCopy />
    </div>
  );
}
