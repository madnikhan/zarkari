import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type StockMovementType = "receive" | "sale" | "adjustment" | "return";

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export async function getVariantStock(variantId: string): Promise<number | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({ inventoryQty: schema.productVariants.inventoryQty })
    .from(schema.productVariants)
    .where(eq(schema.productVariants.id, variantId))
    .limit(1);
  return row?.inventoryQty ?? null;
}

export async function adjustStock(input: {
  variantId: string;
  productId: string;
  quantityDelta: number;
  type: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdByUserId?: string;
}): Promise<{ quantityAfter: number } | null> {
  const db = getDb();
  if (!db) return null;

  return db.transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, input.variantId))
      .limit(1);

    if (!variant) throw new StockError("Variant not found");

    const nextQty = variant.inventoryQty + input.quantityDelta;
    if (nextQty < 0) {
      throw new StockError(`Insufficient stock for ${variant.title}`);
    }

    await tx
      .update(schema.productVariants)
      .set({ inventoryQty: nextQty })
      .where(eq(schema.productVariants.id, input.variantId));

    await tx.insert(schema.stockMovements).values({
      productId: input.productId,
      variantId: input.variantId,
      type: input.type,
      quantityDelta: input.quantityDelta,
      quantityAfter: nextQty,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      createdByUserId: input.createdByUserId ?? null,
    });

    return { quantityAfter: nextQty };
  });
}

type RetailOrderItem = {
  variantId?: string;
  productId?: string;
  quantity: number;
  title: string;
};

export async function deductForRetailOrder(
  orderId: string,
  items: RetailOrderItem[],
  createdByUserId?: string
): Promise<void> {
  for (const item of items) {
    if (!item.variantId || !item.productId) continue;
    await adjustStock({
      variantId: item.variantId,
      productId: item.productId,
      quantityDelta: -item.quantity,
      type: "sale",
      referenceType: "retail_order",
      referenceId: orderId,
      notes: item.title,
      createdByUserId,
    });
  }
}

export async function restoreForCancelledOrder(orderId: string, createdByUserId?: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const items = await db
    .select()
    .from(schema.retailOrderItems)
    .where(eq(schema.retailOrderItems.orderId, orderId));

  for (const item of items) {
    if (!item.variantId || !item.productId) continue;
    await adjustStock({
      variantId: item.variantId,
      productId: item.productId,
      quantityDelta: item.quantity,
      type: "return",
      referenceType: "retail_order",
      referenceId: orderId,
      notes: `Restored: ${item.title}`,
      createdByUserId,
    });
  }
}

export async function validateStockAvailability(
  items: { variantId: string; quantity: number; title?: string }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const item of items) {
    const qty = await getVariantStock(item.variantId);
    if (qty === null) {
      return { ok: false, error: `Product variant not found${item.title ? `: ${item.title}` : ""}` };
    }
    if (qty < item.quantity) {
      return {
        ok: false,
        error: `Insufficient stock${item.title ? ` for ${item.title}` : ""} (${qty} available)`,
      };
    }
  }
  return { ok: true };
}

export async function countLowStockVariants(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: schema.productVariants.id })
    .from(schema.productVariants)
    .where(
      sql`${schema.productVariants.inventoryQty} > 0 AND ${schema.productVariants.inventoryQty} < COALESCE(${schema.productVariants.lowStockThreshold}, 3)`
    );
  return rows.length;
}
