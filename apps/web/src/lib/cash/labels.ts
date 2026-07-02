import type { CashTransactionType } from "@/lib/db/cash-ledger";

export const CASH_TYPE_LABELS: Record<CashTransactionType, string> = {
  order_deposit: "Order Deposit",
  order_collection: "Order Collection",
  ready_made_sale: "Ready Made Sale",
  other_in: "Others",
  supplier_payment: "Supplier Payment",
  business_expense: "Business Expenses",
  refund: "Refund",
  partner_loan: "Partners / Loans",
  other_out: "Others",
};

export const CASH_IN_TYPES: CashTransactionType[] = [
  "order_deposit",
  "order_collection",
  "ready_made_sale",
  "other_in",
];

export const CASH_OUT_TYPES: CashTransactionType[] = [
  "supplier_payment",
  "business_expense",
  "refund",
  "partner_loan",
  "other_out",
];

export function formatBusinessDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
