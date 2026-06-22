import { PRODUCTION_STAGES, getStatusLabel } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";

export function ProductionStepper({ status }: { status: BridalStatus }) {
  const currentIdx = PRODUCTION_STAGES.indexOf(status as (typeof PRODUCTION_STAGES)[number]);
  const activeIdx = currentIdx === -1 ? (status === "ready_for_collection" || status === "collected" ? PRODUCTION_STAGES.length : -1) : currentIdx;

  return (
    <div className="flex flex-wrap gap-2">
      {PRODUCTION_STAGES.map((stage, i) => {
        const done = activeIdx >= 0 && i < activeIdx;
        const current = i === activeIdx;
        return (
          <div
            key={stage}
            className={`text-xs px-3 py-2 rounded border ${
              done
                ? "bg-gold/20 border-gold text-charcoal"
                : current
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-sand/20 border-sand text-charcoal/40"
            }`}
          >
            {getStatusLabel(stage)}
          </div>
        );
      })}
    </div>
  );
}
