import {
  demoProducts,
  demoCollections,
  demoBlogPosts,
  demoBridalOrders,
  demoCustomers,
  demoSuppliers,
  demoTimeline,
  demoOrderFiles,
  demoMessages,
  demoShopSettings,
  demoRedesigns,
  demoCancellations,
  demoRefunds,
  demoOrderCollections,
  demoSupplierCompletions,
  demoPayments,
  demoRetailOrders,
  demoNotifications,
  type Product,
  type Collection,
  type BlogPost,
  type BridalOrder,
  type Customer,
  type Supplier,
  type TimelineEvent,
  type OrderFile,
  type CustomerMessage,
} from "./seed";
import { sanitizeImageUrl } from "@/lib/image-url";

function sanitizeProduct(product: Product): Product {
  return {
    ...product,
    featuredImageUrl: sanitizeImageUrl(product.featuredImageUrl),
    images: product.images.map((img) => sanitizeImageUrl(img) ?? img),
  };
}

function sanitizeCollection(collection: Collection): Collection {
  return { ...collection, imageUrl: sanitizeImageUrl(collection.imageUrl) };
}

function sanitizeBlogPost(post: BlogPost): BlogPost {
  return { ...post, imageUrl: sanitizeImageUrl(post.imageUrl) };
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function getProducts(limit = 12): Promise<Product[]> {
  return demoProducts.slice(0, limit).map(sanitizeProduct);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const product = demoProducts.find((p) => p.handle === handle);
  return product ? sanitizeProduct(product) : null;
}

export async function getCollections(): Promise<Collection[]> {
  return demoCollections.map(sanitizeCollection);
}

export async function getCollectionByHandle(handle: string): Promise<(Collection & { products: Product[] }) | null> {
  const collection = demoCollections.find((c) => c.handle === handle);
  if (!collection) return null;
  const products =
    handle === "catalogue"
      ? demoProducts.map(sanitizeProduct)
      : demoProducts.filter((p) => p.collectionHandles.includes(handle)).map(sanitizeProduct);
  return { ...sanitizeCollection(collection), products };
}

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  return demoBlogPosts.slice(0, limit).map(sanitizeBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = demoBlogPosts.find((p) => p.slug === slug);
  return post ? sanitizeBlogPost(post) : null;
}

export async function getShopSettings() {
  return demoShopSettings;
}

export async function getBridalOrders(filters?: { supplierId?: string; status?: string }): Promise<BridalOrder[]> {
  let orders = [...demoBridalOrders];
  if (filters?.supplierId) orders = orders.filter((o) => o.supplierId === filters.supplierId);
  if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
  return orders.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
}

export async function getBridalOrderById(id: string): Promise<BridalOrder | null> {
  return demoBridalOrders.find((o) => o.id === id) ?? null;
}

export async function getBridalOrderByNumber(orderNumber: string): Promise<BridalOrder | null> {
  return demoBridalOrders.find((o) => o.orderNumber === orderNumber) ?? null;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return demoCustomers.find((c) => c.id === id) ?? null;
}

export async function getCustomers(): Promise<Customer[]> {
  return demoCustomers;
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  return demoSuppliers.find((s) => s.id === id) ?? null;
}

export async function getSuppliers(): Promise<Supplier[]> {
  return demoSuppliers;
}

export async function getTimeline(orderId: string): Promise<TimelineEvent[]> {
  return demoTimeline.filter((e) => e.orderId === orderId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getOrderFiles(orderId: string, includeSensitive = true): Promise<OrderFile[]> {
  const files = demoOrderFiles.filter((f) => f.orderId === orderId);
  if (includeSensitive) return files;
  return [];
}

export async function getMessages(orderId: string): Promise<CustomerMessage[]> {
  return demoMessages.filter((m) => m.orderId === orderId);
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = demoProducts.find((p) => p.id === id);
  return product ? sanitizeProduct(product) : null;
}

export async function getRedesigns(orderId: string) {
  return demoRedesigns.filter((r) => r.orderId === orderId);
}

export async function getCancellations(orderId?: string) {
  return orderId ? demoCancellations.filter((c) => c.orderId === orderId) : demoCancellations;
}

export async function getRefunds(orderId?: string) {
  return orderId ? demoRefunds.filter((r) => r.orderId === orderId) : demoRefunds;
}

export async function getCollectionRecord(orderId: string) {
  return demoOrderCollections.find((c) => c.orderId === orderId) ?? null;
}

export async function getPayments(orderId: string) {
  return demoPayments.filter((p) => p.orderId === orderId);
}

export async function getRetailOrders() {
  if (isDbConfigured()) {
    const { listRetailOrdersDb } = await import("@/lib/db/retail-orders");
    const dbOrders = await listRetailOrdersDb();
    if (dbOrders.length) return dbOrders;
  }
  return demoRetailOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNotifications(unreadOnly = false) {
  let list = [...demoNotifications];
  if (unreadOnly) list = list.filter((n) => !n.read);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReportsData(period: "daily" | "weekly" | "monthly" | "yearly" = "monthly") {
  const now = new Date();
  const start = new Date(now);
  if (period === "daily") start.setDate(start.getDate() - 1);
  else if (period === "weekly") start.setDate(start.getDate() - 7);
  else if (period === "monthly") start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);

  const orders = demoBridalOrders.filter((o) => new Date(o.bookingDate) >= start);
  const revenue = orders.reduce((s, o) => s + parseFloat(o.depositPaid), 0);
  const outstanding = orders
    .filter((o) => !["cancelled", "refunded", "collected"].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.remainingBalance), 0);
  return {
    period,
    orderCount: orders.length,
    revenue,
    outstanding,
    refunds: demoRefunds.filter((r) => new Date(r.createdAt) >= start).length,
    cancellations: demoCancellations.filter((c) => new Date(c.createdAt) >= start).length,
    redesigns: demoRedesigns.filter((r) => new Date(r.createdAt) >= start).length,
    late: orders.filter((o) => new Date(o.deliveryDate) < now && o.status !== "collected").length,
  };
}

export async function searchOrders(query: string): Promise<BridalOrder[]> {
  const q = query.toLowerCase();
  const results: BridalOrder[] = [];
  for (const order of demoBridalOrders) {
    const customer = demoCustomers.find((c) => c.id === order.customerId);
    if (
      order.orderNumber.toLowerCase().includes(q) ||
      customer?.name.toLowerCase().includes(q) ||
      customer?.phone.includes(q) ||
      order.status.includes(q)
    ) {
      results.push(order);
    }
  }
  return results;
}

export function getDashboardStats() {
  const active = demoBridalOrders.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  return {
    totalActive: active.length,
    dueThisWeek: active.filter((o) => new Date(o.deliveryDate) <= weekEnd && new Date(o.deliveryDate) >= now).length,
    dueToday: active.filter((o) => {
      const d = new Date(o.deliveryDate);
      return d.toDateString() === now.toDateString();
    }).length,
    late: active.filter((o) => new Date(o.deliveryDate) < now).length,
    cancelled: demoBridalOrders.filter((o) => o.status === "cancelled").length,
    refunded: demoBridalOrders.filter((o) => o.status === "refunded").length,
    completed: demoBridalOrders.filter((o) => o.status === "collected").length,
  };
}

export function getSupplierPerformance(supplierId: string) {
  const orders = demoBridalOrders.filter((o) => o.supplierId === supplierId);
  const total = orders.length;
  const completed = orders.filter((o) => o.status === "collected").length;
  const redesigns = orders.filter((o) => o.status === "redesign_in_progress").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const refunded = orders.filter((o) => o.status === "refunded").length;
  const late = orders.filter((o) => new Date(o.deliveryDate) < new Date() && o.status !== "collected").length;
  const successful = completed;
  return {
    total,
    completed,
    successful,
    wrongOrders: redesigns,
    redesigns,
    refunds: refunded,
    cancellations: cancelled,
    lateDeliveries: late,
    successRate: total ? Math.round((successful / total) * 100) : 0,
  };
}

export { demoProducts, demoBridalOrders, demoTimeline, demoOrderFiles, demoMessages, nextOrderNumber } from "./seed";
export type { Product, Collection, BlogPost, BridalOrder, Customer, Supplier };
