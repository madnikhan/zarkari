import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createCargoCompany, listCargoCompanies } from "@/lib/cargo/service";

export async function GET() {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const companies = await listCargoCompanies();
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
