"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { BridalOrder, CustomerMessage } from "@/lib/data/seed";
import { MyBridalOrder } from "@/components/customer/MyBridalOrder";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { collection, orderBy, query } from "firebase/firestore";

interface Props {
  order: BridalOrder;
  files: Parameters<typeof MyBridalOrder>[0]["files"];
  initialMessages: CustomerMessage[];
  onSendMessage: (message: string) => Promise<boolean>;
}

export function MyBridalOrderLive({
  order,
  files,
  initialMessages,
  onSendMessage,
}: Props) {
  const { ready } = useFirebaseAuth();
  const [liveOrder, setLiveOrder] = useState(order);
  const [messages, setMessages] = useState(initialMessages);
  const [messageError, setMessageError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLiveOrder(order);
    setMessages(initialMessages);
  }, [order, initialMessages]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const unsubOrder = onSnapshot(doc(db, "live_orders", order.id), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setLiveOrder((prev) => ({
        ...prev,
        status: (data.status as BridalOrder["status"]) ?? prev.status,
        deliveryDate: (data.deliveryDate as string) ?? prev.deliveryDate,
      }));
    });

    const q = query(
      collection(db, "live_orders", order.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      setMessages(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          orderId: order.id,
          senderType: docSnap.data().senderType as "customer" | "staff",
          senderName: docSnap.data().senderName ?? undefined,
          message: docSnap.data().message as string,
          createdAt: docSnap.data().createdAt as string,
        }))
      );
    });

    return () => {
      unsubOrder();
      unsubMessages();
    };
  }, [order.id, ready]);

  async function handleSend(message: string) {
    setSending(true);
    setMessageError("");
    try {
      const ok = await onSendMessage(message);
      if (!ok) setMessageError("Failed to send message");
      return ok;
    } finally {
      setSending(false);
    }
  }

  return (
    <MyBridalOrder
      order={liveOrder}
      files={files}
      messages={messages}
      onSendMessage={handleSend}
      messageError={messageError}
      sending={sending}
    />
  );
}
