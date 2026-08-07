import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  pastOrderCsvTemplate,
  validatePastOrderRows,
  type PastOrderCsvRow,
} from "@/lib/orders/past-import";
import { createPastBridalOrder } from "@/lib/data/actions";
import { isDbConfigured } from "@/lib/db";

const MAX_ROWS = 500;

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return new NextResponse(pastOrderCsvTemplate(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="past-orders-template.csv"',
    },
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const csvText = typeof body.csv === "string" ? body.csv : "";
  const dryRun = body.dryRun !== false;
  const commit = body.commit === true;

  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV content required" }, { status: 400 });
  }

  const { results, valid } = validatePastOrderRows(csvText);
  if (valid.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS}). Split the file.` },
      { status: 400 }
    );
  }

  if (dryRun && !commit) {
    return NextResponse.json({
      dryRun: true,
      totalRows: results.filter((r) => r.row > 0).length,
      validCount: valid.length,
      errorCount: results.filter((r) => !r.ok).length,
      results,
    });
  }

  if (!valid.length) {
    return NextResponse.json(
      { error: "No valid rows to import", results },
      { status: 400 }
    );
  }

  const created: { row: number; orderNumber: string; id: string }[] = [];
  const failed: { row: number; error: string }[] = [];

  for (let i = 0; i < valid.length; i++) {
    const data = valid[i] as PastOrderCsvRow;
    const rowNum = results.find((r) => r.ok && r.data === data)?.row ?? i + 2;
    try {
      let supplierId: string | undefined;
      if (data.supplierName && isDbConfigured()) {
        const { findSupplierIdByNameDb } = await import("@/lib/db/bridal-orders");
        supplierId = (await findSupplierIdByNameDb(data.supplierName)) ?? undefined;
        if (!supplierId) {
          failed.push({ row: rowNum, error: `Supplier not found: ${data.supplierName}` });
          continue;
        }
      }

      const order = await createPastBridalOrder({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        dressType: data.dressType,
        totalPrice: data.totalPrice,
        depositPaid: data.depositPaid,
        remainingBalance: data.remainingBalance,
        bookingDate: data.bookingDate,
        deliveryDate: data.deliveryDate,
        status: data.status as import("@/lib/data/seed").BridalStatus,
        orderNumber: data.orderNumber,
        supplierId,
        notes: data.notes,
        createdById: session.id,
        createdByName: session.name,
      });
      created.push({ row: rowNum, orderNumber: order.orderNumber, id: order.id });
    } catch (err) {
      failed.push({
        row: rowNum,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  return NextResponse.json({
    dryRun: false,
    createdCount: created.length,
    failedCount: failed.length,
    created,
    failed,
    validation: results,
  });
}
