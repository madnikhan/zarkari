"use client";

import type { UploadProgressState } from "@/lib/upload/client";
import { formatBytes, formatSpeed } from "@/lib/upload/upload-speed";

interface Props {
  state: UploadProgressState | null;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `~${seconds}s left`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins}m left`;
}

function formatTransferDetail(state: UploadProgressState): string | null {
  if (state.status === "done" || state.status === "processing") return null;
  if (state.bytesTotal == null || state.bytesLoaded == null) return null;

  const parts = [`${formatBytes(state.bytesLoaded)} / ${formatBytes(state.bytesTotal)}`];
  if (state.speedBps != null && state.speedBps > 0) {
    parts.push(formatSpeed(state.speedBps));
  }
  if (state.etaSec != null && state.etaSec > 0) {
    parts.push(formatEta(state.etaSec));
  }
  return parts.join(" · ");
}

export function UploadProgressBar({ state }: Props) {
  if (!state || state.status === "error") {
    if (state?.status === "error") {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error ?? "Upload failed"}
        </div>
      );
    }
    return null;
  }

  const pct = Math.max(0, Math.min(100, state.progress));
  const transferDetail = formatTransferDetail(state);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{state.label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            state.status === "done" ? "bg-emerald-500" : "bg-[#4C3BCF]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {transferDetail && (
        <p className="text-xs text-slate-500">{transferDetail}</p>
      )}
      {state.status === "done" && (
        <p className="text-xs text-emerald-600">Upload complete</p>
      )}
    </div>
  );
}
