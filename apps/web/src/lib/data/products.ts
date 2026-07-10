import type { Product, ProductVariant, RetailOrder } from "./seed";
import { demoProducts, demoRetailOrders } from "./seed";
import { sanitizeImageUrl } from "@/lib/image-url";
import { createRetailOrderDb, findRetailOrderByStripeSession } from "@/lib/db/retail-orders";
import { isDbConfigured } from "@/lib/db";
import { createProductDb, updateProductDb } from "@/lib/db/cms-products";

export async function createProduct(input: {
  title: string;
  handle: string;
  description: string;
  fabric?: string;
  price: string;
  collectionHandles?: string[];
  featuredImageUrl?: string;
  images?: string[];
  inventoryQty?: number;
  sizeStock?: Partial<Record<import("@/lib/sizing").StandardSizeKey, number>>;
  published?: boolean;
  tags?: string[];
}): Promise<Product> {
  if (isDbConfigured()) {
    const dbProduct = await createProductDb({
      title: input.title,
      handle: input.handle,
      description: input.description,
      fabric: input.fabric,
      price: input.price,
      collectionHandles: input.collectionHandles,
      featuredImageUrl: input.featuredImageUrl,
      images: input.images,
      inventoryQty: input.inventoryQty,
      sizeStock: input.sizeStock,
      published: input.published,
      tags: input.tags,
    });
    if (dbProduct) {
      const existing = demoProducts.findIndex((p) => p.handle === dbProduct.handle);
      if (existing >= 0) demoProducts[existing] = dbProduct;
      else demoProducts.push(dbProduct);
      return dbProduct;
    }
  }

  const id = `prod-${Date.now()}`;
  const variant: ProductVariant = {
    id: `var-${Date.now()}`,
    title: "Default",
    price: input.price,
    inventoryQty: input.inventoryQty ?? 10,
    options: [{ name: "Title", value: "Default" }],
  };
  const product: Product = {
    id,
    handle: input.handle,
    title: input.title,
    description: input.description,
    fabric: input.fabric,
    tags: input.tags ?? [],
    featuredImageUrl: sanitizeImageUrl(input.featuredImageUrl),
    images: input.images?.length
      ? input.images.map((u) => sanitizeImageUrl(u) ?? u)
      : input.featuredImageUrl
        ? [sanitizeImageUrl(input.featuredImageUrl)!]
        : [],
    variants: [variant],
    collectionHandles: input.collectionHandles ?? [],
  };
  demoProducts.push(product);
  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<
    Pick<Product, "title" | "handle" | "description" | "fabric" | "featuredImageUrl" | "collectionHandles" | "tags">
  > & { price?: string; inventoryQty?: number; sizeStock?: Partial<Record<import("@/lib/sizing").StandardSizeKey, number>>; images?: string[]; published?: boolean }
): Promise<Product | null> {
  if (isDbConfigured()) {
    const dbProduct = await updateProductDb(id, input);
    if (dbProduct) {
      const idx = demoProducts.findIndex((p) => p.id === id);
      if (idx >= 0) demoProducts[idx] = dbProduct;
      return dbProduct;
    }
  }

  const product = demoProducts.find((p) => p.id === id);
  if (!product) return null;
  if (input.title) product.title = input.title;
  if (input.handle) product.handle = input.handle;
  if (input.description) product.description = input.description;
  if (input.fabric !== undefined) product.fabric = input.fabric;
  if (input.collectionHandles) product.collectionHandles = input.collectionHandles;
  if (input.tags) product.tags = input.tags;
  if (input.featuredImageUrl) {
    const url = sanitizeImageUrl(input.featuredImageUrl);
    product.featuredImageUrl = url;
  }
  if (input.images) {
    product.images = input.images.map((u) => sanitizeImageUrl(u) ?? u);
    if (input.images[0]) product.featuredImageUrl = sanitizeImageUrl(input.images[0]);
  }
  if (input.price && product.variants[0]) product.variants[0].price = input.price;
  if (input.inventoryQty !== undefined && product.variants[0]) product.variants[0].inventoryQty = input.inventoryQty;
  return product;
}

export function createRetailOrder(input: {
  customerEmail: string;
  customerName?: string;
  items: {
    title: string;
    quantity: number;
    price: string;
    variantId?: string;
    productId?: string;
    sizeSelection?: {
      mode: "standard" | "custom";
      label: string;
      measurements: Record<string, number>;
    };
  }[];
  stripeSessionId?: string;
}): RetailOrder {
  if (input.stripeSessionId) {
    const memExisting = demoRetailOrders.find(
      (o) => (o as RetailOrder & { stripeSessionId?: string }).stripeSessionId === input.stripeSessionId
    );
    if (memExisting) return memExisting;
  }

  const total = input.items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2);
  const orderNumber = `RT-${Date.now().toString().slice(-8)}`;

  const order: RetailOrder & { stripeSessionId?: string } = {
    id: `ro-${Date.now()}`,
    orderNumber,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    status: "paid",
    total,
    items: input.items,
    createdAt: new Date().toISOString(),
    stripeSessionId: input.stripeSessionId,
  };

  demoRetailOrders.push(order);

  if (isDbConfigured()) {
    createRetailOrderDb(input).catch(console.error);
  }

  return order;
}

export async function getRetailOrderBySession(sessionId: string): Promise<RetailOrder | null> {
  if (isDbConfigured()) {
    const dbOrder = await findRetailOrderByStripeSession(sessionId);
    if (dbOrder) return dbOrder;
  }
  return (
    demoRetailOrders.find(
      (o) => (o as RetailOrder & { stripeSessionId?: string }).stripeSessionId === sessionId
    ) ?? null
  );
}

export async function getRetailOrderByNumber(orderNumber: string): Promise<RetailOrder | null> {
  return demoRetailOrders.find((o) => o.orderNumber === orderNumber) ?? null;
}

export async function updateRetailOrderStatus(orderId: string, status: string): Promise<boolean> {
  const order = demoRetailOrders.find((o) => o.id === orderId);
  if (order) order.status = status;
  if (isDbConfigured()) {
    const { updateRetailOrderStatusDb } = await import("@/lib/db/retail-orders");
    return updateRetailOrderStatusDb(orderId, status);
  }
  return Boolean(order);
}
