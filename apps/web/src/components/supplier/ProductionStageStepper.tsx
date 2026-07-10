"use client";

import { PRODUCTION_STAGES, getStatusLabel } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";
import { Check } from "lucide-react";

interface Props {
  status: BridalStatus;
  loading?: boolean;
  onAdvance: (stage: BridalStatus) => void;
}

export function ProductionStageStepper({ status, loading, onAdvance }: Props) {
  const currentIdx = PRODUCTION_STAGES.indexOf(status as (typeof PRODUCTION_STAGES)[number]);
  const nextStage =
    currentIdx >= 0 && currentIdx < PRODUCTION_STAGES.length - 1
      ? PRODUCTION_STAGES[currentIdx + 1]
      : null;

  return (
    <div>
      <div className="space-y-0 mb-4">
        {PRODUCTION_STAGES.map((stage, idx) => {
          const isDone = currentIdx > idx;
          const isCurrent = status === stage;
          return (
            <div key={stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${
                    isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                        ? "bg-[#4C3BCF] border-[#4C3BCF] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-300"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : isCurrent ? "●" : ""}
                </div>
                {idx < PRODUCTION_STAGES.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[1.5rem] ${isDone ? "bg-green-300" : "bg-slate-200"}`} />
                )}
              </div>
              <div className="pb-4 pt-0.5">
                <p
                  className={`text-sm ${
                    isCurrent
                      ? "font-semibold text-[#4C3BCF]"
                      : isDone
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {getStatusLabel(stage)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {nextStage && (
        <button
          type="button"
          disabled={loading}
          onClick={() => onAdvance(nextStage)}
          className="w-full py-3.5 boms-btn-primary rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Updating…" : `Mark complete: ${getStatusLabel(nextStage)}`}
        </button>
      )}
    </div>
  );
}
