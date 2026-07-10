import type { Product, ProductVariant } from "@/lib/data/seed";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";

export function getSizeFromVariant(variant: ProductVariant): StandardSizeKey | null {
  const sizeOpt = variant.options.find((o) => o.name === "Size");
  if (sizeOpt && STANDARD_SIZES.includes(sizeOpt.value as StandardSizeKey)) {
    return sizeOpt.value as StandardSizeKey;
  }
  if (STANDARD_SIZES.includes(variant.title as StandardSizeKey)) {
    return variant.title as StandardSizeKey;
  }
  return null;
}

export function buildSizeStockMap(variants: ProductVariant[]): Record<StandardSizeKey, number> {
  const map = Object.fromEntries(STANDARD_SIZES.map((s) => [s, 0])) as Record<StandardSizeKey, number>;
  for (const v of variants) {
    const size = getSizeFromVariant(v);
    if (size) map[size] = v.inventoryQty;
  }
  return map;
}

export function getVariantForSize(product: Product, size: StandardSizeKey): ProductVariant | undefined {
  return product.variants.find((v) => getSizeFromVariant(v) === size);
}

export function totalProductStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + v.inventoryQty, 0);
}

export function isLowStock(variant: ProductVariant): boolean {
  const threshold = variant.lowStockThreshold ?? 2;
  return variant.inventoryQty > 0 && variant.inventoryQty <= threshold;
}

export function productHasLowStock(variants: ProductVariant[]): boolean {
  return variants.some((v) => isLowStock(v));
}

export function emptySizeStock(defaultQty = 0, mQty?: number): Record<StandardSizeKey, number> {
  return Object.fromEntries(
    STANDARD_SIZES.map((s) => [s, s === "M" ? (mQty ?? defaultQty) : 0])
  ) as Record<StandardSizeKey, number>;
}
