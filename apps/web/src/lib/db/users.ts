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

export async function seedDemoUsersDb(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const { hashPassword } = await import("@/lib/auth/password");
  const { demoUsers } = await import("@/lib/data/seed");
  for (const u of demoUsers) {
    const existing = await findUserByEmailDb(u.email);
    if (existing) continue;
    await createUserDb({
      email: u.email,
      passwordHash: await hashPassword(u.password),
      name: u.name,
      role: u.role,
      supplierId: u.supplierId,
    });
  }
}
