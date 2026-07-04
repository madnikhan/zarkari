"use client";

import type { UploadProgressState } from "@/lib/upload/client";

interface Props {
  state: UploadProgressState | null;
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
      {state.status === "done" && (
        <p className="text-xs text-emerald-600">Upload complete</p>
      )}
    </div>
  );
}
