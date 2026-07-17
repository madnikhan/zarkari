import { isDbConfigured } from "@/lib/db";
import { demoSuppliers } from "@/lib/data/seed";
import { addSupplierLedgerEntry } from "@/lib/supplier-ledger/service";
import {
  demoCargoBoxItems,
  demoCargoBoxes,
  demoCargoCompanies,
  nextDemoBoxNumber,
  type CargoBox,
  type CargoBoxItem,
  type CargoCompany,
} from "./demo-store";

export type { CargoBox, CargoBoxItem, CargoCompany };

function enrichDemoBox(box: CargoBox): CargoBox {
  const items = demoCargoBoxItems.filter((i) => i.boxId === box.id);
  const cargoCompanyName = demoCargoCompanies.find((c) => c.id === box.cargoCompanyId)?.name;
  const supplierName = demoSuppliers.find((s) => s.id === box.supplierId)?.name;
  const totalCostPkr = items.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0);
  const totalCostGbp = items.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0);
  return {
    ...box,
    cargoCompanyName,
    supplierName,
    items,
    totalItems: items.length,
    totalCostPkr,
    totalCostGbp,
  };
}

export async function listCargoCompanies(): Promise<CargoCompany[]> {
  if (isDbConfigured()) {
    const { listCargoCompaniesDb } = await import("@/lib/db/cargo-boxes");
    return listCargoCompaniesDb();
  }
  return demoCargoCompanies.filter((c) => c.active);
}

export async function createCargoCompany(name: string): Promise<CargoCompany | null> {
  if (isDbConfigured()) {
    const { createCargoCompanyDb } = await import("@/lib/db/cargo-boxes");
    return createCargoCompanyDb(name);
  }
  const company: CargoCompany = { id: `cc-${Date.now()}`, name, active: true };
  demoCargoCompanies.push(company);
  return company;
}

export async function listCargoBoxes(search?: string): Promise<CargoBox[]> {
  if (isDbConfigured()) {
    const { listCargoBoxesDb } = await import("@/lib/db/cargo-boxes");
    return listCargoBoxesDb(search);
  }
  const q = search?.trim().toLowerCase();
  return demoCargoBoxes
    .map(enrichDemoBox)
    .filter((b) => {
      if (!q) return true;
      return (
        b.boxNumber.toLowerCase().includes(q) ||
        b.trackingNumber.toLowerCase().includes(q) ||
        (b.supplierName?.toLowerCase().includes(q) ?? false) ||
        (b.cargoCompanyName?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));
}

export async function getCargoBox(id: string): Promise<CargoBox | null> {
  if (isDbConfigured()) {
    const { getCargoBoxDb } = await import("@/lib/db/cargo-boxes");
    return getCargoBoxDb(id);
  }
  const box = demoCargoBoxes.find((b) => b.id === id);
  return box ? enrichDemoBox(box) : null;
}

export async function createCargoBox(input: {
  cargoCompanyId: string;
  trackingNumber: string;
  supplierId: string;
  receivedDate: string;
  weightKg?: string;
  notes?: string;
  exchangeRate?: string;
  createdByUserId?: string;
  postToKhata?: boolean;
}): Promise<CargoBox | null> {
  let box: CargoBox | null;
  if (isDbConfigured()) {
    const { createCargoBoxDb } = await import("@/lib/db/cargo-boxes");
    box = await createCargoBoxDb(input);
  } else {
    const now = new Date().toISOString();
    box = {
      id: `box-${Date.now()}`,
      boxNumber: nextDemoBoxNumber(),
      cargoCompanyId: input.cargoCompanyId,
      trackingNumber: input.trackingNumber.trim(),
      supplierId: input.supplierId,
      receivedDate: input.receivedDate.slice(0, 10),
      weightKg: input.weightKg,
      notes: input.notes,
      exchangeRate: input.exchangeRate,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    };
    demoCargoBoxes.unshift(box);
  }

  if (box && input.postToKhata) {
    await postBoxToKhata(box.id);
    box = await getCargoBox(box.id);
  }
  return box;
}

export async function updateCargoBox(
  id: string,
  patch: Partial<{
    cargoCompanyId: string;
    trackingNumber: string;
    supplierId: string;
    receivedDate: string;
    weightKg: string;
    notes: string;
    exchangeRate: string;
  }>
): Promise<CargoBox | null> {
  if (isDbConfigured()) {
    const { updateCargoBoxDb } = await import("@/lib/db/cargo-boxes");
    return updateCargoBoxDb(id, patch);
  }
  const box = demoCargoBoxes.find((b) => b.id === id);
  if (!box) return null;
  Object.assign(box, patch, { updatedAt: new Date().toISOString() });
  return enrichDemoBox(box);
}

export async function deleteCargoBox(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    const { deleteCargoBoxDb } = await import("@/lib/db/cargo-boxes");
    return deleteCargoBoxDb(id);
  }
  const idx = demoCargoBoxes.findIndex((b) => b.id === id);
  if (idx < 0) return false;
  demoCargoBoxes.splice(idx, 1);
  for (let i = demoCargoBoxItems.length - 1; i >= 0; i--) {
    if (demoCargoBoxItems[i].boxId === id) demoCargoBoxItems.splice(i, 1);
  }
  return true;
}

export async function addCargoBoxItem(input: {
  boxId: string;
  itemDate: string;
  articleName: string;
  bridalOrderId?: string;
  orderNumber?: string;
  costPkr?: string;
  costGbp?: string;
  exchangeRate?: string;
  imageUrl?: string;
  imageKey?: string;
}): Promise<CargoBoxItem | null> {
  if (isDbConfigured()) {
    const { addCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    return addCargoBoxItemDb(input);
  }
  const item: CargoBoxItem = {
    id: `ci-${Date.now()}`,
    boxId: input.boxId,
    itemDate: input.itemDate.slice(0, 10),
    articleName: input.articleName.trim(),
    bridalOrderId: input.bridalOrderId,
    orderNumber: input.orderNumber,
    costPkr: input.costPkr ?? "0",
    costGbp: input.costGbp ?? "0",
    exchangeRate: input.exchangeRate,
    imageUrl: input.imageUrl,
    imageKey: input.imageKey,
    sortOrder: demoCargoBoxItems.filter((i) => i.boxId === input.boxId).length,
    createdAt: new Date().toISOString(),
  };
  demoCargoBoxItems.push(item);
  return item;
}

export async function updateCargoBoxItem(
  id: string,
  patch: Partial<{
    itemDate: string;
    articleName: string;
    bridalOrderId: string | null;
    orderNumber?: string;
    costPkr: string;
    costGbp: string;
    exchangeRate: string;
    imageUrl?: string;
    imageKey?: string;
  }>
): Promise<CargoBoxItem | null> {
  if (isDbConfigured()) {
    const { updateCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    const { bridalOrderId, orderNumber: _o, ...dbPatch } = patch;
    return updateCargoBoxItemDb(id, { ...dbPatch, bridalOrderId });
  }
  const item = demoCargoBoxItems.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}

export async function deleteCargoBoxItem(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    const { deleteCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    return deleteCargoBoxItemDb(id);
  }
  const idx = demoCargoBoxItems.findIndex((i) => i.id === id);
  if (idx < 0) return false;
  demoCargoBoxItems.splice(idx, 1);
  return true;
}

export async function postBoxToKhata(boxId: string): Promise<CargoBox | null> {
  const box = await getCargoBox(boxId);
  if (!box) throw new Error("Box not found");
  if (box.khataEntryId) throw new Error("This box has already been posted to khata");

  const totalPkr = box.totalCostPkr ?? box.items?.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0) ?? 0;
  const totalGbp = box.totalCostGbp ?? box.items?.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0) ?? 0;

  const entry = await addSupplierLedgerEntry({
    supplierId: box.supplierId,
    type: "stock",
    description: `Box ${box.boxNumber} — ${box.trackingNumber}`,
    amountGbp: totalGbp.toFixed(2),
    amountPkr: totalPkr.toFixed(2),
    exchangeRate: box.exchangeRate,
    businessDate: box.receivedDate,
  });

  if (!entry) throw new Error("Could not create khata entry");

  if (isDbConfigured()) {
    const { updateCargoBoxDb } = await import("@/lib/db/cargo-boxes");
    return updateCargoBoxDb(boxId, { khataEntryId: entry.id });
  }

  const raw = demoCargoBoxes.find((b) => b.id === boxId);
  if (raw) raw.khataEntryId = entry.id;
  return getCargoBox(boxId);
}

export async function seedCargoCompanies(): Promise<void> {
  const names = ["DHL Cargo", "FedEx", "UPS", "Leopards Cargo"];
  if (isDbConfigured()) {
    const { seedCargoCompaniesDb } = await import("@/lib/db/cargo-boxes");
    await seedCargoCompaniesDb(names.map((name) => ({ name })));
    return;
  }
  if (demoCargoCompanies.length) return;
  demoCargoCompanies.push(
    ...names.map((name, i) => ({ id: `cc-seed-${i}`, name, active: true }))
  );
}
