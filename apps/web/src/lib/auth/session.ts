import { cache } from "react";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/data/seed";
import { demoUsers } from "@/lib/data/seed";
import { isDbConfigured } from "@/lib/db";
import { findUserByEmailDb } from "@/lib/db/users";
import { verifyPassword, getDemoPasswordHash } from "@/lib/auth/password";
import { parseSessionCookie, signSession } from "@/lib/auth/signed-session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  supplierId?: string;
}

const SESSION_COOKIE = "zarkari-session";

const readSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return parseSessionCookie(raw);
});

export async function getSession(): Promise<SessionUser | null> {
  return readSession();
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const normalized = email.trim().toLowerCase();

  if (isDbConfigured()) {
    const dbUser = await findUserByEmailDb(normalized);
    if (dbUser && (await verifyPassword(password, dbUser.passwordHash))) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        supplierId: dbUser.supplierId ?? undefined,
      };
    }
  }

  const demoUser = demoUsers.find((u) => u.email.toLowerCase() === normalized);
  if (!demoUser) return null;
  const demoHash = await getDemoPasswordHash();
  const passwordOk =
    (await verifyPassword(password, demoHash)) || demoUser.password === password;
  if (!passwordOk) return null;
  return {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
    supplierId: demoUser.supplierId,
  };
}

export async function sessionCookieValue(user: SessionUser): Promise<string> {
  return signSession(user);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export function canAccessAdmin(role: UserRole): boolean {
  return role === "owner" || role === "staff";
}

export function canRefund(role: UserRole): boolean {
  return role === "owner";
}

export function canDeleteRecords(role: UserRole): boolean {
  return role === "owner";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
