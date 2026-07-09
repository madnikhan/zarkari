import { getAdminMessaging } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  listAdminDeviceTokens,
  listDeviceTokensByOrderId,
  listDeviceTokensByUserId,
} from "@/lib/db/device-tokens";

export interface PushPayload {
  title: string;
  body?: string;
  href?: string;
  orderId?: string;
}

async function sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length || !isFirebaseConfigured()) return;

  const messaging = getAdminMessaging();
  if (!messaging) return;

  const data: Record<string, string> = {
    title: payload.title,
    ...(payload.body ? { body: payload.body } : {}),
    ...(payload.href ? { href: payload.href } : {}),
    ...(payload.orderId ? { orderId: payload.orderId } : {}),
  };

  await Promise.all(
    unique.map((token) =>
      messaging
        .send({
          token,
          notification: { title: payload.title, body: payload.body ?? "" },
          data,
          webpush: payload.href
            ? {
                fcmOptions: { link: payload.href },
              }
            : undefined,
        })
        .catch((err) => {
          console.error("FCM send failed", token.slice(0, 12), err);
        })
    )
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const tokens = await listDeviceTokensByUserId(userId);
  await sendToTokens(tokens, payload);
}

export async function sendPushToOrderCustomer(orderId: string, payload: PushPayload): Promise<void> {
  const tokens = await listDeviceTokensByOrderId(orderId);
  await sendToTokens(tokens, { ...payload, orderId });
}

export async function sendPushToStaff(payload: PushPayload): Promise<void> {
  const tokens = await listAdminDeviceTokens();
  await sendToTokens(tokens, payload);
}
