import { CUSTOMER_PROGRESS_STEPS, getCustomerProgressState } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";

const REDESIGN_LABEL = "Quality Check — Amendments in Progress";

export function CustomerOrderProgressTracker({ status }: { status: BridalStatus }) {
  if (status === "redesign_in_progress") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-amber-900">{REDESIGN_LABEL}</p>
        <p className="text-xs text-amber-700 mt-1">Your order is being amended to ensure the highest quality.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {CUSTOMER_PROGRESS_STEPS.map((step, i) => {
        const state = getCustomerProgressState(status, step.key);
        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 flex items-center justify-center text-[8px] ${
                  state === "done"
                    ? "bg-gold border-gold"
                    : state === "current"
                      ? "bg-cream border-gold ring-2 ring-gold/30"
                      : "bg-cream border-sand"
                }`}
              >
                {state === "done" ? "✓" : state === "current" ? "●" : ""}
              </div>
              {i < CUSTOMER_PROGRESS_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[2rem] ${state === "done" ? "bg-gold" : "bg-sand"}`} />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm ${
                  state === "current" ? "font-semibold text-charcoal" : state === "done" ? "text-charcoal" : "text-charcoal/40"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
