export interface CargoCompany {
  id: string;
  name: string;
  active: boolean;
}

export interface CargoBoxItem {
  id: string;
  boxId: string;
  itemDate: string;
  articleName: string;
  bridalOrderId?: string;
  orderNumber?: string;
  costPkr: string;
  costGbp: string;
  exchangeRate?: string;
  sortOrder: number;
  imageUrl?: string;
  imageKey?: string;
  createdAt: string;
}

export interface CargoBox {
  id: string;
  boxNumber: string;
  cargoCompanyId: string;
  cargoCompanyName?: string;
  trackingNumber: string;
  supplierId: string;
  supplierName?: string;
  receivedDate: string;
  weightKg?: string;
  notes?: string;
  exchangeRate?: string;
  khataEntryId?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  items?: CargoBoxItem[];
  totalItems?: number;
  totalCostPkr?: number;
  totalCostGbp?: number;
}

export let demoCargoCompanies: CargoCompany[] = [
  { id: "cc-dhl", name: "DHL Cargo", active: true },
  { id: "cc-fedex", name: "FedEx", active: true },
  { id: "cc-ups", name: "UPS", active: true },
  { id: "cc-leopards", name: "Leopards Cargo", active: true },
];

export let demoCargoBoxes: CargoBox[] = [
  {
    id: "box-demo-1",
    boxNumber: "BOX-2026-0001",
    cargoCompanyId: "cc-dhl",
    cargoCompanyName: "DHL Cargo",
    trackingNumber: "DHL1234567890",
    supplierId: "sup-001",
    supplierName: "Karachi Atelier",
    receivedDate: "2026-06-15",
    weightKg: "12.50",
    notes: "Karachi shipment — bridal lehengas",
    exchangeRate: "355.50",
    createdAt: "2026-06-15T10:00:00Z",
    updatedAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "box-demo-2",
    boxNumber: "BOX-2026-0002",
    cargoCompanyId: "cc-leopards",
    cargoCompanyName: "Leopards Cargo",
    trackingNumber: "LCP9876543210",
    supplierId: "sup-001",
    supplierName: "Karachi Atelier",
    receivedDate: "2026-06-20",
    weightKg: "8.25",
    notes: "Accessories and fabric samples",
    exchangeRate: "355.50",
    createdAt: "2026-06-20T10:00:00Z",
    updatedAt: "2026-06-20T10:00:00Z",
  },
];

export let demoCargoBoxItems: CargoBoxItem[] = [
  {
    id: "ci-1",
    boxId: "box-demo-1",
    itemDate: "2026-06-15",
    articleName: "Bridal Lehenga — Red",
    bridalOrderId: "bo-1",
    orderNumber: "BR-2026-0152",
    costPkr: "85000",
    costGbp: "239.10",
    exchangeRate: "355.50",
    sortOrder: 0,
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "ci-2",
    boxId: "box-demo-1",
    itemDate: "2026-06-15",
    articleName: "Matching Blouse",
    bridalOrderId: "bo-2",
    orderNumber: "BR-2026-0148",
    costPkr: "22000",
    costGbp: "61.88",
    exchangeRate: "355.50",
    sortOrder: 1,
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "ci-3",
    boxId: "box-demo-2",
    itemDate: "2026-06-20",
    articleName: "Embroidered Dupatta",
    bridalOrderId: "bo-3",
    orderNumber: "BR-2026-0140",
    costPkr: "12000",
    costGbp: "33.75",
    exchangeRate: "355.50",
    sortOrder: 0,
    createdAt: "2026-06-20T10:00:00Z",
  },
];

let boxSeq = 3;

export function nextDemoBoxNumber(): string {
  const year = new Date().getFullYear();
  const num = String(boxSeq++).padStart(4, "0");
  return `BOX-${year}-${num}`;
}
