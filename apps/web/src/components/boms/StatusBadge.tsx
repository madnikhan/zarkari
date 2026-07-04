import type { BridalStatus } from "@/lib/data/seed";
import { getStatusLabel } from "@/lib/orders/status-machine";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<BridalStatus, string> = {
  order_created: "bg-slate-200 text-slate-800",
  sent_to_supplier: "bg-blue-200 text-blue-800",
  supplier_rejected: "bg-red-200 text-red-800",
  order_received: "bg-indigo-200 text-indigo-800",
  fabric_preparation: "bg-violet-200 text-violet-800",
  embroidery: "bg-orange-200 text-orange-800",
  stitching: "bg-orange-300 text-orange-900",
  finishing: "bg-amber-200 text-amber-900",
  packing: "bg-yellow-200 text-yellow-900",
  shipping: "bg-cyan-200 text-cyan-900",
  delivered_to_shop: "bg-teal-200 text-teal-900",
  redesign_in_progress: "bg-amber-300 text-amber-900",
  ready_for_collection: "bg-green-200 text-green-800",
  collected: "bg-green-300 text-green-900",
  cancelled: "bg-red-300 text-red-900",
  refunded: "bg-purple-200 text-purple-900",
};

export function StatusBadge({ status, className }: { status: BridalStatus; className?: string }) {
  const colors = STATUS_COLORS[status] ?? "bg-slate-200 text-slate-800";
  return (
    <span
      className={cn(
        "inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap",
        colors,
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function OverdueBadge({ overdue }: { overdue: boolean }) {
  if (!overdue) return null;
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold bg-red-300 text-red-900">
      Overdue
    </span>
  );
}
