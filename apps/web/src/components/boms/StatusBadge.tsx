import type { BridalStatus } from "@/lib/data/seed";
import { getStatusLabel } from "@/lib/orders/status-machine";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Partial<Record<BridalStatus, string>> = {
  order_received: "bg-blue-100 text-blue-700",
  fabric_preparation: "bg-violet-100 text-violet-700",
  embroidery: "bg-orange-100 text-orange-700",
  stitching: "bg-orange-100 text-orange-700",
  ready_for_collection: "bg-green-100 text-green-700",
  collected: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
  sent_to_supplier: "bg-blue-50 text-blue-600",
  redesign_in_progress: "bg-amber-100 text-amber-800",
};

export function StatusBadge({ status, className }: { status: BridalStatus; className?: string }) {
  const colors = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", colors, className)}>
      {getStatusLabel(status)}
    </span>
  );
}

export function OverdueBadge({ overdue }: { overdue: boolean }) {
  if (!overdue) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Overdue
    </span>
  );
}
