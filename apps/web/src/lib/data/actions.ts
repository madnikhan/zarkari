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
    filesUnlockedAt: Date | null;
    lastSupplierActionAt: Date | null;
    supplierLocked: boolean;
    remainingBalance: string;
    depositPaid: string;
  }>
) {
  if (isDbConfigured()) {
    const { updateBridalOrderDb } = await import("@/lib/db/bridal-orders");
    await updateBridalOrderDb(orderId, patch);
  }

  if (patch.status) {
    const order = await resolveOrder(orderId);
    if (order) {
      const { syncOrderLive } = await import("@/lib/firebase/sync");
      await syncOrderLive(orderId, { status: patch.status, deliveryDate: order.deliveryDate }).catch(console.error);
      const { sendPushToOrderCustomer } = await import("@/lib/push/send");
      await sendPushToOrderCustomer(orderId, {
        title: "Order update",
        body: `${order.orderNumber}: status updated`,
        href: `/my-order/${order.orderNumber}`,
        orderId,
      }).catch(console.error);
    }
  }
}

async function notify(title: string, body: string, orderId?: string, href?: string, threadId?: string) {
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
    const { createNotificationDb } = await import("@/lib/db/notifications");
    await createNotificationDb({ orderId, title, body, href, threadId }).catch(console.error);
  }
  const { sendPushToStaff } = await import("@/lib/push/send");
  await sendPushToStaff({
    title,
    body,
    href: href ?? (orderId ? `/admin/orders/${orderId}` : threadId ? `/admin/inbox/${threadId}` : undefined),
    orderId,
    urgent: true,
  }).catch(console.error);
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
  measurements?: import("@/lib/measurements/bridal-form").BridalMeasurements;
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
        measurements: input.measurements,
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
    measurements: input.measurements,
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
  import("@/lib/push/send")
    .then((m) =>
      m.sendPushToSuppliers({
        title: "New order assigned",
        body: order.orderNumber,
        href: `/supplier/orders/${orderId}`,
        orderId,
        urgent: true,
      })
    )
    .catch(console.error);
  return order;
}

function within24Hours(iso?: string) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= 24 * 60 * 60 * 1000;
}

export async function supplierRevertAccept(orderId: string, reason: string, supplierName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  if (order.status !== "order_received") throw new Error("Order cannot be reverted in current status");
  if (!within24Hours(order.lastSupplierActionAt)) throw new Error("You can only revert within 24 hours");

  order.status = "sent_to_supplier";
  order.filesUnlockedAt = undefined;
  order.lastSupplierActionAt = new Date().toISOString();
  await syncOrderPatch(orderId, {
    status: "sent_to_supplier",
    filesUnlockedAt: null,
    lastSupplierActionAt: new Date(),
  });
  await syncTimeline(orderId, "stage_update", {
    comment: `Supplier reverted acceptance: ${reason}`,
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  return order;
}

export async function supplierRevertStage(
  orderId: string,
  prevStage: BridalStatus,
  reason: string,
  supplierName?: string
) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  if (!within24Hours(order.lastSupplierActionAt)) throw new Error("You can only revert within 24 hours");
  if (order.supplierLocked) throw new Error("Order is locked");

  order.status = prevStage;
  order.lastSupplierActionAt = new Date().toISOString();
  await syncOrderPatch(orderId, { status: prevStage, lastSupplierActionAt: new Date() });
  await syncTimeline(orderId, "stage_update", {
    comment: `Supplier reverted stage to ${prevStage.replace(/_/g, " ")}: ${reason}`,
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  return order;
}

export async function supplierAccept(orderId: string, supplierName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  order.status = "order_received";
  order.filesUnlockedAt = new Date().toISOString();
  order.lastSupplierActionAt = new Date().toISOString();
  await syncOrderPatch(orderId, {
    status: "order_received",
    filesUnlockedAt: new Date(),
    lastSupplierActionAt: new Date(),
  });
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
  order.lastSupplierActionAt = new Date().toISOString();
  await syncOrderPatch(orderId, { status: stage, lastSupplierActionAt: new Date() });
  await syncTimeline(orderId, "stage_update", {
    comment: stage.replace(/_/g, " "),
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  const { getStatusLabel } = await import("@/lib/orders/status-machine");
  await notify(
    "Supplier updated stage",
    `${order.orderNumber} → ${getStatusLabel(stage)}`,
    orderId,
    `/admin/orders/${orderId}`
  );
  return order;
}

export async function markReceivedAtShop(orderId: string, byName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  if (order.status !== "delivered_to_shop") {
    throw new Error("Order can only be marked ready for collection after it arrives in the UK");
  }
  order.status = "ready_for_collection";
  await syncOrderPatch(orderId, { status: "ready_for_collection" });
  await syncTimeline(orderId, "ready_for_collection", { performedByName: byName, performedByRole: "staff" });
  notify("Order ready for collection", order.orderNumber, orderId);
  return order;
}

export async function markArrivedAtUkBoutique(orderId: string, byName?: string) {
  const order = await resolveOrder(orderId);
  if (!order) return null;
  if (order.status !== "shipping") {
    throw new Error("Order can only be marked arrived in the UK when it is dispatched/shipping");
  }
  order.status = "delivered_to_shop";
  await syncOrderPatch(orderId, { status: "delivered_to_shop" });
  await syncTimeline(orderId, "received_at_shop", { performedByName: byName, performedByRole: "staff" });
  notify("Order arrived at UK boutique", order.orderNumber, orderId);
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
  input: {
    deliveryDate: string;
    billNumber: string;
    courierName?: string;
    trackingNumber?: string;
    manufacturingCostPkr?: string;
    photoUrl?: string;
  },
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
    manufacturingCostPkr: input.manufacturingCostPkr,
  });
  if (isDbConfigured()) {
    const { addSupplierCompletionDb } = await import("@/lib/db/bridal-orders");
    await addSupplierCompletionDb(orderId, input);
  }
  if (input.photoUrl) await addOrderFile(orderId, "completion", "completion-photo.jpg", input.photoUrl);
  // Supplier dispatches from Pakistan; shop marks arrival in the UK later.
  order.status = "shipping";
  order.supplierLocked = true;
  await syncOrderPatch(orderId, { status: "shipping", supplierLocked: true });
  await syncTimeline(orderId, "stage_update", {
    comment: `Dispatched from Pakistan — Bill ${input.billNumber}${input.trackingNumber ? `, Tracking ${input.trackingNumber}` : ""}`,
    performedByName: supplierName,
    performedByRole: "supplier",
  });
  notify("Supplier completed order", order.orderNumber, orderId);
  if (order.supplierId) {
    const { addSupplierLedgerEntry } = await import("@/lib/supplier-ledger/service");
    await addSupplierLedgerEntry({
      supplierId: order.supplierId,
      type: "bill",
      orderId,
      billNumber: input.billNumber,
      description: `Order ${order.orderNumber} — Bill ${input.billNumber}`,
      amountPkr: input.manufacturingCostPkr ?? "0",
      businessDate: input.deliveryDate?.slice(0, 10),
    });
  }
  return order;
}

async function persistMessage(
  orderId: string,
  input: {
    senderType: "customer" | "staff" | "supplier";
    senderName?: string;
    message: string;
    audience?: "customer" | "supplier" | "internal";
    attachmentUrl?: string;
    attachmentKind?: string;
    reviewStatus?: "pending" | "forwarded" | "dismissed";
    forwardedFromId?: string;
  }
) {
  const createdAt = new Date().toISOString();
  const demoEntry = {
    id: `msg-${Date.now()}`,
    orderId,
    ...input,
    audience: input.audience ?? "customer",
    createdAt,
  };

  if (!isDbConfigured()) {
    demoMessages.push(demoEntry);
    return demoEntry;
  }

  const { addMessageDb } = await import("@/lib/db/bridal-orders");
  const saved = await addMessageDb(orderId, input);
  return saved ?? demoEntry;
}

async function syncMessageToFirestore(
  orderId: string,
  message: {
    id: string;
    senderType: "customer" | "staff" | "supplier";
    senderName?: string;
    message: string;
    createdAt: string;
    audience?: string;
    attachmentUrl?: string;
    attachmentKind?: string;
    readAt?: string;
    reviewStatus?: string;
  }
) {
  const payload = {
    id: message.id,
    senderType: message.senderType,
    senderName: message.senderName,
    message: message.message,
    createdAt: message.createdAt,
    attachmentUrl: message.attachmentUrl,
    attachmentKind: message.attachmentKind,
    readAt: message.readAt,
  };

  const { syncOrderMessage, syncSupplierOrderMessage, syncPendingUpdate } = await import("@/lib/firebase/sync");
  if (message.audience === "supplier") {
    await syncSupplierOrderMessage(orderId, payload).catch(console.error);
  } else if (message.audience === "internal") {
    await syncPendingUpdate(orderId, {
      ...payload,
      reviewStatus: message.reviewStatus ?? "pending",
    }).catch(console.error);
  } else if (message.audience === "customer" || !message.audience) {
    await syncOrderMessage(orderId, payload).catch(console.error);
  }
}

export async function addCustomerMessage(orderId: string, message: string, senderName?: string) {
  const saved = await persistMessage(orderId, {
    senderType: "customer",
    senderName,
    message,
    audience: "customer",
  });
  await syncMessageToFirestore(orderId, saved);

  const order = await resolveOrder(orderId);
  if (order) {
    await notify(
      "Customer message",
      `${order.orderNumber}: ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
      orderId,
      `/admin/orders/${orderId}`
    );
  }
}

export async function addStaffMessage(
  orderId: string,
  message: string,
  senderName?: string,
  audience: "customer" | "supplier" = "customer",
  extras?: { attachmentUrl?: string; attachmentKind?: string }
) {
  const saved = await persistMessage(orderId, {
    senderType: "staff",
    senderName,
    message,
    audience,
    attachmentUrl: extras?.attachmentUrl,
    attachmentKind: extras?.attachmentKind,
  });
  await syncMessageToFirestore(orderId, saved);

  const order = await resolveOrder(orderId);
  if (!order) return;

  if (audience === "customer") {
    const { sendPushToOrderCustomer } = await import("@/lib/push/send");
    await sendPushToOrderCustomer(orderId, {
      title: "Message from ZARKARI",
      body: message.slice(0, 120),
      href: `/my-order/${order.orderNumber}`,
      orderId,
      urgent: true,
    }).catch(console.error);
    return;
  }

  const { sendPushToSuppliers } = await import("@/lib/push/send");
  await sendPushToSuppliers({
    title: "Message from ZARKARI",
    body: `${order.orderNumber}: ${message.slice(0, 100)}`,
    href: `/supplier/orders/${orderId}`,
    orderId,
    urgent: true,
  }).catch(console.error);

  if (order.supplierId) {
    const { incrementSupplierUnread } = await import("@/lib/firebase/sync");
    incrementSupplierUnread(order.supplierId);
  }
}

export async function addSupplierMessage(orderId: string, message: string, senderName?: string) {
  const saved = await persistMessage(orderId, {
    senderType: "supplier",
    senderName,
    message,
    audience: "supplier",
  });
  await syncMessageToFirestore(orderId, saved);

  const order = await resolveOrder(orderId);
  if (order) {
    await notify(
      "Supplier message",
      `${order.orderNumber}: ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
      orderId,
      `/admin/orders/${orderId}`
    );
  }
}

export async function addSupplierProgressUpdate(
  orderId: string,
  input: { message?: string; fileUrl: string; fileName: string; attachmentKind: string; senderName?: string }
) {
  await addOrderFile(orderId, "supplier_progress", input.fileName, input.fileUrl);

  const note = input.message?.trim() || "Progress photo/video uploaded";
  const saved = await persistMessage(orderId, {
    senderType: "supplier",
    senderName: input.senderName,
    message: note,
    audience: "internal",
    attachmentUrl: input.fileUrl,
    attachmentKind: input.attachmentKind,
    reviewStatus: "pending",
  });
  await syncMessageToFirestore(orderId, saved);

  const order = await resolveOrder(orderId);
  if (order) {
    await notify(
      "Supplier progress update",
      `${order.orderNumber}: ${note.slice(0, 80)}`,
      orderId,
      `/admin/orders/${orderId}`
    );
  }

  return saved;
}

export async function forwardSupplierUpdate(
  orderId: string,
  internalMessageId: string,
  staffName?: string,
  customerNote?: string
) {
  const { getMessageDb, updateMessageDb } = await import("@/lib/db/bridal-orders");
  const internal = isDbConfigured()
    ? await getMessageDb(internalMessageId)
    : demoMessages.find((m) => m.id === internalMessageId);

  if (!internal || internal.audience !== "internal" || internal.reviewStatus !== "pending") {
    throw new Error("Update not found or already handled");
  }

  const body =
    customerNote?.trim() ||
    internal.message ||
    "Your order is progressing well — here is a new update from our team.";

  await addStaffMessage(orderId, body, staffName, "customer", {
    attachmentUrl: internal.attachmentUrl,
    attachmentKind: internal.attachmentKind,
  });

  if (isDbConfigured()) {
    await updateMessageDb(internalMessageId, { reviewStatus: "forwarded" });
  } else {
    const idx = demoMessages.findIndex((m) => m.id === internalMessageId);
    if (idx >= 0) demoMessages[idx].reviewStatus = "forwarded";
  }

  const { removePendingUpdate } = await import("@/lib/firebase/sync");
  await removePendingUpdate(orderId, internalMessageId).catch(console.error);
}

export async function dismissSupplierUpdate(orderId: string, internalMessageId: string) {
  if (isDbConfigured()) {
    const { updateMessageDb } = await import("@/lib/db/bridal-orders");
    await updateMessageDb(internalMessageId, { reviewStatus: "dismissed" });
  } else {
    const idx = demoMessages.findIndex((m) => m.id === internalMessageId && m.orderId === orderId);
    if (idx >= 0) demoMessages[idx].reviewStatus = "dismissed";
  }

  const { removePendingUpdate } = await import("@/lib/firebase/sync");
  await removePendingUpdate(orderId, internalMessageId).catch(console.error);
}

export async function markSupplierMessagesRead(orderId: string) {
  const nowIso = new Date().toISOString();
  const readIds: string[] = [];

  if (!isDbConfigured()) {
    demoMessages.forEach((m) => {
      if (m.orderId === orderId && m.audience === "supplier" && m.senderType === "staff" && !m.readAt) {
        m.readAt = nowIso;
        readIds.push(m.id);
      }
    });
  } else {
    const { getMessagesDb, updateMessageDb } = await import("@/lib/db/bridal-orders");
    const messages = await getMessagesDb(orderId, "supplier");
    const now = new Date();
    for (const m of messages) {
      if (m.senderType === "staff" && !m.readAt) {
        await updateMessageDb(m.id, { readAt: now });
        readIds.push(m.id);
      }
    }
  }

  if (readIds.length) {
    const { syncMessageReadAt } = await import("@/lib/firebase/sync");
    await Promise.all(
      readIds.map((id) => syncMessageReadAt(orderId, id, nowIso, "supplier_messages").catch(console.error))
    );
  }
}

export async function addOrderFile(orderId: string, category: string, fileName: string, url: string) {
  demoOrderFiles.push({ id: `f-${Date.now()}`, orderId, category, fileName, url });
  if (isDbConfigured()) {
    const { addOrderFileDb } = await import("@/lib/db/bridal-orders");
    await addOrderFileDb(orderId, { category, fileName, url });
  }
}

export async function markAllNotificationsRead(staffUserId?: string) {
  demoNotifications.forEach((n) => {
    if (!n.userId || n.userId === staffUserId) n.read = true;
  });
  if (isDbConfigured()) {
    const { markAllStaffNotificationsReadDb } = await import("@/lib/db/notifications");
    await markAllStaffNotificationsReadDb(staffUserId).catch(console.error);
  }
}

export async function recordPayment(
  orderId: string,
  input: { type: string; amount: string; method?: string; businessDate?: string; description?: string }
) {
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
        input.description ??
        (cashType === "order_deposit" ? `Deposit from customer` : `Balance received`),
      orderId,
      businessDate: input.businessDate,
    });
  }
}
