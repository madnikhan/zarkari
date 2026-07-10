"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CustomerMessage } from "@/lib/data/seed";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { OrderMessageThread } from "@/components/boms/StaffMessageForm";
import { PendingSupplierUpdates } from "@/components/admin/PendingSupplierUpdates";

interface Props {
  orderId: string;
  initialCustomerMessages: CustomerMessage[];
  initialSupplierMessages: CustomerMessage[];
  initialPendingUpdates: CustomerMessage[];
}

function mapDoc(orderId: string, doc: { id: string; data: () => Record<string, unknown> }): CustomerMessage {
  const data = doc.data();
  return {
    id: doc.id,
    orderId,
    senderType: data.senderType as CustomerMessage["senderType"],
    senderName: (data.senderName as string) ?? undefined,
    message: data.message as string,
    createdAt: data.createdAt as string,
    attachmentUrl: (data.attachmentUrl as string) ?? undefined,
    attachmentKind: (data.attachmentKind as string) ?? undefined,
    readAt: (data.readAt as string) ?? undefined,
    audience: "customer",
  };
}

export function OrderMessagesLive({
  orderId,
  initialCustomerMessages,
  initialSupplierMessages,
  initialPendingUpdates,
}: Props) {
  const { ready } = useFirebaseAuth();
  const [customerMessages, setCustomerMessages] = useState(initialCustomerMessages);
  const [supplierMessages, setSupplierMessages] = useState(initialSupplierMessages);
  const [pendingUpdates, setPendingUpdates] = useState(initialPendingUpdates);

  useEffect(() => {
    setCustomerMessages(initialCustomerMessages);
    setSupplierMessages(initialSupplierMessages);
    setPendingUpdates(initialPendingUpdates);
  }, [initialCustomerMessages, initialSupplierMessages, initialPendingUpdates]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const customerQ = query(
      collection(db, "live_orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );
    const supplierQ = query(
      collection(db, "live_orders", orderId, "supplier_messages"),
      orderBy("createdAt", "asc")
    );

    const unsubCustomer = onSnapshot(customerQ, (snapshot) => {
      if (snapshot.empty) return;
      setCustomerMessages(snapshot.docs.map((doc) => mapDoc(orderId, doc)));
    });

    const unsubSupplier = onSnapshot(supplierQ, (snapshot) => {
      if (snapshot.empty) return;
      setSupplierMessages(
        snapshot.docs.map((doc) => ({ ...mapDoc(orderId, doc), audience: "supplier" as const }))
      );
    });

    return () => {
      unsubCustomer();
      unsubSupplier();
    };
  }, [orderId, ready]);

  const customerThread = customerMessages.filter(
    (m) => !m.audience || m.audience === "customer"
  );

  return (
    <>
      {customerThread.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Customer thread</h3>
          <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {customerThread.map((m) => (
              <li key={m.id} className="bg-slate-50 rounded-lg px-3 py-2 capitalize text-xs text-slate-500">
                {m.senderType}: <span className="text-slate-800 normal-case">{m.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PendingSupplierUpdates orderId={orderId} pending={pendingUpdates} />

      <OrderMessageThread
        orderId={orderId}
        audience="customer"
        title="Message customer"
        placeholder="Note for customer (visible on my-order portal)"
        successHint="Delivered to customer portal — they will be notified."
        messages={customerThread.filter((m) => m.senderType !== "customer")}
        showStatus={false}
      />

      <OrderMessageThread
        orderId={orderId}
        audience="supplier"
        title="Message supplier"
        placeholder="Instructions for supplier (visible on supplier portal)"
        successHint="Delivered to supplier — they will be notified."
        messages={supplierMessages}
        showStatus
      />
    </>
  );
}
