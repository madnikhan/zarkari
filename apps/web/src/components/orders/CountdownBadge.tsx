import { COUNTDOWN_CLASSES, getCountdown } from "@/lib/orders/status-machine";

export function CountdownBadge({ deliveryDate }: { deliveryDate: string }) {
  const { label, tone } = getCountdown(deliveryDate);
  return (
    <span className={`inline-block text-sm font-semibold px-3.5 py-1.5 rounded-full border-2 ${COUNTDOWN_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
