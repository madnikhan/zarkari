"use client";

import { useState } from "react";
import { MediaUploadZone } from "@/components/boms/MediaUploadZone";
import { MediaAssetGrid } from "@/components/admin/content/MediaAssetGrid";
import { HERO_MEDIA_CATEGORY } from "@/lib/upload/constants";

const HERO_ACCEPT = "video/*,.mov,.mp4,.webm";
const HERO_HINT = "Videos up to 10 min / 200 MB · H.264 MP4 recommended for Safari";

export function HeroMediaLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Homepage hero clips only — stored in Cloudflare R2 under{" "}
        <code className="text-xs bg-slate-100 px-1 rounded">uploads/hero/</code>. Upload here, then
        pick which clips to show on the Homepage editor.
      </p>
      <MediaUploadZone
        label="Upload hero videos"
        accept={HERO_ACCEPT}
        category={HERO_MEDIA_CATEGORY}
        sizeHint={HERO_HINT}
        onUploaded={() => setRefreshKey((k) => k + 1)}
        onSingleUploaded={() => setRefreshKey((k) => k + 1)}
      />
      <MediaAssetGrid
        refreshKey={refreshKey}
        showCopy
        showDelete
        enablePreview
        videosOnly
        typeFilter="video"
        categoryFilter={HERO_MEDIA_CATEGORY}
        emptyMessage="No hero videos yet. Upload a clip above."
      />
    </div>
  );
}
