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

export type CashPeriodPreset = "today" | "week" | "month" | "7d" | "30d" | "90d" | "custom";

export interface PeriodBounds {
  start: string;
  end: string;
  label: string;
  preset: CashPeriodPreset;
}

function startOfWeekMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function endOfWeekSunday(dateStr: string): string {
  const start = startOfWeekMonday(dateStr);
  return shiftDate(start, 6);
}

function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

function endOfMonth(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

export function formatPeriodLabel(start: string, end: string): string {
  if (start === end) return formatBusinessDate(start);
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: start.slice(0, 4) !== end.slice(0, 4) ? "numeric" : undefined,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 400) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function resolvePeriodBounds(
  preset: CashPeriodPreset,
  from?: string,
  to?: string,
  anchorDate: string = todayDateString()
): PeriodBounds {
  const today = anchorDate;

  switch (preset) {
    case "today":
      return { start: today, end: today, label: formatBusinessDate(today), preset };
    case "week": {
      const start = startOfWeekMonday(today);
      const end = endOfWeekSunday(today);
      return { start, end, label: `This week · ${formatPeriodLabel(start, end)}`, preset };
    }
    case "month": {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return { start, end, label: `This month · ${formatPeriodLabel(start, end)}`, preset };
    }
    case "7d": {
      const start = shiftDate(today, -6);
      return { start, end: today, label: `Last 7 days`, preset };
    }
    case "30d": {
      const start = shiftDate(today, -29);
      return { start, end: today, label: `Last 30 days`, preset };
    }
    case "90d": {
      const start = shiftDate(today, -89);
      return { start, end: today, label: `Last 90 days`, preset };
    }
    case "custom": {
      const start = from?.slice(0, 10) ?? today;
      const end = to?.slice(0, 10) ?? today;
      const [s, e] = start <= end ? [start, end] : [end, start];
      return { start: s, end: e, label: formatPeriodLabel(s, e), preset };
    }
    default:
      return resolvePeriodBounds("today", from, to, anchorDate);
  }
}

export function parseCashPeriodPreset(value: string | null | undefined): CashPeriodPreset {
  const allowed: CashPeriodPreset[] = ["today", "week", "month", "7d", "30d", "90d", "custom"];
  if (value && allowed.includes(value as CashPeriodPreset)) return value as CashPeriodPreset;
  return "today";
}
