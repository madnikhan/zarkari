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
import { isDbConfigured } from "@/lib/db";

function addTimeline(orderId: string, eventType: string, opts?: Partial<TimelineEvent>) {
  demoTimeline.push({
    id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId,
    eventType,
    createdAt: new Date().toISOString(),
    ...opts,
  });
}

function findOrderMem(id: string) {
  return demoBridalOrders.find((o) => o.id === id);
}

async function resolveOrder(orderId: string): Promise<BridalOrder | null> {
  const mem = findOrderMem(orderId);
  if (mem) return mem;
  if (!isDbConfigured()) return null;
  const { getBridalOrderDb } = await import("@/lib/db/bridal-orders");
  const dbOrder = await getBridalOrderDb(orderId);
  if (dbOrder) {
    demoBridalOrders.push(dbOrder);
    return dbOrder;
  }
  return null;
}

async function syncTimeline(
  orderId: string,
  eventType: string,
  opts?: { comment?: string; performedByName?: string; performedByRole?: string }
) {
  addTimeline(orderId, eventType, opts);
  if (isDbConfigured()) {
    const { addTimelineDb } = await import("@/lib/db/bridal-orders");
    await addTimelineDb(orderId, eventType, opts);
  }
}

async function syncOrderPatch(
  orderId: string,
  patch: Partial<{
    status: BridalStatus;
    filesUnlockedAt: Date;
    supplierLocked: boolean;
    remainingBalance: string;
    depositPaid: string;
  }>
) {
  if (isDbConfigured()) {
    const { updateBridalOrderDb } = await import("@/lib/db/bridal-orders");
    await updateBridalOrderDb(orderId, patch);
  }
}

function notify(title: string, body: string, orderId?: string, href?: string, threadId?: string) {
  demoNotifications.unshift({
    id: `n-${Date.now()}`,
    orderId,
    href,
    threadId,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  });
  if (isDbConfigured()) {
    import("@/lib/db/notifications")
      .then((m) => m.createNotificationDb({ orderId, title, body, href, threadId }))
      .catch(console.error);
  }
}

export async function createBridalOrder(input: {
  customer: Omit<Customer, "id">;
  supplierId?: string;
  dressType?: string;
  colour?: string;
  size?: string;
  totalPrice: string;
  depositPaid?: string;
  deliveryDate?: string;
  customisationNotes?: string;
  mediaFiles?: { url: string; name: string; category: string }[];
  createdById?: string;
  createdByName?: string;
}): Promise<BridalOrder> {
  const deposit = input.depositPaid ?? (parseFloat(input.totalPrice) * 0.5).toFixed(2);
  const remaining = (parseFloat(input.totalPrice) - parseFloat(deposit)).toFixed(2);
  const delivery = input.deliveryDate ?? new Date(Date.now() + 56 * 86400000).toISOString();

  async function attachMedia(orderId: string) {
    if (!input.mediaFiles?.length) return;
    for (const file of input.mediaFiles) {
      await addOrderFile(orderId, file.category, file.name, file.url);
    }
  }

  if (isDbConfigured()) {
    const {
      createCustomerDb,
      createBridalOrderDb,
      nextBridalOrderNumberDb,
    } = await import("@/lib/db/bridal-orders");
    const orderNumber = await nextBridalOrderNumberDb();
    const customer = await createCustomerDb(input.customer);
    if (customer) {
      const dbOrder = await createBridalOrderDb({
        orderNumber,
        customerId: customer.id,
        supplierId: input.supplierId,
        dressType: input.dressType,
        colour: input.colour,
        size: input.size,
        totalPrice: input.totalPrice,
        depositPaid: deposit,
        remainingBalance: remaining,
        deliveryDate: delivery,
        customisationNotes: input.customisationNotes,
        createdById: input.createdById,
      });
      if (dbOrder) {
        demoCustomers.push(customer);
        demoBridalOrders.push(dbOrder);
        await syncTimeline(dbOrder.id, "order_created", {
          performedByName: input.createdByName,
          performedByRole: "staff",
        });
        if (parseFloat(deposit) > 0) {
          const { addPaymentDb } = await import("@/lib/db/bridal-orders");
          await addPaymentDb(dbOrder.id, { type: "deposit", amount: deposit, method: "cash" });
          const { autoPostCashTransaction } = await import("@/lib/db/cash-ledger");
          await autoPostCashTransaction({
            direction: "in",
            type: "order_deposit",
            amount: deposit,
            method: "cash",
            reference: dbOrder.orderNumber,
            description: "Deposit from customer",
            orderId: dbOrder.id,
          });
        }
        await attachMedia(dbOrder.id);
        return dbOrder;
      }
    }
  }

  const orderNumber = nextOrderNumber();
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
    orderNumber,
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
  await syncTimeline(order.id, "order_created", {
    performedByName: input.createdByName,
    performedByRole: "staff",
  });
  await attachMedia(order.id);
  return order;
}

export async function sendToSupplier(orderId: string, byName?: string) {
  const order = await resolveOrder(orderId);
  if (!order || !order.supplierId) return null;
  order.status = "sent_to_supplier";
  await syncOrderPatch(orderId, { status: "sent_to_supplier" });
  await syncTimeline(orderId, "sent_to_supplier", { performedByName: byName, performedByRole: "staff" });
  notify("New order assigned", order.orderNumber, orderId);
  return order;
}

export async function supplierAccept(orderId: string, supplierName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  order.status = "order_received";
  order.filesUnlockedAt = new Date().toISOString();
  await syncOrderPatch(orderId, { status: "order_received", filesUnlockedAt: new Date() });
  await syncTimeline(orderId, "accepted", { performedByName: supplierName, performedByRole: "supplier" });
  return order;
}

export async function supplierReject(orderId: string, comment: string, supplierName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  order.status = "supplier_rejected";
  await syncOrderPatch(orderId, { status: "supplier_rejected" });
  await syncTimeline(orderId, "rejected", { comment, performedByName: supplierName, performedByRole: "supplier" });
  return order;
}

export async function advanceProductionStage(orderId: string, stage: BridalStatus, supplierName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  order.status = stage;
  await syncOrderPatch(orderId, { status: stage });
  await syncTimeline(orderId, "stage_update", {
    comment: stage.replace(/_/g, " "),
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  if (stage === "delivered_to_shop") {
    order.status = "ready_for_collection";
    await syncOrderPatch(orderId, { status: "ready_for_collection" });
    notify("Order ready for review", order.orderNumber, orderId);
  }
  return order;
}

export async function sendForRedesign(orderId: string, reason: string, byName?: string, comment?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  order.status = "redesign_in_progress";
  demoRedesigns.push({
    id: `rd-${Date.now()}`,
    orderId,
    reason,
    comment: comment ?? reason,
    createdAt: new Date().toISOString(),
    createdByName: byName,
  });
  if (isDbConfigured()) {
    const { addRedesignDb } = await import("@/lib/db/bridal-orders");
    await addRedesignDb(orderId, { reason, comment: comment ?? reason });
  }
  await syncOrderPatch(orderId, { status: "redesign_in_progress" });
  await syncTimeline(orderId, "redesign_requested", {
    comment: comment ?? reason,
    performedByName: byName,
    performedByRole: "owner",
  });
  notify("Redesign requested", reason, orderId);
  return order;
}

export async function cancelOrder(orderId: string, reason: string, byName?: string, role = "owner") {
  const order = await resolveOrder(orderId);
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
  if (isDbConfigured()) {
    const { addCancellationDb } = await import("@/lib/db/bridal-orders");
    await addCancellationDb(orderId, { reason, comment: reason, cancelledByRole: role });
  }
  await syncOrderPatch(orderId, { status: "cancelled" });
  await syncTimeline(orderId, "cancelled", { comment: reason, performedByName: byName, performedByRole: role });
  notify("Order cancelled", reason, orderId);
  return order;
}

export async function refundOrder(orderId: string, amount: string, reason: string, byName?: string) {
  const order = await resolveOrder(orderId);
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
  if (isDbConfigured()) {
    const { addRefundDb } = await import("@/lib/db/bridal-orders");
    await addRefundDb(orderId, { reason, amount, paymentMethod: "original" });
    const { autoPostCashTransaction } = await import("@/lib/db/cash-ledger");
    await autoPostCashTransaction({
      direction: "out",
      type: "refund",
      amount,
      method: "online",
      reference: order.orderNumber,
      description: reason,
      orderId,
    });
  }
  await syncOrderPatch(orderId, { status: "refunded" });
  await syncTimeline(orderId, "refunded", {
    comment: `Refund £${amount}: ${reason}`,
    performedByName: byName,
    performedByRole: "owner",
  });
  notify("Refund processed", `£${amount}`, orderId);
  return order;
}

export async function markCollected(
  orderId: string,
  byName?: string,
  details?: { balancePaid: boolean; amountPaid?: string; alterationNotes?: string }
) {
  const order = await resolveOrder(orderId);
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
  if (isDbConfigured()) {
    const { addCollectionDb } = await import("@/lib/db/bridal-orders");
    await addCollectionDb(orderId, {
      balancePaid: details?.balancePaid ?? true,
      amountPaid: details?.amountPaid ?? order.remainingBalance,
      alterationNotes: details?.alterationNotes,
    });
    const paidAmount = details?.amountPaid ?? order.remainingBalance;
    if (parseFloat(paidAmount) > 0) {
      const { autoPostCashTransaction } = await import("@/lib/db/cash-ledger");
      await autoPostCashTransaction({
        direction: "in",
        type: "order_collection",
        amount: paidAmount,
        method: "cash",
        reference: order.orderNumber,
        description: "Balance received on collection",
        orderId,
      });
    }
  }
  await syncOrderPatch(orderId, { status: "collected", supplierLocked: true });
  await syncTimeline(orderId, "collected", { performedByName: byName, performedByRole: "staff" });
  return order;
}

export async function supplierComplete(
  orderId: string,
  input: { deliveryDate: string; billNumber: string; courierName?: string; trackingNumber?: string; photoUrl?: string },
  supplierName?: string
) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  demoSupplierCompletions.push({
    id: `sc-${Date.now()}`,
    orderId,
    deliveryDate: input.deliveryDate,
    billNumber: input.billNumber,
    courierName: input.courierName,
    trackingNumber: input.trackingNumber,
  });
  if (isDbConfigured()) {
    const { addSupplierCompletionDb } = await import("@/lib/db/bridal-orders");
    await addSupplierCompletionDb(orderId, input);
  }
  if (input.photoUrl) await addOrderFile(orderId, "completion", "completion-photo.jpg", input.photoUrl);
  order.status = "ready_for_collection";
  order.supplierLocked = true;
  await syncOrderPatch(orderId, { status: "ready_for_collection", supplierLocked: true });
  await syncTimeline(orderId, "completed", {
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

export async function addStaffMessage(orderId: string, message: string, senderName?: string) {
  if (!isDbConfigured()) {
    demoMessages.push({
      id: `msg-${Date.now()}`,
      orderId,
      senderType: "staff",
      senderName,
      message,
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const { addMessageDb } = await import("@/lib/db/bridal-orders");
  await addMessageDb(orderId, { senderType: "staff", senderName, message });
}

export async function addOrderFile(orderId: string, category: string, fileName: string, url: string) {
  demoOrderFiles.push({ id: `f-${Date.now()}`, orderId, category, fileName, url });
  if (isDbConfigured()) {
    const { addOrderFileDb } = await import("@/lib/db/bridal-orders");
    await addOrderFileDb(orderId, { category, fileName, url });
  }
}

export function markAllNotificationsRead() {
  demoNotifications.forEach((n) => {
    n.read = true;
  });
  if (isDbConfigured()) {
    import("@/lib/db/notifications")
      .then((m) => m.markAllNotificationsReadDb())
      .catch(console.error);
  }
}

export async function recordPayment(orderId: string, input: { type: string; amount: string; method?: string }) {
  const order = await resolveOrder(orderId);
  demoPayments.push({
    id: `pay-${Date.now()}`,
    orderId,
    type: input.type,
    amount: input.amount,
    method: input.method,
    createdAt: new Date().toISOString(),
  });
  if (order) {
    const paid = parseFloat(input.amount);
    if (input.type === "deposit" || input.type === "balance" || input.type === "full") {
      const newDeposit = (parseFloat(order.depositPaid) + paid).toFixed(2);
      const newRemaining = Math.max(0, parseFloat(order.totalPrice) - parseFloat(newDeposit)).toFixed(2);
      order.depositPaid = newDeposit;
      order.remainingBalance = newRemaining;
      await syncOrderPatch(orderId, { depositPaid: newDeposit, remainingBalance: newRemaining });
    }
  }
  if (isDbConfigured()) {
    const { addPaymentDb } = await import("@/lib/db/bridal-orders");
    await addPaymentDb(orderId, input);
    const { autoPostCashTransaction } = await import("@/lib/db/cash-ledger");
    const cashType = input.type === "deposit" ? "order_deposit" : "order_collection";
    await autoPostCashTransaction({
      direction: "in",
      type: cashType,
      amount: input.amount,
      method: input.method,
      reference: order?.orderNumber,
      description:
        cashType === "order_deposit"
          ? `Deposit from customer`
          : `Balance received`,
      orderId,
    });
  }
}
