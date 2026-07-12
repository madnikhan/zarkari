"use client";

import { useEffect, useState } from "react";
import { MyBridalOrderLive } from "@/components/customer/MyBridalOrderLive";
import type { BridalOrder, CustomerMessage, OrderFile } from "@/lib/data/seed";

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default function MyOrderDetailPage({ params }: Props) {
  const [order, setOrder] = useState<BridalOrder | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [cancellationReason, setCancellationReason] = useState<string | undefined>();
  const [refundReason, setRefundReason] = useState<string | undefined>();
  const [error, setError] = useState("");

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
            setCancellationReason(data.cancellationReason);
            setRefundReason(data.refundReason);
          }
        });
    });
  }, [params]);

  async function onSendMessage(message: string): Promise<boolean> {
    if (!order || !message.trim()) return false;
    try {
      const res = await fetch("/api/customer/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return false;
      if (data.messages) setMessages(data.messages ?? []);
      return true;
    } catch {
      return false;
    }
  }

  if (error) return <p className="text-red-600 text-sm text-center">{error}</p>;
  if (!order) return <p className="text-charcoal/50 text-sm text-center">Loading...</p>;

  return (
    <MyBridalOrderLive
      order={order}
      files={files}
      initialMessages={messages}
      cancellationReason={cancellationReason}
      refundReason={refundReason}
      onSendMessage={onSendMessage}
    />
  );
}
