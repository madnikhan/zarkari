import { NextResponse } from "next/server";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import {
  createCargoCompany,
  deactivateCargoCompany,
  listCargoCompanies,
  updateCargoCompany,
} from "@/lib/cargo/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const includeInactive =
    new URL(request.url).searchParams.get("all") === "1" &&
    ["owner", "staff"].includes(session.role);
  const companies = await listCargoCompanies({ includeInactive });
  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const company = await createCargoCompany(name);
  if (!company) return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  return NextResponse.json({ company }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const active = typeof body.active === "boolean" ? body.active : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name === undefined && active === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const company = await updateCargoCompany(id, { name, active });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ company });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const id =
    (typeof body.id === "string" && body.id) || searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const company = await deactivateCargoCompany(id);
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ company, soft: true });
}
