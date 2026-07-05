"use client";

import { useState } from "react";
import { normalizeAudioMime } from "@/lib/audio/mime";

interface Props {
  src: string;
  mimeType?: string;
  className?: string;
  label?: string;
}

export function AudioPlayer({ src, mimeType, className, label }: Props) {
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const type = mimeType ? normalizeAudioMime(mimeType) : undefined;

  return (
    <div className="space-y-1 min-w-0 flex-1">
      {label && <p className="text-[10px] text-slate-400 truncate">{label}</p>}
      <audio
        controls
        preload="auto"
        className={className ?? "w-full h-9"}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : null);
          setError("");
        }}
        onError={() => {
          setError("Could not play this recording — format may not be supported on this device.");
        }}
      >
        <source src={src} type={type} />
      </audio>
      {duration != null && duration > 0 && !error && (
        <p className="text-[10px] text-slate-400">
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
