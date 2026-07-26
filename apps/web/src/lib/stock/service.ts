import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export type StockMovementType = "receive" | "sale" | "adjustment" | "return" | "transfer";
export type StockLocation = "internal" | "storefront";

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

function qtyForLocation(
  variant: { inventoryQty: number; internalQty: number },
  location: StockLocation
): number {
  return location === "internal" ? variant.internalQty : variant.inventoryQty;
}

/** Storefront (sellable) quantity only. */
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
  location?: StockLocation;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdByUserId?: string;
}): Promise<{ quantityAfter: number; location: StockLocation } | null> {
  const db = getDb();
  if (!db) return null;

  const location: StockLocation =
    input.location ?? (input.type === "receive" ? "internal" : "storefront");

  return db.transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, input.variantId))
      .limit(1);

    if (!variant) throw new StockError("Variant not found");

    const current = qtyForLocation(variant, location);
    const nextQty = current + input.quantityDelta;
    if (nextQty < 0) {
      throw new StockError(`Insufficient ${location} stock for ${variant.title}`);
    }

    await tx
      .update(schema.productVariants)
      .set(location === "internal" ? { internalQty: nextQty } : { inventoryQty: nextQty })
      .where(eq(schema.productVariants.id, input.variantId));

    await tx.insert(schema.stockMovements).values({
      productId: input.productId,
      variantId: input.variantId,
      type: input.type,
      location,
      quantityDelta: input.quantityDelta,
      quantityAfter: nextQty,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      createdByUserId: input.createdByUserId ?? null,
    });

    return { quantityAfter: nextQty, location };
  });
}

/** Move units between internal and storefront in one transaction. */
export async function transferStock(input: {
  variantId: string;
  productId: string;
  quantity: number;
  direction: "to_storefront" | "to_internal";
  notes?: string;
  createdByUserId?: string;
}): Promise<{ internalQty: number; storefrontQty: number } | null> {
  const db = getDb();
  if (!db) return null;
  if (input.quantity <= 0) throw new StockError("Transfer quantity must be positive");

  return db.transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, input.variantId))
      .limit(1);

    if (!variant) throw new StockError("Variant not found");

    const from: StockLocation = input.direction === "to_storefront" ? "internal" : "storefront";
    const to: StockLocation = input.direction === "to_storefront" ? "storefront" : "internal";
    const fromQty = qtyForLocation(variant, from);
    const toQty = qtyForLocation(variant, to);

    if (fromQty < input.quantity) {
      throw new StockError(`Insufficient ${from} stock (have ${fromQty})`);
    }

    const nextFrom = fromQty - input.quantity;
    const nextTo = toQty + input.quantity;

    await tx
      .update(schema.productVariants)
      .set({
        internalQty: from === "internal" ? nextFrom : nextTo,
        inventoryQty: from === "storefront" ? nextFrom : nextTo,
      })
      .where(eq(schema.productVariants.id, input.variantId));

    const note =
      input.notes ??
      (input.direction === "to_storefront"
        ? `Transfer to shop (${input.quantity})`
        : `Transfer to internal (${input.quantity})`);

    await tx.insert(schema.stockMovements).values([
      {
        productId: input.productId,
        variantId: input.variantId,
        type: "transfer",
        location: from,
        quantityDelta: -input.quantity,
        quantityAfter: nextFrom,
        referenceType: "transfer",
        notes: note,
        createdByUserId: input.createdByUserId ?? null,
      },
      {
        productId: input.productId,
        variantId: input.variantId,
        type: "transfer",
        location: to,
        quantityDelta: input.quantity,
        quantityAfter: nextTo,
        referenceType: "transfer",
        notes: note,
        createdByUserId: input.createdByUserId ?? null,
      },
    ]);

    return {
      internalQty: from === "internal" ? nextFrom : nextTo,
      storefrontQty: from === "storefront" ? nextFrom : nextTo,
    };
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
      location: "storefront",
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
      location: "storefront",
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

/** Low stock is storefront-only. */
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
