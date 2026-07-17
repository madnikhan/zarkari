import type { BridalOrder, RetailOrder } from "@/lib/data/seed";
import type { StoreInvoiceData } from "./store-invoice-html";

function enGbDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB");
}

export function retailOrderToInvoice(order: RetailOrder): StoreInvoiceData {
  const method = order.paymentMethod ?? "cash";
  const isCash = method === "cash";
  const isOnline = method === "card" || method === "stripe";

  return {
    serialNo: order.orderNumber,
    orderNumber: order.orderNumber,
    date: enGbDate(order.createdAt),
    customerName: order.customerName?.trim() || "Ready-made customer",
    customerPhone: order.customerPhone,
    descriptionLines: order.items.map((item) => ({
      description: item.sizeSelection?.label
        ? `${item.title} (${item.sizeSelection.label})`
        : item.title,
      quantity: item.quantity,
      amount: (parseFloat(item.price) * item.quantity).toFixed(2),
    })),
    collectionLabel: order.source === "walk_in" ? `Collected · ${enGbDate(order.createdAt)}` : "—",
    totalAmount: order.total,
    deposit: order.total,
    balance: "0.00",
    paymentCash: isCash,
    paymentOnline: isOnline,
  };
}

export function bridalOrderToInvoice(
  order: BridalOrder,
  customerName: string,
  customerPhone?: string,
  dressDescription?: string
): StoreInvoiceData {
  const desc =
    [order.dressType, dressDescription?.trim() || order.customisationNotes?.trim()]
      .filter(Boolean)
      .join(" — ") || `Bridal / custom order ${order.orderNumber}`;

  return {
    serialNo: order.orderNumber,
    orderNumber: order.orderNumber,
    date: enGbDate(order.bookingDate),
    customerName: customerName || "Customer",
    customerPhone,
    descriptionLines: [{ description: desc, amount: order.totalPrice }],
    collectionLabel: order.deliveryDate
      ? enGbDate(order.deliveryDate)
      : "—",
    totalAmount: order.totalPrice,
    deposit: order.depositPaid,
    balance: order.remainingBalance,
    paymentCash: false,
    paymentOnline: parseFloat(order.depositPaid || "0") > 0,
  };
}
