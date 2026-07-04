"use client";

import { MessageCircle } from "lucide-react";
import { orderConfirmationMessage, whatsAppUrl } from "@/lib/whatsapp";

interface Props {
  phone: string;
  customerName: string;
  orderNumber?: string;
  className?: string;
}

export function WhatsAppButton({ phone, customerName, orderNumber, className }: Props) {
  if (!phone?.trim()) return null;
  const message = orderNumber
    ? orderConfirmationMessage(customerName, orderNumber)
    : `Hi ${customerName}, this is ZARKARI.`;
  const href = whatsAppUrl(phone, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
      }
    >
      <MessageCircle className="h-4 w-4" />
      Message on WhatsApp
    </a>
  );
}
