export const SAMPLE_ORDER_PREFIX = "SAMPLE-BR-";
export const SAMPLE_RETAIL_PREFIX = "SAMPLE-RO-";
export const SAMPLE_THREAD_PREFIX = "sample-";
export const SAMPLE_CUSTOMER_PHONES = ["447700900123", "447700900456"] as const;

export function sampleOrderNumber(seq: number): string {
  return `${SAMPLE_ORDER_PREFIX}2026-${String(seq).padStart(4, "0")}`;
}

export function sampleRetailNumber(seq: number): string {
  return `${SAMPLE_RETAIL_PREFIX}${String(seq).padStart(4, "0")}`;
}

function dayOffset(days: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function atTime(base: Date, hours: number, minutes: number): Date {
  const d = new Date(base);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

export function todayNoon(): Date {
  return dayOffset(0);
}

export function dateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface SampleCustomerSeed {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export const SAMPLE_CUSTOMERS: SampleCustomerSeed[] = [
  { name: "Aisha Khan", phone: "447700900123", email: "aisha@example.com", address: "12 Green Lane, London E1 4AA" },
  { name: "Fatima Ahmed", phone: "447700900456", email: "fatima@example.com", address: "45 High Street, Birmingham B1 2AA" },
];

export interface SampleOrderSeed {
  orderNumber: string;
  customerIndex: number;
  status: string;
  bookingDaysAgo: number;
  deliveryDaysFromNow: number;
  totalPrice: string;
  depositPaid: string;
  remainingBalance: string;
  dressType: string;
  colour?: string;
  size?: string;
  customisationNotes?: string;
}

export const SAMPLE_ORDERS: SampleOrderSeed[] = [
  {
    orderNumber: sampleOrderNumber(152),
    customerIndex: 0,
    status: "embroidery",
    bookingDaysAgo: 28,
    deliveryDaysFromNow: 45,
    totalPrice: "1000.00",
    depositPaid: "500.00",
    remainingBalance: "500.00",
    dressType: "Bridal Lehenga",
    colour: "Maroon Gold",
    size: "M",
    customisationNotes: "Heavy zari on dupatta border",
  },
  {
    orderNumber: sampleOrderNumber(148),
    customerIndex: 1,
    status: "sent_to_supplier",
    bookingDaysAgo: 24,
    deliveryDaysFromNow: 56,
    totalPrice: "850.00",
    depositPaid: "425.00",
    remainingBalance: "425.00",
    dressType: "Walima Gown",
    colour: "Ivory",
    size: "S",
  },
  {
    orderNumber: sampleOrderNumber(140),
    customerIndex: 0,
    status: "ready_for_collection",
    bookingDaysAgo: 90,
    deliveryDaysFromNow: -10,
    totalPrice: "1200.00",
    depositPaid: "600.00",
    remainingBalance: "600.00",
    dressType: "Mehndi Outfit",
  },
  {
    orderNumber: sampleOrderNumber(135),
    customerIndex: 1,
    status: "stitching",
    bookingDaysAgo: 14,
    deliveryDaysFromNow: 3,
    totalPrice: "950.00",
    depositPaid: "475.00",
    remainingBalance: "475.00",
    dressType: "Reception Saree",
    colour: "Emerald",
    size: "M",
  },
  {
    orderNumber: sampleOrderNumber(130),
    customerIndex: 0,
    status: "collected",
    bookingDaysAgo: 120,
    deliveryDaysFromNow: -30,
    totalPrice: "1100.00",
    depositPaid: "1100.00",
    remainingBalance: "0.00",
    dressType: "Nikah Dress",
  },
  {
    orderNumber: sampleOrderNumber(125),
    customerIndex: 1,
    status: "refunded",
    bookingDaysAgo: 60,
    deliveryDaysFromNow: -20,
    totalPrice: "800.00",
    depositPaid: "400.00",
    remainingBalance: "0.00",
    dressType: "Engagement Lehenga",
  },
  {
    orderNumber: sampleOrderNumber(120),
    customerIndex: 0,
    status: "finishing",
    bookingDaysAgo: 21,
    deliveryDaysFromNow: -3,
    totalPrice: "900.00",
    depositPaid: "450.00",
    remainingBalance: "450.00",
    dressType: "Party Wear",
    colour: "Blush",
    size: "L",
  },
  {
    orderNumber: sampleOrderNumber(115),
    customerIndex: 1,
    status: "order_created",
    bookingDaysAgo: 2,
    deliveryDaysFromNow: 5,
    totalPrice: "750.00",
    depositPaid: "0.00",
    remainingBalance: "750.00",
    dressType: "Cocktail Dress",
    size: "S",
  },
];

export interface SampleCashTxSeed {
  dayOffset: number;
  hours: number;
  minutes: number;
  direction: "in" | "out";
  type: string;
  amount: string;
  method: "cash" | "online";
  reference: string;
  description: string;
}

export const SAMPLE_CASH_TODAY: SampleCashTxSeed[] = [
  { dayOffset: 0, hours: 10, minutes: 45, direction: "in", type: "order_deposit", amount: "100.00", method: "cash", reference: "ORD-1150", description: "Deposit from customer" },
  { dayOffset: 0, hours: 10, minutes: 0, direction: "in", type: "order_collection", amount: "450.00", method: "online", reference: "ORD-1050", description: "Balance received" },
  { dayOffset: 0, hours: 9, minutes: 15, direction: "in", type: "ready_made_sale", amount: "500.00", method: "online", reference: "INV-1046", description: "Maxi Dress" },
  { dayOffset: 0, hours: 8, minutes: 30, direction: "in", type: "other_in", amount: "800.00", method: "cash", reference: "MISC-01", description: "Misc cash in" },
  { dayOffset: 0, hours: 14, minutes: 30, direction: "out", type: "supplier_payment", amount: "300.00", method: "cash", reference: "SUP-005", description: "Fabric supplier" },
  { dayOffset: 0, hours: 13, minutes: 15, direction: "out", type: "business_expense", amount: "180.00", method: "online", reference: "EXP-012", description: "Rent" },
  { dayOffset: 0, hours: 12, minutes: 0, direction: "out", type: "business_expense", amount: "70.00", method: "online", reference: "EXP-013", description: "Electricity bill" },
  { dayOffset: 0, hours: 11, minutes: 0, direction: "out", type: "refund", amount: "50.00", method: "online", reference: "REF-003", description: "Customer refund" },
];

export function buildSampleCashHistory(): SampleCashTxSeed[] {
  const rows: SampleCashTxSeed[] = [...SAMPLE_CASH_TODAY];
  for (let day = 1; day <= 6; day++) {
    rows.push({
      dayOffset: -day,
      hours: 11,
      minutes: 0,
      direction: "in",
      type: "order_deposit",
      amount: (120 + day * 15).toFixed(2),
      method: day % 2 === 0 ? "cash" : "online",
      reference: `ORD-${1100 + day}`,
      description: "Sample deposit",
    });
    rows.push({
      dayOffset: -day,
      hours: 15,
      minutes: 30,
      direction: "out",
      type: "business_expense",
      amount: (40 + day * 10).toFixed(2),
      method: "cash",
      reference: `EXP-${100 + day}`,
      description: "Sample expense",
    });
  }
  return rows;
}

export function occurredAtFromSeed(seed: SampleCashTxSeed): { businessDate: string; occurredAt: Date } {
  const base = dayOffset(seed.dayOffset);
  const occurredAt = atTime(base, seed.hours, seed.minutes);
  return { businessDate: dateString(base), occurredAt };
}

export const SAMPLE_OPENING_TODAY = { cashInHand: "1000.00", onlineBank: "600.00" };

export const SAMPLE_SOCIAL_THREADS = [
  {
    platform: "instagram",
    externalThreadId: "sample-ig-1",
    contactName: "Aisha K.",
    contactHandle: "@aisha_formal",
    preview: "Do you have Guldaan in size M for August wedding?",
    subject: "Guldaan enquiry",
    hoursAgo: 1,
  },
  {
    platform: "whatsapp",
    externalThreadId: "sample-wa-1",
    contactName: "Sara M.",
    contactPhone: "447700900789",
    preview: "Can I book a fitting this Saturday?",
    subject: "Fitting request",
    hoursAgo: 3,
  },
  {
    platform: "tiktok",
    externalThreadId: "sample-tt-1",
    contactName: "Nadia R.",
    contactHandle: "@nadia_styles",
    preview: "How much is Bella Luna gown?",
    subject: "TikTok DM",
    hoursAgo: 5,
  },
] as const;
