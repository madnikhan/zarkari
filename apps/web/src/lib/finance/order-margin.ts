export interface OrderCostInput {
  cargoCostGbp?: string | null;
  manufacturingCostPkr?: string | null;
  exchangeRate?: string | null;
  defaultExchangeRate?: string | null;
}

export interface OrderMarginResult {
  sellingPriceGbp: number;
  costGbp: number | null;
  profitGbp: number | null;
  marginPercent: number | null;
  costSource: "cargo" | "supplier" | null;
}

export function resolveOrderCostGbp(input: OrderCostInput): {
  costGbp: number | null;
  costSource: "cargo" | "supplier" | null;
} {
  const cargo = parseFloat(input.cargoCostGbp ?? "");
  if (Number.isFinite(cargo) && cargo > 0) {
    return { costGbp: cargo, costSource: "cargo" };
  }

  const pkr = parseFloat(input.manufacturingCostPkr ?? "");
  if (!Number.isFinite(pkr) || pkr <= 0) {
    return { costGbp: null, costSource: null };
  }

  const rate =
    parseFloat(input.exchangeRate ?? "") ||
    parseFloat(input.defaultExchangeRate ?? "") ||
    0;
  if (!rate || rate <= 0) {
    return { costGbp: null, costSource: null };
  }

  return { costGbp: pkr / rate, costSource: "supplier" };
}

export function computeOrderMargin(
  sellingPrice: string | number,
  costInput: OrderCostInput
): OrderMarginResult {
  const sellingPriceGbp = parseFloat(String(sellingPrice)) || 0;
  const { costGbp, costSource } = resolveOrderCostGbp(costInput);

  if (costGbp === null) {
    return {
      sellingPriceGbp,
      costGbp: null,
      profitGbp: null,
      marginPercent: null,
      costSource: null,
    };
  }

  const profitGbp = sellingPriceGbp - costGbp;
  const marginPercent =
    sellingPriceGbp > 0 ? (profitGbp / sellingPriceGbp) * 100 : null;

  return {
    sellingPriceGbp,
    costGbp,
    profitGbp,
    marginPercent,
    costSource,
  };
}

export interface OrderMarginRow {
  orderId: string;
  orderNumber: string;
  bookingDate: string;
  sellingPriceGbp: number;
  costGbp: number;
  profitGbp: number;
  marginPercent: number;
  costSource: "cargo" | "supplier";
}

export interface OrderMarginsSummary {
  orderCount: number;
  totalSellGbp: number;
  totalCostGbp: number;
  totalProfitGbp: number;
  marginPercent: number;
  orders: OrderMarginRow[];
}
