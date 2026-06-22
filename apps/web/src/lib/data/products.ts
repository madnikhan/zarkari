import type { Product, ProductVariant, RetailOrder } from "./seed";
import { demoProducts, demoRetailOrders } from "./seed";
import { sanitizeImageUrl } from "@/lib/image-url";
import { createRetailOrderDb, findRetailOrderByStripeSession } from "@/lib/db/retail-orders";
import { isDbConfigured } from "@/lib/db";

export function createProduct(input: {
  title: string;
  handle: string;
  description: string;
  fabric?: string;
  price: string;
  collectionHandles?: string[];
  featuredImageUrl?: string;
}): Product {
  const id = `prod-${Date.now()}`;
  const variant: ProductVariant = {
    id: `var-${Date.now()}`,
    title: "Default",
    price: input.price,
    inventoryQty: 10,
    options: [{ name: "Title", value: "Default" }],
  };
  const product: Product = {
    id,
    handle: input.handle,
    title: input.title,
    description: input.description,
    fabric: input.fabric,
    tags: [],
    featuredImageUrl: sanitizeImageUrl(input.featuredImageUrl),
    images: input.featuredImageUrl ? [sanitizeImageUrl(input.featuredImageUrl)!] : [],
    variants: [variant],
    collectionHandles: input.collectionHandles ?? [],
  };
  demoProducts.push(product);
  return product;
}

export function updateProduct(
  id: string,
  input: Partial<Pick<Product, "title" | "description" | "fabric" | "featuredImageUrl">> & { price?: string }
): Product | null {
  const product = demoProducts.find((p) => p.id === id);
  if (!product) return null;
  if (input.title) product.title = input.title;
  if (input.description) product.description = input.description;
  if (input.fabric !== undefined) product.fabric = input.fabric;
  if (input.featuredImageUrl) {
    const url = sanitizeImageUrl(input.featuredImageUrl);
    product.featuredImageUrl = url;
    product.images = url ? [url] : [];
  }
  if (input.price && product.variants[0]) product.variants[0].price = input.price;
  return product;
}

export function createRetailOrder(input: {
  customerEmail: string;
  customerName?: string;
  items: { title: string; quantity: number; price: string; variantId?: string; productId?: string }[];
  stripeSessionId?: string;
}): RetailOrder {
  if (input.stripeSessionId) {
    const memExisting = demoRetailOrders.find((o) => (o as RetailOrder & { stripeSessionId?: string }).stripeSessionId === input.stripeSessionId);
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
