import { isDbConfigured } from "@/lib/db";
import { demoSuppliers } from "@/lib/data/seed";
import { addSupplierLedgerEntry, updateSupplierLedgerEntry } from "@/lib/supplier-ledger/service";
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

export async function listCargoCompanies(opts?: {
  includeInactive?: boolean;
}): Promise<CargoCompany[]> {
  if (isDbConfigured()) {
    const { listCargoCompaniesDb } = await import("@/lib/db/cargo-boxes");
    return listCargoCompaniesDb(opts);
  }
  if (!demoCargoCompanies.some((c) => c.name.toLowerCase() === "skynet")) {
    demoCargoCompanies.push({ id: "cc-skynet", name: "Skynet", active: true });
  }
  return opts?.includeInactive
    ? [...demoCargoCompanies].sort((a, b) => a.name.localeCompare(b.name))
    : demoCargoCompanies.filter((c) => c.active);
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

export async function updateCargoCompany(
  id: string,
  patch: { name?: string; active?: boolean }
): Promise<CargoCompany | null> {
  if (isDbConfigured()) {
    const { updateCargoCompanyDb } = await import("@/lib/db/cargo-boxes");
    return updateCargoCompanyDb(id, patch);
  }
  const company = demoCargoCompanies.find((c) => c.id === id);
  if (!company) return null;
  if (patch.name !== undefined) company.name = patch.name;
  if (patch.active !== undefined) company.active = patch.active;
  return company;
}

/** Soft-deactivate; allowed even when boxes still reference the company. */
export async function deactivateCargoCompany(id: string): Promise<CargoCompany | null> {
  return updateCargoCompany(id, { active: false });
}

export async function listCargoBoxes(opts?: {
  search?: string;
  from?: string;
  to?: string;
}): Promise<CargoBox[]> {
  if (isDbConfigured()) {
    const { listCargoBoxesDb } = await import("@/lib/db/cargo-boxes");
    return listCargoBoxesDb(opts);
  }
  const q = opts?.search?.trim().toLowerCase();
  const from = opts?.from?.slice(0, 10);
  const to = opts?.to?.slice(0, 10);
  return demoCargoBoxes
    .map(enrichDemoBox)
    .filter((b) => {
      if (from && b.receivedDate < from) return false;
      if (to && b.receivedDate > to) return false;
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

  // Never post empty boxes to khata on create — staff must add items first, then Post to khata.
  if (box && input.postToKhata) {
    const fresh = await getCargoBox(box.id);
    if ((fresh?.items?.length ?? 0) > 0) {
      await postBoxToKhata(box.id);
      box = await getCargoBox(box.id);
    }
  }
  return box;
}

/** Keep linked supplier khata stock entry amounts in sync with live box item totals. */
export async function syncBoxKhataAmounts(boxId: string): Promise<void> {
  const box = await getCargoBox(boxId);
  if (!box?.khataEntryId) return;
  const totalPkr =
    box.totalCostPkr ?? box.items?.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0) ?? 0;
  const totalGbp =
    box.totalCostGbp ?? box.items?.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0) ?? 0;
  await updateSupplierLedgerEntry(box.khataEntryId, {
    amountGbp: totalGbp.toFixed(2),
    amountPkr: totalPkr.toFixed(2),
    exchangeRate: box.exchangeRate,
    description: `Box ${box.boxNumber} — ${box.trackingNumber}`,
  });
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
  itemKind?: "custom" | "sample";
  bridalOrderId?: string;
  orderNumber?: string;
  costPkr?: string;
  costGbp?: string;
  exchangeRate?: string;
  imageUrl?: string;
  imageKey?: string;
}): Promise<CargoBoxItem | null> {
  let item: CargoBoxItem | null;
  if (isDbConfigured()) {
    const { addCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    item = await addCargoBoxItemDb(input);
  } else {
    const itemKind: "custom" | "sample" =
      input.itemKind ?? (input.bridalOrderId ? "custom" : "sample");
    item = {
      id: `ci-${Date.now()}`,
      boxId: input.boxId,
      itemDate: input.itemDate.slice(0, 10),
      articleName: input.articleName.trim(),
      itemKind,
      bridalOrderId: itemKind === "custom" ? input.bridalOrderId : undefined,
      orderNumber: itemKind === "custom" ? input.orderNumber : undefined,
      costPkr: input.costPkr ?? "0",
      costGbp: input.costGbp ?? "0",
      exchangeRate: input.exchangeRate,
      imageUrl: input.imageUrl,
      imageKey: input.imageKey,
      sortOrder: demoCargoBoxItems.filter((i) => i.boxId === input.boxId).length,
      createdAt: new Date().toISOString(),
    };
    demoCargoBoxItems.push(item);
  }
  if (item) await syncBoxKhataAmounts(input.boxId).catch(console.error);
  return item;
}

export async function updateCargoBoxItem(
  id: string,
  patch: Partial<{
    itemDate: string;
    articleName: string;
    itemKind: "custom" | "sample";
    bridalOrderId: string | null;
    orderNumber?: string;
    costPkr: string;
    costGbp: string;
    exchangeRate: string;
    imageUrl?: string;
    imageKey?: string;
  }>
): Promise<CargoBoxItem | null> {
  let item: CargoBoxItem | null;
  if (isDbConfigured()) {
    const { updateCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    const { bridalOrderId, orderNumber: _o, ...dbPatch } = patch;
    item = await updateCargoBoxItemDb(id, { ...dbPatch, bridalOrderId });
  } else {
    item = demoCargoBoxItems.find((i) => i.id === id) ?? null;
    if (!item) return null;
    Object.assign(item, patch);
    if (patch.itemKind === "sample") {
      item.bridalOrderId = undefined;
      item.orderNumber = undefined;
    }
  }
  if (item) await syncBoxKhataAmounts(item.boxId).catch(console.error);
  return item;
}

export async function deleteCargoBoxItem(id: string): Promise<boolean> {
  let boxId: string | undefined;
  if (isDbConfigured()) {
    const { getCargoBoxItemDb, deleteCargoBoxItemDb } = await import("@/lib/db/cargo-boxes");
    const existing = await getCargoBoxItemDb(id);
    boxId = existing?.boxId;
    const ok = await deleteCargoBoxItemDb(id);
    if (ok && boxId) await syncBoxKhataAmounts(boxId).catch(console.error);
    return ok;
  }
  const idx = demoCargoBoxItems.findIndex((i) => i.id === id);
  if (idx < 0) return false;
  boxId = demoCargoBoxItems[idx].boxId;
  demoCargoBoxItems.splice(idx, 1);
  await syncBoxKhataAmounts(boxId).catch(console.error);
  return true;
}

export async function postBoxToKhata(boxId: string): Promise<CargoBox | null> {
  const box = await getCargoBox(boxId);
  if (!box) throw new Error("Box not found");
  if (box.khataEntryId) {
    await syncBoxKhataAmounts(boxId);
    return getCargoBox(boxId);
  }

  const itemCount = box.items?.length ?? box.totalItems ?? 0;
  if (itemCount < 1) {
    throw new Error("Add dresses/items to the box before posting costs to supplier khata");
  }

  const totalPkr = box.totalCostPkr ?? box.items?.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0) ?? 0;
  const totalGbp = box.totalCostGbp ?? box.items?.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0) ?? 0;
  if (totalPkr <= 0 && totalGbp <= 0) {
    throw new Error("Box totals are zero — enter item costs before posting to khata");
  }

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

export type AvailableSample = {
  id: string;
  articleName: string;
  costGbp: string;
  boxNumber: string;
  itemDate: string;
};

export async function listAvailableSamples(): Promise<AvailableSample[]> {
  if (isDbConfigured()) {
    const { listAvailableSamplesDb } = await import("@/lib/db/cargo-boxes");
    return listAvailableSamplesDb();
  }
  return demoCargoBoxItems
    .filter(
      (i) =>
        (i.itemKind ?? (i.bridalOrderId ? "custom" : "sample")) === "sample" &&
        !i.soldAt
    )
    .map((i) => {
      const box = demoCargoBoxes.find((b) => b.id === i.boxId);
      return {
        id: i.id,
        articleName: i.articleName,
        costGbp: i.costGbp,
        boxNumber: box?.boxNumber ?? "—",
        itemDate: i.itemDate,
      };
    });
}

export async function markSampleSold(
  id: string,
  input: {
    soldPriceGbp: string;
    soldMethod: "cash" | "online";
    soldCashTransactionId: string;
    soldAt?: Date;
  }
): Promise<CargoBoxItem | null> {
  if (isDbConfigured()) {
    const { markSampleSoldDb } = await import("@/lib/db/cargo-boxes");
    return markSampleSoldDb(id, input);
  }
  const item = demoCargoBoxItems.find((i) => i.id === id);
  if (!item) return null;
  if (item.soldAt) throw new Error("This sample is already sold");
  item.soldAt = (input.soldAt ?? new Date()).toISOString();
  item.soldPriceGbp = input.soldPriceGbp;
  item.soldMethod = input.soldMethod;
  item.soldCashTransactionId = input.soldCashTransactionId;
  return item;
}

export async function seedCargoCompanies(): Promise<void> {
  const names = ["DHL Cargo", "FedEx", "UPS", "Leopards Cargo", "Skynet"];
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
