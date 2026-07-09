import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";

export async function upsertDeviceTokenDb(input: {
  fcmToken: string;
  role: string;
  userId?: string;
  orderId?: string;
  userAgent?: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return;

  const existing = await db
    .select({ id: schema.deviceTokens.id })
    .from(schema.deviceTokens)
    .where(eq(schema.deviceTokens.fcmToken, input.fcmToken))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.deviceTokens)
      .set({
        userId: input.userId ?? null,
        orderId: input.orderId ?? null,
        role: input.role,
        userAgent: input.userAgent ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.deviceTokens.id, existing[0].id));
    return;
  }

  await db.insert(schema.deviceTokens).values({
    fcmToken: input.fcmToken,
    userId: input.userId ?? null,
    orderId: input.orderId ?? null,
    role: input.role,
    userAgent: input.userAgent ?? null,
  });
}

export async function deleteDeviceTokenDb(fcmToken: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(schema.deviceTokens).where(eq(schema.deviceTokens.fcmToken, fcmToken));
}

export async function listDeviceTokensByUserId(userId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: schema.deviceTokens.fcmToken })
    .from(schema.deviceTokens)
    .where(eq(schema.deviceTokens.userId, userId));
  return rows.map((r) => r.token);
}

export async function listDeviceTokensByOrderId(orderId: string): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: schema.deviceTokens.fcmToken })
    .from(schema.deviceTokens)
    .where(eq(schema.deviceTokens.orderId, orderId));
  return rows.map((r) => r.token);
}

export async function listStaffDeviceTokens(): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.select({ token: schema.deviceTokens.fcmToken }).from(schema.deviceTokens);
  return rows.filter((r) => r.token).map((r) => r.token);
}

export async function listAdminDeviceTokens(): Promise<string[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: schema.deviceTokens.fcmToken })
    .from(schema.deviceTokens)
    .where(eq(schema.deviceTokens.role, "admin"));
  return rows.map((r) => r.token);
}
