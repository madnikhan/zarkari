"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { CustomerMessage } from "@/lib/data/seed";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { StaffMessageForm } from "@/components/boms/StaffMessageForm";

interface Props {
  orderId: string;
  initialMessages: CustomerMessage[];
}

export function OrderMessagesLive({ orderId, initialMessages }: Props) {
  const { ready } = useFirebaseAuth();
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const q = query(
      collection(db, "live_orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          orderId,
          senderType: doc.data().senderType as "customer" | "staff",
          senderName: doc.data().senderName ?? undefined,
          message: doc.data().message as string,
          createdAt: doc.data().createdAt as string,
        }))
      );
    });
  }, [orderId, ready]);

  return (
    <>
      {messages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
          <ul className="space-y-2 text-sm">
            {messages.map((m) => (
              <li key={m.id} className="bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400 capitalize">{m.senderType}</span>
                <p>{m.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <StaffMessageForm orderId={orderId} />
    </>
  );
}
