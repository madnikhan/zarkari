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

export function syncOrderLive(
  orderId: string,
  input: { status: BridalStatus | string; deliveryDate?: string }
): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("live_orders")
    .doc(orderId)
    .set(
      {
        status: input.status,
        statusLabel: getCustomerStatusLabel(input.status as BridalStatus),
        deliveryDate: input.deliveryDate ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    .catch(console.error);
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

export function syncOrderMessage(orderId: string, message: LiveOrderMessage): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("live_orders")
    .doc(orderId)
    .collection("messages")
    .doc(message.id)
    .set(messagePayload(message))
    .catch(console.error);
}

export function syncSupplierOrderMessage(orderId: string, message: LiveOrderMessage): void {
  if (!isFirebaseConfigured()) return;
  const db = getAdminFirestore();
  if (!db) return;

  db.collection("live_orders")
    .doc(orderId)
    .collection("supplier_messages")
    .doc(message.id)
    .set(messagePayload(message))
    .catch(console.error);
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
