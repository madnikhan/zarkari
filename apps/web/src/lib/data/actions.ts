import {
  demoBridalOrders,
  demoTimeline,
  demoMessages,
  demoOrderFiles,
  demoCustomers,
  demoRedesigns,
  demoCancellations,
  demoRefunds,
  demoOrderCollections,
  demoSupplierCompletions,
  demoNotifications,
  demoPayments,
  nextOrderNumber,
  type BridalOrder,
  type BridalStatus,
  type Customer,
  type TimelineEvent,
} from "./seed";

function addTimeline(orderId: string, eventType: string, opts?: Partial<TimelineEvent>) {
  demoTimeline.push({
    id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId,
    eventType,
    createdAt: new Date().toISOString(),
    ...opts,
  });
}

function findOrder(id: string) {
  return demoBridalOrders.find((o) => o.id === id);
}

export function createBridalOrder(input: {
  customer: Omit<Customer, "id">;
  supplierId?: string;
  dressType?: string;
  colour?: string;
  size?: string;
  totalPrice: string;
  customisationNotes?: string;
  createdById?: string;
  createdByName?: string;
}): BridalOrder {
  const deposit = (parseFloat(input.totalPrice) * 0.5).toFixed(2);
  const remaining = (parseFloat(input.totalPrice) - parseFloat(deposit)).toFixed(2);
  const delivery = new Date(Date.now() + 56 * 86400000).toISOString();
  const customerId = `cust-${Date.now()}`;
  demoCustomers.push({
    id: customerId,
    name: input.customer.name,
    phone: input.customer.phone,
    email: input.customer.email,
    address: input.customer.address,
  });
  const order: BridalOrder = {
    id: `bo-${Date.now()}`,
    orderNumber: nextOrderNumber(),
    customerId,
    supplierId: input.supplierId,
    status: "order_created",
    bookingDate: new Date().toISOString(),
    deliveryDate: delivery,
    totalPrice: input.totalPrice,
    depositPaid: deposit,
    remainingBalance: remaining,
    dressType: input.dressType,
    colour: input.colour,
    size: input.size,
    customisationNotes: input.customisationNotes,
    supplierLocked: false,
    createdById: input.createdById,
  };
  demoBridalOrders.push(order);
  addTimeline(order.id, "order_created", {
    performedByName: input.createdByName,
    performedByRole: "staff",
  });
  return order;
}

export function sendToSupplier(orderId: string, byName?: string) {
  const order = findOrder(orderId);
  if (!order || !order.supplierId) return null;
  order.status = "sent_to_supplier";
  addTimeline(orderId, "sent_to_supplier", { performedByName: byName, performedByRole: "staff" });
  notify("New order assigned", order.orderNumber, orderId);
  return order;
}

export function supplierAccept(orderId: string, supplierName?: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "order_received";
  order.filesUnlockedAt = new Date().toISOString();
  addTimeline(orderId, "accepted", { performedByName: supplierName, performedByRole: "supplier" });
  return order;
}

export function supplierReject(orderId: string, comment: string, supplierName?: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "supplier_rejected";
  addTimeline(orderId, "rejected", { comment, performedByName: supplierName, performedByRole: "supplier" });
  return order;
}

export function advanceProductionStage(orderId: string, stage: BridalStatus, supplierName?: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = stage;
  addTimeline(orderId, "stage_update", {
    comment: stage.replace(/_/g, " "),
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  if (stage === "delivered_to_shop") {
    order.status = "ready_for_collection";
    notify("Order ready for review", order.orderNumber, orderId);
  }
  return order;
}

function notify(title: string, body: string, orderId?: string) {
  demoNotifications.unshift({
    id: `n-${Date.now()}`,
    orderId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function sendForRedesign(orderId: string, reason: string, byName?: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "redesign_in_progress";
  demoRedesigns.push({
    id: `rd-${Date.now()}`,
    orderId,
    reason,
    comment: reason,
    createdAt: new Date().toISOString(),
    createdByName: byName,
  });
  addTimeline(orderId, "redesign_requested", { comment: reason, performedByName: byName, performedByRole: "owner" });
  notify("Redesign requested", reason, orderId);
  return order;
}

export function cancelOrder(orderId: string, reason: string, byName?: string, role = "owner") {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "cancelled";
  demoCancellations.push({
    id: `cx-${Date.now()}`,
    orderId,
    reason,
    comment: reason,
    cancelledByRole: role,
    createdAt: new Date().toISOString(),
  });
  addTimeline(orderId, "cancelled", { comment: reason, performedByName: byName, performedByRole: role });
  notify("Order cancelled", reason, orderId);
  return order;
}

export function refundOrder(orderId: string, amount: string, reason: string, byName?: string) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "refunded";
  demoRefunds.push({
    id: `rf-${Date.now()}`,
    orderId,
    reason,
    amount,
    paymentMethod: "original",
    createdAt: new Date().toISOString(),
  });
  addTimeline(orderId, "refunded", { comment: `Refund £${amount}: ${reason}`, performedByName: byName, performedByRole: "owner" });
  notify("Refund processed", `£${amount}`, orderId);
  return order;
}

export function markCollected(
  orderId: string,
  byName?: string,
  details?: { balancePaid: boolean; amountPaid?: string; alterationNotes?: string }
) {
  const order = findOrder(orderId);
  if (!order) return null;
  order.status = "collected";
  order.supplierLocked = true;
  demoOrderCollections.push({
    id: `col-${Date.now()}`,
    orderId,
    collectionDate: new Date().toISOString(),
    balancePaid: details?.balancePaid ?? true,
    amountPaid: details?.amountPaid ?? order.remainingBalance,
    alterationNotes: details?.alterationNotes,
  });
  addTimeline(orderId, "collected", { performedByName: byName, performedByRole: "staff" });
  return order;
}

export function supplierComplete(
  orderId: string,
  input: { deliveryDate: string; billNumber: string; courierName?: string; trackingNumber?: string; photoUrl?: string },
  supplierName?: string
) {
  const order = findOrder(orderId);
  if (!order) return null;
  demoSupplierCompletions.push({
    id: `sc-${Date.now()}`,
    orderId,
    deliveryDate: input.deliveryDate,
    billNumber: input.billNumber,
    courierName: input.courierName,
    trackingNumber: input.trackingNumber,
  });
  if (input.photoUrl) addOrderFile(orderId, "completion", "completion-photo.jpg", input.photoUrl);
  order.status = "ready_for_collection";
  order.supplierLocked = true;
  addTimeline(orderId, "completed", {
    comment: `Bill ${input.billNumber}`,
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  notify("Supplier completed order", order.orderNumber, orderId);
  return order;
}

export function addCustomerMessage(orderId: string, message: string, senderName?: string) {
  demoMessages.push({
    id: `msg-${Date.now()}`,
    orderId,
    senderType: "customer",
    senderName,
    message,
    createdAt: new Date().toISOString(),
  });
}

export function addStaffMessage(orderId: string, message: string, senderName?: string) {
  demoMessages.push({
    id: `msg-${Date.now()}`,
    orderId,
    senderType: "staff",
    senderName,
    message,
    createdAt: new Date().toISOString(),
  });
}

export function addOrderFile(orderId: string, category: string, fileName: string, url: string) {
  demoOrderFiles.push({ id: `f-${Date.now()}`, orderId, category, fileName, url });
}

export function markAllNotificationsRead() {
  demoNotifications.forEach((n) => {
    n.read = true;
  });
}

export function recordPayment(orderId: string, input: { type: string; amount: string; method?: string }) {
  demoPayments.push({
    id: `pay-${Date.now()}`,
    orderId,
    type: input.type,
    amount: input.amount,
    method: input.method,
    createdAt: new Date().toISOString(),
  });
}
