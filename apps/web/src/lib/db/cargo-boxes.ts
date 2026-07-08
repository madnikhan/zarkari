import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "./index";
import type { CargoBox, CargoBoxItem, CargoCompany } from "@/lib/cargo/demo-store";

function mapCompany(row: typeof schema.cargoCompanies.$inferSelect): CargoCompany {
  return { id: row.id, name: row.name, active: row.active };
}

function mapItem(
  row: typeof schema.cargoBoxItems.$inferSelect,
  orderNumber?: string
): CargoBoxItem {
  return {
    id: row.id,
    boxId: row.boxId,
    itemDate: row.itemDate,
    articleName: row.articleName,
    bridalOrderId: row.bridalOrderId ?? undefined,
    orderNumber,
    costPkr: row.costPkr,
    costGbp: row.costGbp,
    exchangeRate: row.exchangeRate ?? undefined,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapBox(
  row: typeof schema.cargoBoxes.$inferSelect,
  extras?: {
    cargoCompanyName?: string;
    supplierName?: string;
    items?: CargoBoxItem[];
    totalItems?: number;
    totalCostPkr?: number;
    totalCostGbp?: number;
  }
): CargoBox {
  return {
    id: row.id,
    boxNumber: row.boxNumber,
    cargoCompanyId: row.cargoCompanyId,
    cargoCompanyName: extras?.cargoCompanyName,
    trackingNumber: row.trackingNumber,
    supplierId: row.supplierId,
    supplierName: extras?.supplierName,
    receivedDate: row.receivedDate,
    weightKg: row.weightKg ?? undefined,
    notes: row.notes ?? undefined,
    exchangeRate: row.exchangeRate ?? undefined,
    khataEntryId: row.khataEntryId ?? undefined,
    createdByUserId: row.createdByUserId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: extras?.items,
    totalItems: extras?.totalItems,
    totalCostPkr: extras?.totalCostPkr,
    totalCostGbp: extras?.totalCostGbp,
  };
}

export async function listCargoCompaniesDb(): Promise<CargoCompany[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(schema.cargoCompanies)
    .where(eq(schema.cargoCompanies.active, true))
    .orderBy(schema.cargoCompanies.name);
  return rows.map(mapCompany);
}

export async function createCargoCompanyDb(name: string): Promise<CargoCompany | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.insert(schema.cargoCompanies).values({ name }).returning();
  return row ? mapCompany(row) : null;
}

export async function nextBoxNumberDb(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `BOX-${year}-`;
  if (!db) return `${prefix}0001`;

  const [row] = await db
    .select({ boxNumber: schema.cargoBoxes.boxNumber })
    .from(schema.cargoBoxes)
    .where(ilike(schema.cargoBoxes.boxNumber, `${prefix}%`))
    .orderBy(desc(schema.cargoBoxes.boxNumber))
    .limit(1);

  if (!row?.boxNumber) return `${prefix}0001`;
  const tail = row.boxNumber.slice(prefix.length);
  const n = parseInt(tail, 10);
  const next = Number.isFinite(n) ? n + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function listCargoBoxesDb(search?: string): Promise<CargoBox[]> {
  const db = getDb();
  if (!db) return [];

  const q = search?.trim();
  const conditions = q
    ? or(
        ilike(schema.cargoBoxes.boxNumber, `%${q}%`),
        ilike(schema.cargoBoxes.trackingNumber, `%${q}%`),
        ilike(schema.suppliers.name, `%${q}%`),
        ilike(schema.cargoCompanies.name, `%${q}%`)
      )
    : undefined;

  const rows = await db
    .select({
      box: schema.cargoBoxes,
      cargoCompanyName: schema.cargoCompanies.name,
      supplierName: schema.suppliers.name,
      totalItems: sql<number>`coalesce(count(${schema.cargoBoxItems.id}), 0)::int`,
      totalCostPkr: sql<number>`coalesce(sum(${schema.cargoBoxItems.costPkr}::numeric), 0)`,
      totalCostGbp: sql<number>`coalesce(sum(${schema.cargoBoxItems.costGbp}::numeric), 0)`,
    })
    .from(schema.cargoBoxes)
    .innerJoin(schema.cargoCompanies, eq(schema.cargoBoxes.cargoCompanyId, schema.cargoCompanies.id))
    .innerJoin(schema.suppliers, eq(schema.cargoBoxes.supplierId, schema.suppliers.id))
    .leftJoin(schema.cargoBoxItems, eq(schema.cargoBoxItems.boxId, schema.cargoBoxes.id))
    .where(conditions)
    .groupBy(schema.cargoBoxes.id, schema.cargoCompanies.name, schema.suppliers.name)
    .orderBy(desc(schema.cargoBoxes.receivedDate), desc(schema.cargoBoxes.createdAt));

  return rows.map((r) =>
    mapBox(r.box, {
      cargoCompanyName: r.cargoCompanyName,
      supplierName: r.supplierName,
      totalItems: Number(r.totalItems),
      totalCostPkr: Number(r.totalCostPkr),
      totalCostGbp: Number(r.totalCostGbp),
    })
  );
}

export async function getCargoBoxDb(id: string): Promise<CargoBox | null> {
  const db = getDb();
  if (!db) return null;

  const [header] = await db
    .select({
      box: schema.cargoBoxes,
      cargoCompanyName: schema.cargoCompanies.name,
      supplierName: schema.suppliers.name,
    })
    .from(schema.cargoBoxes)
    .innerJoin(schema.cargoCompanies, eq(schema.cargoBoxes.cargoCompanyId, schema.cargoCompanies.id))
    .innerJoin(schema.suppliers, eq(schema.cargoBoxes.supplierId, schema.suppliers.id))
    .where(eq(schema.cargoBoxes.id, id))
    .limit(1);

  if (!header) return null;

  const itemRows = await db
    .select({
      item: schema.cargoBoxItems,
      orderNumber: schema.bridalOrders.orderNumber,
    })
    .from(schema.cargoBoxItems)
    .leftJoin(schema.bridalOrders, eq(schema.cargoBoxItems.bridalOrderId, schema.bridalOrders.id))
    .where(eq(schema.cargoBoxItems.boxId, id))
    .orderBy(schema.cargoBoxItems.sortOrder, schema.cargoBoxItems.itemDate);

  const items = itemRows.map((r) => mapItem(r.item, r.orderNumber ?? undefined));
  const totalCostPkr = items.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0);
  const totalCostGbp = items.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0);

  return mapBox(header.box, {
    cargoCompanyName: header.cargoCompanyName,
    supplierName: header.supplierName,
    items,
    totalItems: items.length,
    totalCostPkr,
    totalCostGbp,
  });
}

export async function createCargoBoxDb(input: {
  cargoCompanyId: string;
  trackingNumber: string;
  supplierId: string;
  receivedDate: string;
  weightKg?: string;
  notes?: string;
  exchangeRate?: string;
  createdByUserId?: string;
}): Promise<CargoBox | null> {
  const db = getDb();
  if (!db) return null;
  const boxNumber = await nextBoxNumberDb();
  const [row] = await db
    .insert(schema.cargoBoxes)
    .values({
      boxNumber,
      cargoCompanyId: input.cargoCompanyId,
      trackingNumber: input.trackingNumber.trim(),
      supplierId: input.supplierId,
      receivedDate: input.receivedDate.slice(0, 10),
      weightKg: input.weightKg ?? null,
      notes: input.notes ?? null,
      exchangeRate: input.exchangeRate ?? null,
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  return row ? getCargoBoxDb(row.id) : null;
}

export async function updateCargoBoxDb(
  id: string,
  patch: Partial<{
    cargoCompanyId: string;
    trackingNumber: string;
    supplierId: string;
    receivedDate: string;
    weightKg: string;
    notes: string;
    exchangeRate: string;
    khataEntryId: string;
  }>
): Promise<CargoBox | null> {
  const db = getDb();
  if (!db) return null;
  await db
    .update(schema.cargoBoxes)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.cargoBoxes.id, id));
  return getCargoBoxDb(id);
}

export async function deleteCargoBoxDb(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await db.delete(schema.cargoBoxItems).where(eq(schema.cargoBoxItems.boxId, id));
  await db.delete(schema.cargoBoxes).where(eq(schema.cargoBoxes.id, id));
  return true;
}

export async function addCargoBoxItemDb(input: {
  boxId: string;
  itemDate: string;
  articleName: string;
  bridalOrderId?: string;
  costPkr?: string;
  costGbp?: string;
  exchangeRate?: string;
  sortOrder?: number;
}): Promise<CargoBoxItem | null> {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .insert(schema.cargoBoxItems)
    .values({
      boxId: input.boxId,
      itemDate: input.itemDate.slice(0, 10),
      articleName: input.articleName.trim(),
      bridalOrderId: input.bridalOrderId ?? null,
      costPkr: input.costPkr ?? "0",
      costGbp: input.costGbp ?? "0",
      exchangeRate: input.exchangeRate ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  if (!row) return null;

  let orderNumber: string | undefined;
  if (row.bridalOrderId) {
    const [order] = await db
      .select({ orderNumber: schema.bridalOrders.orderNumber })
      .from(schema.bridalOrders)
      .where(eq(schema.bridalOrders.id, row.bridalOrderId))
      .limit(1);
    orderNumber = order?.orderNumber;
  }

  return mapItem(row, orderNumber);
}

export async function updateCargoBoxItemDb(
  id: string,
  patch: Partial<{
    itemDate: string;
    articleName: string;
    bridalOrderId: string | null;
    costPkr: string;
    costGbp: string;
    exchangeRate: string;
    sortOrder: number;
  }>
): Promise<CargoBoxItem | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .update(schema.cargoBoxItems)
    .set(patch)
    .where(eq(schema.cargoBoxItems.id, id))
    .returning();
  if (!row) return null;

  let orderNumber: string | undefined;
  if (row.bridalOrderId) {
    const [order] = await db
      .select({ orderNumber: schema.bridalOrders.orderNumber })
      .from(schema.bridalOrders)
      .where(eq(schema.bridalOrders.id, row.bridalOrderId))
      .limit(1);
    orderNumber = order?.orderNumber;
  }

  return mapItem(row, orderNumber);
}

export async function deleteCargoBoxItemDb(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await db.delete(schema.cargoBoxItems).where(eq(schema.cargoBoxItems.id, id));
  return true;
}

export async function seedCargoCompaniesDb(companies: { name: string }[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  const existing = await db.select().from(schema.cargoCompanies).limit(1);
  if (existing.length) return;
  for (const c of companies) {
    await db.insert(schema.cargoCompanies).values({ name: c.name });
  }
}

export async function getBoxTotalsDb(boxId: string): Promise<{ totalPkr: number; totalGbp: number }> {
  const db = getDb();
  if (!db) return { totalPkr: 0, totalGbp: 0 };
  const [row] = await db
    .select({
      totalPkr: sql<number>`coalesce(sum(${schema.cargoBoxItems.costPkr}::numeric), 0)`,
      totalGbp: sql<number>`coalesce(sum(${schema.cargoBoxItems.costGbp}::numeric), 0)`,
    })
    .from(schema.cargoBoxItems)
    .where(eq(schema.cargoBoxItems.boxId, boxId));
  return { totalPkr: Number(row?.totalPkr ?? 0), totalGbp: Number(row?.totalGbp ?? 0) };
}

export async function getCargoBoxHeaderDb(id: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.cargoBoxes).where(eq(schema.cargoBoxes.id, id)).limit(1);
  return row ?? null;
}
