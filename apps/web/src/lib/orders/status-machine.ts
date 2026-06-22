import type { BridalStatus } from "@/lib/data/seed";

export const PRODUCTION_STAGES: BridalStatus[] = [
  "order_received",
  "fabric_preparation",
  "embroidery",
  "stitching",
  "finishing",
  "packing",
  "shipping",
  "delivered_to_shop",
];

export const CUSTOMER_PROGRESS_STEPS = [
  { key: "order_created", label: "Order Confirmed" },
  { key: "sent_to_supplier", label: "Sent to Supplier" },
  { key: "order_received", label: "Supplier Accepted" },
  { key: "fabric_preparation", label: "Fabric Ready" },
  { key: "embroidery", label: "Embroidery" },
  { key: "stitching", label: "Stitching" },
  { key: "finishing", label: "Finishing" },
  { key: "shipping_group", label: "Shipping" },
  { key: "ready_for_collection", label: "Ready for Collection" },
  { key: "collected", label: "Collected" },
] as const;

const STATUS_ORDER: BridalStatus[] = [
  "order_created",
  "sent_to_supplier",
  "supplier_rejected",
  "order_received",
  "fabric_preparation",
  "embroidery",
  "stitching",
  "finishing",
  "packing",
  "shipping",
  "delivered_to_shop",
  "redesign_in_progress",
  "ready_for_collection",
  "collected",
  "cancelled",
  "refunded",
];

export function getStatusIndex(status: BridalStatus): number {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

export function getCustomerProgressState(status: BridalStatus, stepKey: string): "done" | "current" | "upcoming" {
  if (status === "redesign_in_progress") {
    if (stepKey === "embroidery") return "current";
    return "upcoming";
  }
  if (status === "cancelled" || status === "refunded") return "upcoming";

  const stageMap: Record<string, number> = {
    order_created: 0,
    sent_to_supplier: 1,
    order_received: 2,
    fabric_preparation: 3,
    embroidery: 4,
    stitching: 5,
    finishing: 6,
    packing: 7,
    shipping: 7,
    delivered_to_shop: 7,
    shipping_group: 7,
    ready_for_collection: 8,
    collected: 9,
  };

  const currentIdx =
    status === "packing" || status === "shipping" || status === "delivered_to_shop"
      ? 7
      : stageMap[status] ?? 0;
  const stepIdx = stageMap[stepKey] ?? -1;
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function getStatusLabel(status: BridalStatus): string {
  const labels: Record<string, string> = {
    order_created: "Order Created",
    sent_to_supplier: "Sent to Supplier",
    supplier_rejected: "Supplier Rejected",
    order_received: "Order Received",
    fabric_preparation: "Fabric Preparation",
    embroidery: "Embroidery in Progress",
    stitching: "Stitching",
    finishing: "Finishing",
    packing: "Packing",
    shipping: "Shipping",
    delivered_to_shop: "Delivered to Shop",
    redesign_in_progress: "Redesign in Progress",
    ready_for_collection: "Ready for Collection",
    collected: "Collected",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status] ?? status;
}

export function getCustomerStatusLabel(status: BridalStatus): string {
  if (status === "redesign_in_progress") return "Quality Check — Amendments in Progress";
  const customerLabels: Partial<Record<BridalStatus, string>> = {
    order_created: "Order Confirmed",
    sent_to_supplier: "Sent to Supplier",
    order_received: "Supplier Accepted",
    fabric_preparation: "Fabric Ready",
    embroidery: "Embroidery in Progress",
    stitching: "Stitching",
    finishing: "Finishing",
    packing: "Shipping",
    shipping: "Shipping",
    delivered_to_shop: "Shipping",
    ready_for_collection: "Ready for Collection",
    collected: "Collected",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return customerLabels[status] ?? getStatusLabel(status);
}

export function isFinalStatus(status: BridalStatus): boolean {
  return status === "collected" || status === "cancelled" || status === "refunded";
}

export function getCountdown(deliveryDate: string): { label: string; tone: "green" | "yellow" | "red" | "overdue" } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((delivery.getTime() - now.getTime()) / 86400000);

  if (diffDays < 0) {
    return { label: `Overdue by ${Math.abs(diffDays)} Days`, tone: "overdue" };
  }
  if (diffDays <= 10) return { label: `${diffDays} Days Remaining`, tone: "red" };
  if (diffDays <= 20) return { label: `${diffDays} Days Remaining`, tone: "yellow" };
  return { label: `${diffDays} Days Remaining`, tone: "green" };
}

export const COUNTDOWN_CLASSES = {
  green: "text-emerald-700 bg-emerald-50 border-emerald-200",
  yellow: "text-amber-700 bg-amber-50 border-amber-200",
  red: "text-red-700 bg-red-50 border-red-200",
  overdue: "text-red-900 bg-red-100 border-red-300",
};
