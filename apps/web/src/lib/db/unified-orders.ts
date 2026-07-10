import type { BridalOrder } from "@/lib/data/seed";
import type { RetailOrder } from "@/lib/data/seed";
import { listRetailOrdersDb } from "@/lib/db/retail-orders";

export type UnifiedOrderType = "custom" | "online" | "walk_in";

export type UnifiedOrder = {
  id: string;
  orderNumber: string;
  type: UnifiedOrderType;
  customerLabel: string;
  customerPhone?: string;
  total: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  deliveryDate?: string;
  supplierName?: string;
  href: string;
};

const BRIDAL_STATUS_LABELS: Record<string, string> = {
  order_created: "Order Created",
  deposit_received: "Deposit Received",
  sent_to_supplier: "Sent to Supplier",
  stitching: "Stitching",
  quality_check: "Quality Check",
  shipping: "Shipping",
  ready_for_collection: "Ready for Collection",
  collected: "Collected",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const RETAIL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function mapBridalOrder(order: BridalOrder & { customerName?: string; customerPhone?: string; supplierName?: string }): UnifiedOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: "custom",
    customerLabel: order.customerName ?? "Unknown",
    customerPhone: order.customerPhone,
    total: order.totalPrice,
    status: order.status,
    statusLabel: BRIDAL_STATUS_LABELS[order.status] ?? order.status,
    createdAt: order.bookingDate,
    deliveryDate: order.deliveryDate,
    supplierName: order.supplierName,
    href: `/admin/orders/${order.id}`,
  };
}

function mapRetailOrder(order: RetailOrder): UnifiedOrder {
  const type: UnifiedOrderType = order.source === "walk_in" ? "walk_in" : "online";
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type,
    customerLabel: order.customerName ?? order.customerPhone ?? order.customerEmail ?? "Walk-in customer",
    customerPhone: order.customerPhone,
    total: order.total,
    status: order.status,
    statusLabel: RETAIL_STATUS_LABELS[order.status] ?? order.status,
    createdAt: order.createdAt,
    href: `/admin/orders/shop/${order.id}`,
  };
}

function bridalMatchesTab(status: string, tab: string): boolean {
  const active = !["collected", "cancelled", "refunded"].includes(status);
  switch (tab) {
    case "active":
      return active;
    case "completed":
      return status === "collected";
    case "cancelled":
      return status === "cancelled";
    case "refunded":
      return status === "refunded";
    case "overdue":
    case "due-week":
      return active;
    default:
      return true;
  }
}

function retailMatchesTab(status: string, tab: string): boolean {
  switch (tab) {
    case "shop-open":
      return ["pending", "paid", "processing", "shipped"].includes(status);
    case "shop-shipped":
      return status === "shipped";
    case "shop-delivered":
      return status === "delivered";
    case "shop-cancelled":
      return status === "cancelled";
    case "open":
      return ["pending", "paid", "processing", "shipped"].includes(status);
    case "completed":
      return status === "delivered";
    case "cancelled":
      return status === "cancelled";
    default:
      return true;
  }
}

export async function getUnifiedOrders(params: {
  type?: "all" | UnifiedOrderType;
  tab?: string;
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<{ orders: UnifiedOrder[]; total: number }> {
  const { type = "all", tab = "recent", limit = 20, offset = 0, q } = params;

  const includeCustom = type === "all" || type === "custom";
  const includeOnline = type === "all" || type === "online";
  const includeWalkIn = type === "all" || type === "walk_in";

  const unified: UnifiedOrder[] = [];

  if (includeCustom) {
    const { getBridalOrdersWithRelations } = await import("@/lib/data");
    const bridalTab =
      ["active", "overdue", "due-week", "completed", "cancelled", "refunded"].includes(tab) ? tab : undefined;

    if (bridalTab && type === "custom") {
      const { orders } = await getBridalOrdersWithRelations({
        tab: bridalTab as "active" | "overdue" | "due-week" | "completed" | "cancelled" | "refunded",
        limit: 500,
        offset: 0,
      });
      unified.push(...orders.map(mapBridalOrder));
    } else if (type === "all" && ["open", "completed", "cancelled"].includes(tab)) {
      const { orders } = await getBridalOrdersWithRelations({ tab: "active", limit: 500, offset: 0 });
      for (const o of orders) {
        if (bridalMatchesTab(o.status, tab)) unified.push(mapBridalOrder(o));
      }
      const completed = await getBridalOrdersWithRelations({ tab: "completed", limit: 500, offset: 0 });
      for (const o of completed.orders) {
        if (bridalMatchesTab(o.status, tab)) unified.push(mapBridalOrder(o));
      }
      const cancelled = await getBridalOrdersWithRelations({ tab: "cancelled", limit: 500, offset: 0 });
      for (const o of cancelled.orders) {
        if (bridalMatchesTab(o.status, tab)) unified.push(mapBridalOrder(o));
      }
    } else {
      const { orders } = await getBridalOrdersWithRelations({ limit: 500, offset: 0 });
      unified.push(...orders.map(mapBridalOrder));
    }
  }

  if (includeOnline || includeWalkIn) {
    const retail = await listRetailOrdersDb();
    for (const o of retail) {
      const orderType: UnifiedOrderType = o.source === "walk_in" ? "walk_in" : "online";
      if (orderType === "online" && !includeOnline) continue;
      if (orderType === "walk_in" && !includeWalkIn) continue;

      if (type === "online" || type === "walk_in") {
        if (!retailMatchesTab(o.status, tab)) continue;
      } else if (type === "all" && ["open", "completed", "cancelled"].includes(tab)) {
        if (!retailMatchesTab(o.status, tab)) continue;
      }

      unified.push(mapRetailOrder(o));
    }
  }

  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let filtered = unified;
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    filtered = unified.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(needle) ||
        o.customerLabel.toLowerCase().includes(needle) ||
        (o.customerPhone?.includes(needle) ?? false)
    );
  }

  const total = filtered.length;
  const orders = filtered.slice(offset, offset + limit);

  return { orders, total };
}

export async function searchUnifiedOrders(query: string): Promise<UnifiedOrder[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { searchBridalOrdersWithCustomerDb } = await import("@/lib/db/bridal-orders");
  const { searchRetailOrdersDb } = await import("@/lib/db/retail-orders");

  const [bridal, retail] = await Promise.all([
    searchBridalOrdersWithCustomerDb(query),
    searchRetailOrdersDb(query),
  ]);

  const results: UnifiedOrder[] = [
    ...bridal.map((o) =>
      mapBridalOrder({
        ...o,
        customerName: o.customerName,
      })
    ),
    ...retail.map(mapRetailOrder),
  ];

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results.slice(0, 30);
}
