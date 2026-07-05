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
import { isUuid } from "@/lib/db";

function useDemoData(): boolean {
  return !isDbConfigured();
}

function canQueryDbId(id: string): boolean {
  return isDbConfigured() && isUuid(id);
}

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
  if (isDbConfigured()) {
    const { listProductsDb } = await import("@/lib/db/cms-products");
    return (await listProductsDb(limit, true)).map(sanitizeProduct);
  }
  return demoProducts.slice(0, limit).map(sanitizeProduct);
}

export async function getAllProducts(limit = 200): Promise<Product[]> {
  if (isDbConfigured()) {
    const { listProductsDb } = await import("@/lib/db/cms-products");
    return (await listProductsDb(limit, false)).map(sanitizeProduct);
  }
  return demoProducts.slice(0, limit).map(sanitizeProduct);
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  if (isDbConfigured()) {
    const { getProductByHandleDb } = await import("@/lib/db/cms-products");
    const product = await getProductByHandleDb(handle);
    return product ? sanitizeProduct(product) : null;
  }
  const product = demoProducts.find((p) => p.handle === handle);
  return product ? sanitizeProduct(product) : null;
}

export async function getCollections(): Promise<Collection[]> {
  if (isDbConfigured()) {
    const { listCollectionsDb } = await import("@/lib/db/cms-collections");
    return (await listCollectionsDb()).map(sanitizeCollection);
  }
  return demoCollections.map(sanitizeCollection);
}

export async function getCollectionByHandle(handle: string): Promise<(Collection & { products: Product[] }) | null> {
  if (isDbConfigured()) {
    const { getCollectionByHandleDb } = await import("@/lib/db/cms-collections");
    const col = await getCollectionByHandleDb(handle);
    if (col) {
      return {
        ...sanitizeCollection(col),
        products: col.products.map(sanitizeProduct),
      };
    }
    return null;
  }
  const collection = demoCollections.find((c) => c.handle === handle);
  if (!collection) return null;
  const products =
    handle === "catalogue"
      ? demoProducts.map(sanitizeProduct)
      : demoProducts.filter((p) => p.collectionHandles.includes(handle)).map(sanitizeProduct);
  return { ...sanitizeCollection(collection), products };
}

export async function getBlogPosts(limit = 10): Promise<BlogPost[]> {
  if (isDbConfigured()) {
    const { listBlogPostsDb } = await import("@/lib/db/cms-blog");
    return (await listBlogPostsDb(limit, true)).map(sanitizeBlogPost);
  }
  return demoBlogPosts.slice(0, limit).map(sanitizeBlogPost);
}

export async function getAllBlogPosts(limit = 100): Promise<BlogPost[]> {
  if (isDbConfigured()) {
    const { listBlogPostsDb } = await import("@/lib/db/cms-blog");
    return (await listBlogPostsDb(limit, false)).map(sanitizeBlogPost);
  }
  return demoBlogPosts.slice(0, limit).map(sanitizeBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isDbConfigured()) {
    const { getBlogPostBySlugDb } = await import("@/lib/db/cms-blog");
    const post = await getBlogPostBySlugDb(slug);
    return post ? sanitizeBlogPost(post) : null;
  }
  const post = demoBlogPosts.find((p) => p.slug === slug);
  return post ? sanitizeBlogPost(post) : null;
}

export async function getShopSettings() {
  if (isDbConfigured()) {
    const { getShopSettingsDb } = await import("@/lib/db/shop-settings");
    return { ...demoShopSettings, ...(await getShopSettingsDb()) };
  }
  return demoShopSettings;
}

export async function getBridalOrders(filters?: {
  supplierId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BridalOrder[]> {
  if (isDbConfigured()) {
    const { listBridalOrdersDb } = await import("@/lib/db/bridal-orders");
    return listBridalOrdersDb({ ...filters, limit: filters?.limit ?? 5000 });
  }
  let orders = [...demoBridalOrders];
  if (filters?.supplierId) orders = orders.filter((o) => o.supplierId === filters.supplierId);
  if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
  orders = orders.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  if (filters?.offset) orders = orders.slice(filters.offset);
  if (filters?.limit) orders = orders.slice(0, filters.limit);
  return orders;
}

export async function getBridalOrderById(id: string): Promise<BridalOrder | null> {
  if (canQueryDbId(id)) {
    const { getBridalOrderDb } = await import("@/lib/db/bridal-orders");
    const row = await getBridalOrderDb(id);
    if (row) return row;
    return null;
  }
  if (!useDemoData()) return null;
  return demoBridalOrders.find((o) => o.id === id) ?? null;
}

export async function getBridalOrderByNumber(orderNumber: string): Promise<BridalOrder | null> {
  if (isDbConfigured()) {
    const { getBridalOrderByNumberDb } = await import("@/lib/db/bridal-orders");
    const row = await getBridalOrderByNumberDb(orderNumber);
    if (row) return row;
  }
  return demoBridalOrders.find((o) => o.orderNumber === orderNumber) ?? null;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (canQueryDbId(id)) {
    const { getCustomerDb } = await import("@/lib/db/bridal-orders");
    return getCustomerDb(id);
  }
  if (!useDemoData()) return null;
  return demoCustomers.find((c) => c.id === id) ?? null;
}

export async function getCustomers(): Promise<Customer[]> {
  if (isDbConfigured()) {
    const { listCustomersDb } = await import("@/lib/db/bridal-orders");
    return listCustomersDb();
  }
  return demoCustomers;
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  if (canQueryDbId(id)) {
    const { getSupplierDb } = await import("@/lib/db/bridal-orders");
    return getSupplierDb(id);
  }
  if (!useDemoData()) return null;
  return demoSuppliers.find((s) => s.id === id) ?? null;
}

export async function getSuppliers(): Promise<Supplier[]> {
  if (isDbConfigured()) {
    const { listSuppliersDb } = await import("@/lib/db/bridal-orders");
    return listSuppliersDb();
  }
  return demoSuppliers;
}

export async function getTimeline(orderId: string): Promise<TimelineEvent[]> {
  if (canQueryDbId(orderId)) {
    const { getTimelineDb } = await import("@/lib/db/bridal-orders");
    return getTimelineDb(orderId);
  }
  if (!useDemoData()) return [];
  return demoTimeline.filter((e) => e.orderId === orderId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getOrderFiles(orderId: string, includeSensitive = true): Promise<OrderFile[]> {
  if (canQueryDbId(orderId)) {
    const { getOrderFilesDb } = await import("@/lib/db/bridal-orders");
    const rows = await getOrderFilesDb(orderId);
    return includeSensitive ? rows : [];
  }
  if (!useDemoData()) return [];
  const files = demoOrderFiles.filter((f) => f.orderId === orderId);
  if (includeSensitive) return files;
  return [];
}

export async function getMessages(orderId: string): Promise<CustomerMessage[]> {
  if (canQueryDbId(orderId)) {
    const { getMessagesDb } = await import("@/lib/db/bridal-orders");
    return getMessagesDb(orderId);
  }
  if (!useDemoData()) return [];
  return demoMessages.filter((m) => m.orderId === orderId);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isDbConfigured()) {
    const { getProductByIdDb } = await import("@/lib/db/cms-products");
    const product = await getProductByIdDb(id);
    return product ? sanitizeProduct(product) : null;
  }
  const product = demoProducts.find((p) => p.id === id);
  return product ? sanitizeProduct(product) : null;
}

export async function getRedesigns(orderId: string) {
  if (canQueryDbId(orderId)) {
    const { getRedesignsDb } = await import("@/lib/db/bridal-orders");
    return getRedesignsDb(orderId);
  }
  if (!useDemoData()) return [];
  return demoRedesigns.filter((r) => r.orderId === orderId);
}

export async function getCancellations(orderId?: string) {
  if (isDbConfigured()) {
    const { getCancellationsDb } = await import("@/lib/db/bridal-orders");
    if (!orderId || canQueryDbId(orderId)) return getCancellationsDb(orderId);
    return [];
  }
  return orderId ? demoCancellations.filter((c) => c.orderId === orderId) : demoCancellations;
}

export async function getRefunds(orderId?: string) {
  if (isDbConfigured()) {
    const { getRefundsDb } = await import("@/lib/db/bridal-orders");
    if (!orderId || canQueryDbId(orderId)) return getRefundsDb(orderId);
    return [];
  }
  return orderId ? demoRefunds.filter((r) => r.orderId === orderId) : demoRefunds;
}

export async function getCollectionRecord(orderId: string) {
  if (canQueryDbId(orderId)) {
    const { getCollectionRecordDb } = await import("@/lib/db/bridal-orders");
    return getCollectionRecordDb(orderId);
  }
  if (!useDemoData()) return null;
  return demoOrderCollections.find((c) => c.orderId === orderId) ?? null;
}

export async function getPayments(orderId: string) {
  if (canQueryDbId(orderId)) {
    const { getPaymentsDb } = await import("@/lib/db/bridal-orders");
    return getPaymentsDb(orderId);
  }
  if (!useDemoData()) return [];
  return demoPayments.filter((p) => p.orderId === orderId);
}

export async function getPaymentsForOrders(orderIds: string[]) {
  if (isDbConfigured() && orderIds.length) {
    const { listPaymentsByOrderIdsDb } = await import("@/lib/db/bridal-orders");
    return listPaymentsByOrderIdsDb(orderIds);
  }
  if (!useDemoData()) return [];
  return demoPayments.filter((p) => orderIds.includes(p.orderId));
}

export type BridalOrderWithRelations = BridalOrder & {
  customerName?: string;
  customerPhone?: string;
  supplierName?: string;
};

export async function getBridalOrdersWithRelations(filters: {
  supplierId?: string;
  tab?: "active" | "overdue" | "due-week" | "completed" | "cancelled" | "refunded";
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Promise<{ orders: BridalOrderWithRelations[]; total: number }> {
  if (isDbConfigured()) {
    const { listBridalOrdersWithRelationsDb } = await import("@/lib/db/bridal-orders");
    return listBridalOrdersWithRelationsDb(filters);
  }
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  let orders = [...demoBridalOrders];
  if (filters.supplierId) orders = orders.filter((o) => o.supplierId === filters.supplierId);
  if (filters.tab === "completed") orders = orders.filter((o) => o.status === "collected");
  else if (filters.tab === "cancelled") orders = orders.filter((o) => o.status === "cancelled");
  else if (filters.tab === "refunded") orders = orders.filter((o) => o.status === "refunded");
  else if (filters.tab === "overdue") {
    orders = orders.filter(
      (o) => new Date(o.deliveryDate) < now && !["collected", "cancelled", "refunded"].includes(o.status)
    );
  } else if (filters.tab === "due-week") {
    orders = orders.filter((o) => {
      const d = new Date(o.deliveryDate);
      return d >= now && d <= weekEnd && !["collected", "cancelled", "refunded"].includes(o.status);
    });
  } else if (filters.activeOnly || filters.tab === "active") {
    orders = orders.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));
  }
  orders.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  const total = orders.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? total;
  orders = orders.slice(offset, offset + limit);
  const withRelations = orders.map((order) => {
    const customer = demoCustomers.find((c) => c.id === order.customerId);
    const supplier = order.supplierId ? demoSuppliers.find((s) => s.id === order.supplierId) : undefined;
    return {
      ...order,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      supplierName: supplier?.name,
    };
  });
  return { orders: withRelations, total };
}

export async function getFinanceSummary() {
  if (isDbConfigured()) {
    const { getFinanceSummaryDb } = await import("@/lib/db/bridal-orders");
    return getFinanceSummaryDb();
  }
  const orders = demoBridalOrders;
  return {
    totalDeposits: orders.reduce((s, o) => s + parseFloat(o.depositPaid), 0),
    totalOutstanding: orders
      .filter((o) => !["cancelled", "refunded", "collected"].includes(o.status))
      .reduce((s, o) => s + parseFloat(o.remainingBalance), 0),
    refundedCount: orders.filter((o) => o.status === "refunded").length,
  };
}

export async function getActiveFinanceSummary() {
  if (isDbConfigured()) {
    const { getActiveFinanceSummaryDb } = await import("@/lib/db/bridal-orders");
    return getActiveFinanceSummaryDb();
  }
  const active = demoBridalOrders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  return {
    totalDeposits: active.reduce((s, o) => s + parseFloat(o.depositPaid), 0),
    totalOutstanding: active
      .filter((o) => o.status !== "collected")
      .reduce((s, o) => s + parseFloat(o.remainingBalance), 0),
  };
}

export async function getAllSupplierPerformance() {
  if (isDbConfigured()) {
    const { getSupplierPerformanceAllDb } = await import("@/lib/db/bridal-orders");
    return getSupplierPerformanceAllDb();
  }
  return demoSuppliers.map((s) => {
    const orders = demoBridalOrders.filter((o) => o.supplierId === s.id);
    const completed = orders.filter((o) => o.status === "collected").length;
    const total = orders.length;
    return {
      supplierId: s.id,
      total,
      completed,
      redesigns: orders.filter((o) => o.status === "redesign_in_progress").length,
      cancellations: orders.filter((o) => o.status === "cancelled").length,
      refunds: orders.filter((o) => o.status === "refunded").length,
      lateDeliveries: orders.filter((o) => new Date(o.deliveryDate) < new Date() && o.status !== "collected").length,
      successRate: total ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export async function getCustomersWithOrders() {
  if (isDbConfigured()) {
    const { listCustomersDb, listCustomerOrderLinksDb } = await import("@/lib/db/bridal-orders");
    const [customers, links] = await Promise.all([listCustomersDb(), listCustomerOrderLinksDb()]);
    const byCustomer = new Map<string, { id: string; orderNumber: string }[]>();
    for (const link of links) {
      const list = byCustomer.get(link.customerId) ?? [];
      list.push({ id: link.orderId, orderNumber: link.orderNumber });
      byCustomer.set(link.customerId, list);
    }
    return customers.map((c) => ({ ...c, orders: byCustomer.get(c.id) ?? [] }));
  }
  return demoCustomers.map((c) => ({
    ...c,
    orders: demoBridalOrders.filter((o) => o.customerId === c.id).map((o) => ({ id: o.id, orderNumber: o.orderNumber })),
  }));
}

export async function getRetailOrders() {
  if (isDbConfigured()) {
    const { listRetailOrdersDb } = await import("@/lib/db/retail-orders");
    const dbOrders = await listRetailOrdersDb();
    if (dbOrders.length) return dbOrders;
  }
  return demoRetailOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNotifications(unreadOnly = false, userId?: string) {
  if (isDbConfigured()) {
    const { listNotificationsDb } = await import("@/lib/db/notifications");
    let list = await listNotificationsDb(userId);
    if (unreadOnly) list = list.filter((n) => !n.read);
    return list;
  }
  let list = [...demoNotifications];
  if (unreadOnly) list = list.filter((n) => !n.read);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function loadAllBridalOrders(): Promise<BridalOrder[]> {
  if (isDbConfigured()) {
    const { listBridalOrdersDb } = await import("@/lib/db/bridal-orders");
    return listBridalOrdersDb({ limit: 5000 });
  }
  return [...demoBridalOrders];
}

export async function getReportsData(period: "daily" | "weekly" | "monthly" | "yearly" = "monthly") {
  if (isDbConfigured()) {
    const { getReportsDataDb } = await import("@/lib/db/bridal-orders");
    return getReportsDataDb(period);
  }

  const now = new Date();
  const start = new Date(now);
  if (period === "daily") start.setDate(start.getDate() - 1);
  else if (period === "weekly") start.setDate(start.getDate() - 7);
  else if (period === "monthly") start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);

  const allOrders = await loadAllBridalOrders();
  const orders = allOrders.filter((o) => new Date(o.bookingDate) >= start);
  const revenue = orders.reduce((s, o) => s + parseFloat(o.depositPaid), 0);
  const outstanding = orders
    .filter((o) => !["cancelled", "refunded", "collected"].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.remainingBalance), 0);

  const refunds = await getRefunds();
  const cancellations = await getCancellations();

  return {
    period,
    orderCount: orders.length,
    revenue,
    outstanding,
    refunds: refunds.filter((r) => new Date(r.createdAt) >= start).length,
    cancellations: cancellations.filter((c) => new Date(c.createdAt) >= start).length,
    redesigns: demoRedesigns.filter((r) => new Date(r.createdAt) >= start).length,
    late: orders.filter((o) => new Date(o.deliveryDate) < now && o.status !== "collected").length,
  };
}

export async function getExportOrders(period: "daily" | "weekly" | "monthly" | "yearly") {
  const now = new Date();
  const start = new Date(now);
  if (period === "daily") start.setDate(start.getDate() - 1);
  else if (period === "weekly") start.setDate(start.getDate() - 7);
  else if (period === "monthly") start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);

  if (isDbConfigured()) {
    const { listBridalOrdersForExportDb } = await import("@/lib/db/bridal-orders");
    return listBridalOrdersForExportDb(start);
  }

  return loadAllBridalOrders()
    .then((orders) =>
      orders
        .filter((o) => new Date(o.bookingDate) >= start)
        .map((o) => ({
          ...o,
          customerName: demoCustomers.find((c) => c.id === o.customerId)?.name ?? "",
        }))
    );
}

export async function searchOrders(query: string): Promise<BridalOrder[]> {
  if (isDbConfigured()) {
    const { searchBridalOrdersDb } = await import("@/lib/db/bridal-orders");
    return searchBridalOrdersDb(query);
  }
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

export async function searchOrdersWithCustomer(query: string) {
  if (isDbConfigured()) {
    const { searchBridalOrdersWithCustomerDb } = await import("@/lib/db/bridal-orders");
    return searchBridalOrdersWithCustomerDb(query);
  }
  const results = await searchOrders(query);
  return results.map((order) => ({
    ...order,
    customerName: demoCustomers.find((c) => c.id === order.customerId)?.name,
  }));
}

export async function getPayableOrders() {
  if (isDbConfigured()) {
    const { listPayableBridalOrdersDb } = await import("@/lib/db/bridal-orders");
    return listPayableBridalOrdersDb();
  }
  return demoBridalOrders
    .filter(
      (o) =>
        !["collected", "cancelled", "refunded"].includes(o.status) &&
        parseFloat(o.remainingBalance) > 0
    )
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: demoCustomers.find((c) => c.id === o.customerId)?.name ?? "",
      remainingBalance: o.remainingBalance,
      depositPaid: o.depositPaid,
      totalPrice: o.totalPrice,
    }))
    .sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
}

export async function getDashboardStats() {
  if (isDbConfigured()) {
    const { getBridalDashboardStatsDb } = await import("@/lib/db/bridal-orders");
    return getBridalDashboardStatsDb();
  }

  const allOrders = await loadAllBridalOrders();
  const active = allOrders.filter((o) => !["collected", "cancelled", "refunded"].includes(o.status));
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  return {
    totalOrders: allOrders.length,
    totalActive: active.length,
    dueThisWeek: active.filter((o) => new Date(o.deliveryDate) <= weekEnd && new Date(o.deliveryDate) >= now).length,
    dueToday: active.filter((o) => {
      const d = new Date(o.deliveryDate);
      return d.toDateString() === now.toDateString();
    }).length,
    late: active.filter((o) => new Date(o.deliveryDate) < now).length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
    refunded: allOrders.filter((o) => o.status === "refunded").length,
    completed: allOrders.filter((o) => o.status === "collected").length,
  };
}

export async function getSupplierPerformance(supplierId: string) {
  if (isDbConfigured()) {
    const all = await getAllSupplierPerformance();
    const perf = all.find((p) => p.supplierId === supplierId);
    if (perf) {
      return {
        total: perf.total,
        completed: perf.completed,
        successful: perf.completed,
        wrongOrders: perf.redesigns,
        redesigns: perf.redesigns,
        refunds: perf.refunds,
        cancellations: perf.cancellations,
        lateDeliveries: perf.lateDeliveries,
        successRate: perf.successRate,
      };
    }
  }

  const allOrders = await loadAllBridalOrders();
  const orders = allOrders.filter((o) => o.supplierId === supplierId);
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
