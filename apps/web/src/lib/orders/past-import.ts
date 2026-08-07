import { isBridalDressType } from "@/lib/bridal-options";
import { isBridalStatus } from "@/lib/orders/status-machine";

export const PAST_ORDER_CSV_HEADERS = [
  "orderNumber",
  "customerName",
  "customerPhone",
  "dressType",
  "totalPrice",
  "depositPaid",
  "remainingBalance",
  "bookingDate",
  "deliveryDate",
  "status",
  "supplierName",
  "notes",
] as const;

export type PastOrderCsvRow = {
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  dressType: string;
  totalPrice: string;
  depositPaid: string;
  remainingBalance?: string;
  bookingDate: string;
  deliveryDate: string;
  status: string;
  supplierName?: string;
  notes?: string;
};

export type PastOrderRowResult = {
  row: number;
  ok: boolean;
  data?: PastOrderCsvRow;
  error?: string;
};

/** Minimal CSV parse — supports quoted fields with commas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length)) rows.push(row);
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, "");
}

export function validatePastOrderRows(csvText: string): {
  results: PastOrderRowResult[];
  valid: PastOrderCsvRow[];
} {
  const table = parseCsv(csvText);
  if (!table.length) {
    return { results: [{ row: 0, ok: false, error: "CSV is empty" }], valid: [] };
  }

  const headers = table[0].map(normalizeHeader);
  const required = ["customerName", "customerPhone", "dressType", "totalPrice", "bookingDate", "deliveryDate"];
  for (const key of required) {
    if (!headers.includes(key)) {
      return {
        results: [{ row: 0, ok: false, error: `Missing column: ${key}` }],
        valid: [],
      };
    }
  }

  const results: PastOrderRowResult[] = [];
  const valid: PastOrderCsvRow[] = [];
  const seenNumbers = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const line = table[i];
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (line[idx] ?? "").trim() : "";
    };

    const customerName = get("customerName");
    const customerPhone = get("customerPhone").replace(/\s/g, "");
    const dressType = get("dressType");
    const totalPrice = get("totalPrice");
    const depositPaid = get("depositPaid") || totalPrice;
    const remainingBalance = get("remainingBalance");
    const bookingDate = get("bookingDate");
    const deliveryDate = get("deliveryDate");
    const status = get("status") || "collected";
    const orderNumber = get("orderNumber");
    const supplierName = get("supplierName");
    const notes = get("notes");

    if (!customerName || !customerPhone) {
      results.push({ row: i + 1, ok: false, error: "customerName and customerPhone required" });
      continue;
    }
    if (!isBridalDressType(dressType)) {
      results.push({
        row: i + 1,
        ok: false,
        error: `Invalid dressType "${dressType}" — use allowlist values`,
      });
      continue;
    }
    const total = parseFloat(totalPrice);
    const deposit = parseFloat(depositPaid);
    if (!Number.isFinite(total) || total < 0) {
      results.push({ row: i + 1, ok: false, error: "Invalid totalPrice" });
      continue;
    }
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > total) {
      results.push({ row: i + 1, ok: false, error: "depositPaid must be between 0 and totalPrice" });
      continue;
    }
    if (Number.isNaN(new Date(bookingDate).getTime())) {
      results.push({ row: i + 1, ok: false, error: "Invalid bookingDate (use YYYY-MM-DD)" });
      continue;
    }
    if (Number.isNaN(new Date(deliveryDate).getTime())) {
      results.push({ row: i + 1, ok: false, error: "Invalid deliveryDate (use YYYY-MM-DD)" });
      continue;
    }
    if (!isBridalStatus(status)) {
      results.push({ row: i + 1, ok: false, error: `Invalid status "${status}"` });
      continue;
    }
    if (orderNumber) {
      if (seenNumbers.has(orderNumber)) {
        results.push({ row: i + 1, ok: false, error: `Duplicate orderNumber in file: ${orderNumber}` });
        continue;
      }
      seenNumbers.add(orderNumber);
    }

    const data: PastOrderCsvRow = {
      orderNumber: orderNumber || undefined,
      customerName,
      customerPhone,
      dressType,
      totalPrice: total.toFixed(2),
      depositPaid: deposit.toFixed(2),
      remainingBalance: remainingBalance || undefined,
      bookingDate,
      deliveryDate,
      status,
      supplierName: supplierName || undefined,
      notes: notes || undefined,
    };
    results.push({ row: i + 1, ok: true, data });
    valid.push(data);
  }

  return { results, valid };
}

export function pastOrderCsvTemplate(): string {
  return `${PAST_ORDER_CSV_HEADERS.join(",")}\nBR-2024-0001,Aisha Khan,447700900123,Lehenga,1200.00,600.00,0.00,2024-03-15,2024-05-10,collected,,Completed in shop\n`;
}
