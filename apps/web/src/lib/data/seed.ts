/**
 * In-memory demo store — used when DATABASE_URL is not configured.
 * Replace with Drizzle queries when Neon is connected.
 */

import { sanitizeImageUrl } from "@/lib/image-url";
import { catalogProducts, catalogCollectionImages } from "./catalog-products";

export type UserRole = "owner" | "staff" | "supplier";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export type BridalStatus =
  | "order_created"
  | "sent_to_supplier"
  | "supplier_rejected"
  | "order_received"
  | "fabric_preparation"
  | "embroidery"
  | "stitching"
  | "finishing"
  | "packing"
  | "shipping"
  | "delivered_to_shop"
  | "redesign_in_progress"
  | "ready_for_collection"
  | "collected"
  | "cancelled"
  | "refunded";

export interface BridalOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  supplierId?: string;
  status: BridalStatus;
  bookingDate: string;
  deliveryDate: string;
  totalPrice: string;
  depositPaid: string;
  remainingBalance: string;
  dressType?: string;
  colour?: string;
  size?: string;
  comments?: string;
  customisationNotes?: string;
  filesUnlockedAt?: string;
  lastSupplierActionAt?: string;
  supplierLocked: boolean;
  createdById?: string;
}

export interface TimelineEvent {
  id: string;
  orderId: string;
  eventType: string;
  comment?: string;
  performedByName?: string;
  performedByRole?: string;
  createdAt: string;
}

export interface OrderFile {
  id: string;
  orderId: string;
  category: string;
  fileName: string;
  url: string;
  mimeType?: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  fabric?: string;
  tags: string[];
  featuredImageUrl?: string;
  images: string[];
  variants: ProductVariant[];
  collectionHandles: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  inventoryQty: number;
  options: { name: string; value: string }[];
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  contentHtml: string;
  imageUrl?: string;
  publishedAt: string;
  author: string;
}

export interface CustomerMessage {
  id: string;
  orderId: string;
  senderType: "customer" | "staff" | "supplier";
  senderName?: string;
  message: string;
  createdAt: string;
  audience?: "customer" | "supplier" | "internal";
  attachmentUrl?: string;
  attachmentKind?: string;
  readAt?: string;
  forwardedFromId?: string;
  reviewStatus?: "pending" | "forwarded" | "dismissed";
}

export interface CartItem {
  lineId: string;
  variantId: string;
  productId: string;
  title: string;
  handle: string;
  price: string;
  quantity: number;
  imageUrl?: string;
  sizeSelection: {
    mode: "standard" | "custom";
    label: string;
    measurements: Record<string, number>;
  };
}

const SUPPLIER_1 = "sup-001";
const CUSTOMER_1 = "cust-001";
const CUSTOMER_2 = "cust-002";

export const demoUsers: User[] = [
  { id: "user-owner", email: "owner@zarkari.co.uk", password: "demo123", name: "Owner", role: "owner" },
  { id: "user-staff", email: "staff@zarkari.co.uk", password: "demo123", name: "Staff", role: "staff" },
  { id: "user-supplier", email: "supplier@zarkari.co.uk", password: "demo123", name: "Karachi Atelier", role: "supplier", supplierId: SUPPLIER_1 },
];

export const demoSuppliers: Supplier[] = [
  { id: SUPPLIER_1, name: "Karachi Atelier", email: "supplier@zarkari.co.uk", phone: "+92 300 1234567" },
  { id: "sup-002", name: "Lahore Embroidery Co", email: "lahore@supplier.com" },
];

export const demoCustomers: Customer[] = [
  { id: CUSTOMER_1, name: "Aisha Khan", phone: "447700900123", email: "aisha@example.com", address: "12 Green Lane, London E1 4AA" },
  { id: CUSTOMER_2, name: "Fatima Ahmed", phone: "447700900456", email: "fatima@example.com", address: "45 High Street, Birmingham B1 2AA" },
];

export const demoCollections: Collection[] = [
  {
    id: "col-catalogue",
    handle: "catalogue",
    title: "Catalogue",
    description: "The full ZARKARI collection from our WhatsApp catalogue.",
    imageUrl: catalogCollectionImages.catalogue,
  },
  {
    id: "col-soon",
    handle: "coming-soon",
    title: "Coming Soon",
    description: "Preview upcoming ZARKARI designs.",
    imageUrl: catalogCollectionImages["coming-soon"],
  },
];

export const demoProducts: Product[] = catalogProducts;

const deliveryAug = new Date("2026-08-15");

export let demoBridalOrders: BridalOrder[] = [
  {
    id: "bo-1",
    orderNumber: "BR-2026-0152",
    customerId: CUSTOMER_1,
    supplierId: SUPPLIER_1,
    status: "embroidery",
    bookingDate: "2026-06-01T10:00:00Z",
    deliveryDate: deliveryAug.toISOString(),
    totalPrice: "1000.00",
    depositPaid: "500.00",
    remainingBalance: "500.00",
    dressType: "Bridal Lehenga",
    colour: "Maroon Gold",
    size: "M",
    customisationNotes: "Heavy zari on dupatta border, fitted blouse.",
    filesUnlockedAt: "2026-06-03T10:00:00Z",
    supplierLocked: false,
    createdById: "user-staff",
  },
  {
    id: "bo-2",
    orderNumber: "BR-2026-0148",
    customerId: CUSTOMER_2,
    supplierId: SUPPLIER_1,
    status: "sent_to_supplier",
    bookingDate: "2026-06-05T10:00:00Z",
    deliveryDate: new Date(Date.now() + 56 * 86400000).toISOString(),
    totalPrice: "850.00",
    depositPaid: "425.00",
    remainingBalance: "425.00",
    dressType: "Walima Gown",
    colour: "Ivory",
    size: "S",
    supplierLocked: false,
    createdById: "user-owner",
  },
  {
    id: "bo-3",
    orderNumber: "BR-2026-0140",
    customerId: CUSTOMER_1,
    supplierId: SUPPLIER_1,
    status: "ready_for_collection",
    bookingDate: "2026-03-01T10:00:00Z",
    deliveryDate: "2026-05-20T10:00:00Z",
    totalPrice: "1200.00",
    depositPaid: "600.00",
    remainingBalance: "600.00",
    dressType: "Mehndi Outfit",
    filesUnlockedAt: "2026-03-05T10:00:00Z",
    supplierLocked: true,
    createdById: "user-staff",
  },
];

export let demoTimeline: TimelineEvent[] = [
  { id: "te-1", orderId: "bo-1", eventType: "order_created", performedByName: "Staff", performedByRole: "staff", createdAt: "2026-06-01T10:00:00Z" },
  { id: "te-2", orderId: "bo-1", eventType: "sent_to_supplier", performedByName: "Staff", performedByRole: "staff", createdAt: "2026-06-02T10:00:00Z" },
  { id: "te-3", orderId: "bo-1", eventType: "accepted", performedByName: "Karachi Atelier", performedByRole: "supplier", createdAt: "2026-06-03T10:00:00Z" },
  { id: "te-4", orderId: "bo-1", eventType: "stage_update", comment: "Fabric Preparation complete", performedByName: "Karachi Atelier", performedByRole: "supplier", createdAt: "2026-06-10T10:00:00Z" },
  { id: "te-5", orderId: "bo-1", eventType: "stage_update", comment: "Embroidery in progress", performedByName: "Karachi Atelier", performedByRole: "supplier", createdAt: "2026-06-18T10:00:00Z" },
];

export let demoOrderFiles: OrderFile[] = [
  { id: "f-1", orderId: "bo-1", category: "design", fileName: "design-front.jpg", url: "/catalog/mahnoorz/1.png" },
  { id: "f-2", orderId: "bo-1", category: "measurements", fileName: "measurements.pdf", url: "#" },
  { id: "f-3", orderId: "bo-1", category: "order_form", fileName: "order-form.pdf", url: "#" },
];

export let demoMessages: CustomerMessage[] = [];

export interface OrderRedesign {
  id: string;
  orderId: string;
  reason: string;
  comment?: string;
  createdAt: string;
  createdByName?: string;
}

export interface OrderCancellation {
  id: string;
  orderId: string;
  reason: string;
  comment?: string;
  cancelledByRole: string;
  createdAt: string;
}

export interface OrderRefund {
  id: string;
  orderId: string;
  reason: string;
  amount: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface OrderCollection {
  id: string;
  orderId: string;
  collectionDate: string;
  balancePaid: boolean;
  amountPaid?: string;
  alterationNotes?: string;
}

export interface SupplierCompletion {
  id: string;
  orderId: string;
  deliveryDate: string;
  billNumber: string;
  courierName?: string;
  trackingNumber?: string;
  manufacturingCostPkr?: string;
}

export interface BridalPayment {
  id: string;
  orderId: string;
  type: string;
  amount: string;
  method?: string;
  createdAt: string;
}

export interface RetailOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  status: string;
  total: string;
  items: {
    title: string;
    quantity: number;
    price: string;
    sizeSelection?: {
      mode: "standard" | "custom";
      label: string;
      measurements: Record<string, number>;
    };
  }[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  orderId?: string;
  threadId?: string;
  href?: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
}

export let demoRedesigns: OrderRedesign[] = [];
export let demoCancellations: OrderCancellation[] = [];
export let demoRefunds: OrderRefund[] = [];
export let demoOrderCollections: OrderCollection[] = [];
export let demoSupplierCompletions: SupplierCompletion[] = [];
export let demoPayments: BridalPayment[] = [
  { id: "pay-1", orderId: "bo-1", type: "deposit", amount: "500.00", method: "card", createdAt: "2026-06-01T10:00:00Z" },
  { id: "pay-2", orderId: "bo-3", type: "deposit", amount: "600.00", method: "cash", createdAt: "2026-03-01T10:00:00Z" },
];
export let demoRetailOrders: RetailOrder[] = [];
export let demoNotifications: AppNotification[] = [];

export const demoBlogPosts: BlogPost[] = [];

export const demoShopSettings: Record<string, string> = {
  announcement: "Shop the ZARKARI catalogue",
  heroHeadline: "ZARKARI",
  heroSubheadline: "Designer formal wear — hand-finished pieces from our catalogue.",
};

let orderSeq = 153;

export function nextOrderNumber(): string {
  orderSeq += 1;
  return `BR-2026-${String(orderSeq).padStart(4, "0")}`;
}

// Fix any stale/broken Unsplash URLs still in memory after HMR or runtime edits.
for (const product of demoProducts) {
  product.featuredImageUrl = sanitizeImageUrl(product.featuredImageUrl);
  product.images = product.images.map((img) => sanitizeImageUrl(img) ?? img);
}

for (const collection of demoCollections) {
  collection.imageUrl = sanitizeImageUrl(collection.imageUrl);
}

for (const post of demoBlogPosts) {
  post.imageUrl = sanitizeImageUrl(post.imageUrl);
}
