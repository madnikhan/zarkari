import { cookies } from "next/headers";
import type { UserRole } from "@/lib/data/seed";
import { demoUsers } from "@/lib/data/seed";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  supplierId?: string;
}

const SESSION_COOKIE = "zarkari-session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function authenticate(email: string, password: string): SessionUser | null {
  const user = demoUsers.find((u) => u.email === email && u.password === password);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    supplierId: user.supplierId,
  };
}

export function sessionCookieValue(user: SessionUser): string {
  return JSON.stringify(user);
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
