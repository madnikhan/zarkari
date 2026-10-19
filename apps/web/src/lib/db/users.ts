import { eq } from "drizzle-orm";
import type { UserRole } from "@/lib/data/seed";
import { getDb, schema } from "./index";

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  supplierId?: string | null;
}

function mapUser(row: typeof schema.users.$inferSelect): DbUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role as UserRole,
    supplierId: row.supplierId,
  };
}

export async function findUserByEmailDb(email: string): Promise<DbUser | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return row ? mapUser(row) : null;
}

export async function listUsersDb(): Promise<DbUser[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select().from(schema.users).orderBy(schema.users.name);
  return rows.map(mapUser);
}

export async function createUserDb(input: {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  supplierId?: string;
}): Promise<DbUser | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.users)
    .values({
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role,
      supplierId: input.supplierId ?? null,
    })
    .returning();
  return row ? mapUser(row) : null;
}

export async function updateUserDb(
  id: string,
  patch: { name?: string; role?: UserRole; passwordHash?: string; supplierId?: string | null }
): Promise<DbUser | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.update(schema.users).set(patch).where(eq(schema.users.id, id)).returning();
  return row ? mapUser(row) : null;
}

export async function deleteUserDb(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  await db.delete(schema.users).where(eq(schema.users.id, id));
  return true;
}

export const DEMO_LOGIN_ACCOUNTS = [
  { email: "owner@zarkari.co.uk", password: "demo123", name: "Owner", role: "owner" as UserRole },
  { email: "staff@zarkari.co.uk", password: "demo123", name: "Staff", role: "staff" as UserRole },
  {
    email: "supplier@zarkari.co.uk",
    password: "demo123",
    name: "Karachi Atelier",
    role: "supplier" as UserRole,
    needsSupplier: true,
  },
] as const;

export function isDemoLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return DEMO_LOGIN_ACCOUNTS.some((a) => a.email === normalized);
}

/**
 * Ensures README login accounts exist in Neon with password demo123.
 * Creates missing users; resets password only when demo123 no longer matches.
 * Does not touch other accounts (e.g. waqas@ / custom suppliers).
 */
export async function ensureDemoLoginUsersDb(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const { hashPassword, verifyPassword } = await import("@/lib/auth/password");

  let supplierId: string | undefined;
  if (DEMO_LOGIN_ACCOUNTS.some((a) => "needsSupplier" in a && a.needsSupplier)) {
    const [existingSupplier] = await db.select().from(schema.suppliers).limit(1);
    if (existingSupplier) {
      supplierId = existingSupplier.id;
    } else {
      const [created] = await db
        .insert(schema.suppliers)
        .values({ name: "Karachi Atelier", email: "supplier@zarkari.co.uk" })
        .returning();
      supplierId = created.id;
    }
  }

  for (const account of DEMO_LOGIN_ACCOUNTS) {
    const needsSupplier = "needsSupplier" in account && account.needsSupplier;
    const existing = await findUserByEmailDb(account.email);
    if (existing) {
      const passwordOk = await verifyPassword(account.password, existing.passwordHash);
      if (!passwordOk) {
        await updateUserDb(existing.id, { passwordHash: await hashPassword(account.password) });
      }
      if (needsSupplier && !existing.supplierId && supplierId) {
        await updateUserDb(existing.id, { supplierId });
      }
      continue;
    }
    await createUserDb({
      email: account.email,
      passwordHash: await hashPassword(account.password),
      name: account.name,
      role: account.role,
      supplierId: needsSupplier ? supplierId : undefined,
    });
  }
}

/** @deprecated Use ensureDemoLoginUsersDb */
export async function seedDemoUsersDb(): Promise<void> {
  return ensureDemoLoginUsersDb();
}
