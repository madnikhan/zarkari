import { CUSTOMER_PROGRESS_STEPS, getCustomerProgressState } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";

export function OrderProgressTracker({ status }: { status: BridalStatus }) {
  return (
    <div className="space-y-0">
      {CUSTOMER_PROGRESS_STEPS.map((step, i) => {
        const state = getCustomerProgressState(status, step.key);
        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  state === "done"
                    ? "bg-gold border-gold"
                    : state === "current"
                      ? "bg-cream border-gold ring-2 ring-gold/30"
                      : "bg-cream border-sand"
                }`}
              />
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
