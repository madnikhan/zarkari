import { COUNTDOWN_CLASSES, getCountdown } from "@/lib/orders/status-machine";

export function CountdownBadge({ deliveryDate }: { deliveryDate: string }) {
  const { label, tone } = getCountdown(deliveryDate);
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded border ${COUNTDOWN_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
