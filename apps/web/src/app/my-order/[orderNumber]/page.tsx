"use client";

import { useEffect, useState } from "react";
import { MyBridalOrder } from "@/components/customer/MyBridalOrder";
import type { BridalOrder, CustomerMessage, OrderFile } from "@/lib/data/seed";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default function MyOrderDetailPage({ params }: Props) {
  const [order, setOrder] = useState<BridalOrder | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    params.then(({ orderNumber }) => {
      fetch(`/api/customer/order?orderNumber=${encodeURIComponent(orderNumber)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setError(data.error);
          else {
            setOrder(data.order);
            setFiles(data.files ?? []);
            setMessages(data.messages ?? []);
          }
        });
    });
  }, [params]);

  async function onSendMessage(message: string): Promise<boolean> {
    if (!order || !message.trim()) return false;
    setSending(true);
    setMessageError("");
    try {
      const res = await fetch("/api/customer/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageError(data.error ?? "Failed to send message");
        return false;
      }
      setMessages(data.messages ?? []);
      return true;
    } finally {
      setSending(false);
    }
  }

  if (error) return <p className="text-red-600 text-sm text-center">{error}</p>;
  if (!order) return <p className="text-charcoal/50 text-sm text-center">Loading...</p>;

  return (
    <MyBridalOrder
      order={order}
      files={files}
      messages={messages}
      onSendMessage={onSendMessage}
      messageError={messageError}
      sending={sending}
    />
  );
}
