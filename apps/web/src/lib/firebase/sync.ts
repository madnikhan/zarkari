import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./admin";
import { isFirebaseConfigured } from "./config";
import { getCustomerStatusLabel } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";

export interface LiveOrderMessage {
  id: string;
  senderType: "customer" | "staff" | "supplier";
  senderName?: string;
  message: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentKind?: string;
  readAt?: string;
}

export interface LivePendingUpdate {
  id: string;
  senderType: "customer" | "staff" | "supplier";
  senderName?: string;
  message: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentKind?: string;
  reviewStatus?: string;
}

function messagePayload(message: LiveOrderMessage) {
  return {
    senderType: message.senderType,
    senderName: message.senderName ?? null,
    message: message.message,
    createdAt: message.createdAt,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentKind: message.attachmentKind ?? null,
    readAt: message.readAt ?? null,
  };
}

function pendingPayload(update: LivePendingUpdate) {
  return {
    senderType: update.senderType,
    senderName: update.senderName ?? null,
    message: update.message,
    createdAt: update.createdAt,
    attachmentUrl: update.attachmentUrl ?? null,
    attachmentKind: update.attachmentKind ?? null,
    reviewStatus: update.reviewStatus ?? "pending",
  };
}

export async function syncOrderLive(
  orderId: string,
  input: { status: BridalStatus | string; deliveryDate?: string }
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db
    .collection("live_orders")
    .doc(orderId)
    .set(
      {
        status: input.status,
        statusLabel: getCustomerStatusLabel(input.status as BridalStatus),
        deliveryDate: input.deliveryDate ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function syncOrderMessage(orderId: string, message: LiveOrderMessage): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db
    .collection("live_orders")
    .doc(orderId)
    .collection("messages")
    .doc(message.id)
    .set(messagePayload(message));
}

export async function syncSupplierOrderMessage(orderId: string, message: LiveOrderMessage): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db
    .collection("live_orders")
    .doc(orderId)
    .collection("supplier_messages")
    .doc(message.id)
    .set(messagePayload(message));
}

export async function syncMessageReadAt(
  orderId: string,
  messageId: string,
  readAt: string,
  collection: "messages" | "supplier_messages" = "supplier_messages"
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db
    .collection("live_orders")
    .doc(orderId)
    .collection(collection)
    .doc(messageId)
    .set({ readAt }, { merge: true });
}

export async function syncPendingUpdate(orderId: string, update: LivePendingUpdate): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db
    .collection("live_orders")
    .doc(orderId)
    .collection("pending_updates")
    .doc(update.id)
    .set(pendingPayload(update));
}

export async function removePendingUpdate(orderId: string, updateId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  await db.collection("live_orders").doc(orderId).collection("pending_updates").doc(updateId).delete();
}

export function incrementStaffUnread(userId?: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  const docId = userId ?? "shared";
  db.collection("staff_inbox")
    .doc(docId)
    .set(
      {
        unreadCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    .catch(console.error);
}

export function resetStaffUnread(userId?: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  const docId = userId ?? "shared";
  db.collection("staff_inbox")
    .doc(docId)
    .set({ unreadCount: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    .catch(console.error);
}

export function decrementStaffUnread(userId?: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  const docId = userId ?? "shared";
  db.collection("staff_inbox")
    .doc(docId)
    .set(
      {
        unreadCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    .catch(console.error);
}

export function incrementSupplierUnread(supplierId: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("supplier_inbox")
    .doc(supplierId)
    .set(
      {
        unreadCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    .catch(console.error);
}

export function resetSupplierUnread(supplierId: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("supplier_inbox")
    .doc(supplierId)
    .set({ unreadCount: 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    .catch(console.error);
}

export function decrementSupplierUnread(supplierId: string): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("supplier_inbox")
    .doc(supplierId)
    .set(
      {
        unreadCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    .catch(console.error);
}

export async function readStaffInboxUnread(userId?: string): Promise<number> {
  if (!isFirebaseConfigured()) return 0;
  const db = getAdminFirestore();
  if (!db) return 0;
  const snap = await db.collection("staff_inbox").doc(userId ?? "shared").get();
  return typeof snap.data()?.unreadCount === "number" ? Math.max(0, snap.data()!.unreadCount) : 0;
}

export async function readSupplierInboxUnread(supplierId: string): Promise<number> {
  if (!isFirebaseConfigured()) return 0;
  const db = getAdminFirestore();
  if (!db) return 0;
  const snap = await db.collection("supplier_inbox").doc(supplierId).get();
  return typeof snap.data()?.unreadCount === "number" ? Math.max(0, snap.data()!.unreadCount) : 0;
}
