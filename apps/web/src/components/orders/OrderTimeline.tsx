import type { TimelineEvent } from "@/lib/data/seed";
import { getStatusLabel } from "@/lib/orders/status-machine";

export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return <p className="text-sm text-charcoal/50">No timeline events yet.</p>;

  return (
    <ol className="relative border-l border-sand ml-3 space-y-6">
      {events.map((event) => (
        <li key={event.id} className="ml-6">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-gold border-2 border-cream" />
          <p className="text-sm font-medium text-charcoal">
            {event.eventType === "stage_update" && event.comment
              ? event.comment
              : getStatusLabel(event.eventType as never) || event.eventType.replace(/_/g, " ")}
          </p>
          {event.comment && event.eventType !== "stage_update" && (
            <p className="text-sm text-charcoal/60 mt-0.5">{event.comment}</p>
          )}
          <p className="text-xs text-charcoal/40 mt-1">
            {event.performedByName && `${event.performedByName} · `}
            {new Date(event.createdAt).toLocaleString("en-GB")}
          </p>
        </li>
      ))}
    </ol>
  );
}
