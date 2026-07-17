import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./index";
import { demoCargoBoxItems } from "@/lib/cargo/demo-store";
import { demoBridalOrders, demoSupplierCompletions } from "@/lib/data/seed";
import {
  computeOrderMargin,
  type OrderMarginRow,
  type OrderMarginsSummary,
} from "@/lib/finance/order-margin";

const DEFAULT_EXCHANGE_RATE = "355";

function demoCostContext(orderId: string) {
  const cargoItem = [...demoCargoBoxItems]
    .filter((i) => i.bridalOrderId === orderId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const completion = demoSupplierCompletions.find((c) => c.orderId === orderId);
  return {
    cargoCostGbp: cargoItem?.costGbp,
    manufacturingCostPkr: completion?.manufacturingCostPkr,
    exchangeRate: cargoItem?.exchangeRate,
  };
}

export async function getOrderCostContextDb(orderId: string): Promise<{
  cargoCostGbp?: string;
  manufacturingCostPkr?: string;
  exchangeRate?: string;
}> {
  if (!isDbConfigured()) return demoCostContext(orderId);

  const db = getDb();
  if (!db) return demoCostContext(orderId);

  const [cargoItem] = await db
    .select({
      costGbp: schema.cargoBoxItems.costGbp,
      exchangeRate: schema.cargoBoxItems.exchangeRate,
      boxExchangeRate: schema.cargoBoxes.exchangeRate,
    })
    .from(schema.cargoBoxItems)
    .innerJoin(schema.cargoBoxes, eq(schema.cargoBoxItems.boxId, schema.cargoBoxes.id))
    .where(eq(schema.cargoBoxItems.bridalOrderId, orderId))
    .orderBy(desc(schema.cargoBoxItems.createdAt))
    .limit(1);

  const [completion] = await db
    .select({ manufacturingCostPkr: schema.supplierCompletions.manufacturingCostPkr })
    .from(schema.supplierCompletions)
    .where(eq(schema.supplierCompletions.orderId, orderId))
    .limit(1);

  return {
    cargoCostGbp: cargoItem?.costGbp,
    manufacturingCostPkr: completion?.manufacturingCostPkr,
    exchangeRate:
      cargoItem?.exchangeRate ??
      cargoItem?.boxExchangeRate ??
      undefined,
  };
}

export async function getOrderMarginForOrderDb(orderId: string, sellingPrice: string) {
  const costContext = await getOrderCostContextDb(orderId);
  return computeOrderMargin(sellingPrice, {
    ...costContext,
    defaultExchangeRate: DEFAULT_EXCHANGE_RATE,
  });
}

export async function getOrderMarginsInPeriodDb(
  startDate: string,
  endDate: string
): Promise<OrderMarginsSummary> {
  if (!isDbConfigured()) {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T23:59:59.999Z`).getTime();
    const rows: OrderMarginRow[] = [];
    for (const order of demoBridalOrders) {
      const booked = new Date(order.bookingDate).getTime();
      if (booked < start || booked > end) continue;
      const margin = computeOrderMargin(order.totalPrice, {
        ...demoCostContext(order.id),
        defaultExchangeRate: DEFAULT_EXCHANGE_RATE,
      });
      if (margin.costGbp === null || margin.profitGbp === null || margin.marginPercent === null) {
        continue;
      }
      rows.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        bookingDate: order.bookingDate,
        sellingPriceGbp: margin.sellingPriceGbp,
        costGbp: margin.costGbp,
        profitGbp: margin.profitGbp,
        marginPercent: margin.marginPercent,
        costSource: margin.costSource!,
      });
    }
    const totalSellGbp = rows.reduce((s, r) => s + r.sellingPriceGbp, 0);
    const totalCostGbp = rows.reduce((s, r) => s + r.costGbp, 0);
    const totalProfitGbp = totalSellGbp - totalCostGbp;
    return {
      orderCount: rows.length,
      totalSellGbp,
      totalCostGbp,
      totalProfitGbp,
      marginPercent: totalSellGbp > 0 ? (totalProfitGbp / totalSellGbp) * 100 : 0,
      orders: rows,
    };
  }

  const db = getDb();
  const empty: OrderMarginsSummary = {
    orderCount: 0,
    totalSellGbp: 0,
    totalCostGbp: 0,
    totalProfitGbp: 0,
    marginPercent: 0,
    orders: [],
  };
  if (!db) return empty;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  const orders = await db
    .select({
      id: schema.bridalOrders.id,
      orderNumber: schema.bridalOrders.orderNumber,
      bookingDate: schema.bridalOrders.bookingDate,
      totalPrice: schema.bridalOrders.totalPrice,
    })
    .from(schema.bridalOrders)
    .where(
      and(
        gte(schema.bridalOrders.bookingDate, start),
        lte(schema.bridalOrders.bookingDate, end)
      )
    )
    .orderBy(desc(schema.bridalOrders.bookingDate));

  const rows: OrderMarginRow[] = [];

  for (const order of orders) {
    const costContext = await getOrderCostContextDb(order.id);
    const margin = computeOrderMargin(order.totalPrice, {
      ...costContext,
      defaultExchangeRate: DEFAULT_EXCHANGE_RATE,
    });
    if (margin.costGbp === null || margin.profitGbp === null || margin.marginPercent === null) {
      continue;
    }
    rows.push({
      orderId: order.id,
      orderNumber: order.orderNumber,
      bookingDate: order.bookingDate.toISOString(),
      sellingPriceGbp: margin.sellingPriceGbp,
      costGbp: margin.costGbp,
      profitGbp: margin.profitGbp,
      marginPercent: margin.marginPercent,
      costSource: margin.costSource!,
    });
  }

  const totalSellGbp = rows.reduce((s, r) => s + r.sellingPriceGbp, 0);
  const totalCostGbp = rows.reduce((s, r) => s + r.costGbp, 0);
  const totalProfitGbp = totalSellGbp - totalCostGbp;

  return {
    orderCount: rows.length,
    totalSellGbp,
    totalCostGbp,
    totalProfitGbp,
    marginPercent: totalSellGbp > 0 ? (totalProfitGbp / totalSellGbp) * 100 : 0,
    orders: rows,
  };
}
