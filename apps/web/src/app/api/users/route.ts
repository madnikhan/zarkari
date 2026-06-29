import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { isDbConfigured } from "@/lib/db";
import { createUserDb, listUsersDb, updateUserDb, deleteUserDb } from "@/lib/db/users";
import { demoUsers } from "@/lib/data/seed";
import type { UserRole } from "@/lib/data/seed";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (isDbConfigured()) {
    const users = await listUsersDb();
    if (users.length) {
      return NextResponse.json({
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          supplierId: u.supplierId,
        })),
      });
    }
  }

  return NextResponse.json({
    users: demoUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      supplierId: u.supplierId,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    supplierId?: string;
  };
  if (!body.email || !body.password || !body.name || !body.role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (isDbConfigured()) {
    const user = await createUserDb({
      email: body.email.trim().toLowerCase(),
      passwordHash: await hashPassword(body.password),
      name: body.name,
      role: body.role,
      supplierId: body.supplierId,
    });
    if (!user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  }

  const id = `user-${Date.now()}`;
  demoUsers.push({
    id,
    email: body.email,
    password: body.password,
    name: body.name,
    role: body.role,
    supplierId: body.supplierId,
  });
  return NextResponse.json({ user: { id, email: body.email, name: body.name, role: body.role } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    role?: UserRole;
    password?: string;
  };
  if (!body.id) return NextResponse.json({ error: "User id required" }, { status: 400 });

  if (isDbConfigured()) {
    const patch: { name?: string; role?: UserRole; passwordHash?: string } = {};
    if (body.name) patch.name = body.name;
    if (body.role) patch.role = body.role;
    if (body.password) patch.passwordHash = await hashPassword(body.password);
    const user = await updateUserDb(body.id, patch);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  const user = demoUsers.find((u) => u.id === body.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.name) user.name = body.name;
  if (body.role) user.role = body.role;
  if (body.password) user.password = body.password;
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });
  if (id === session.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  if (isDbConfigured()) {
    await deleteUserDb(id);
    return NextResponse.json({ ok: true });
  }

  const idx = demoUsers.findIndex((u) => u.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  demoUsers.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
