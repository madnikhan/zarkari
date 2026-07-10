import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/lib/firebase/client";
import { firebaseVapidKey, isFirebaseClientConfigured } from "@/lib/firebase/config";

export type PushRegistrationStatus = "idle" | "granted" | "denied" | "unsupported";

export function getPushPermissionStatus(): PushRegistrationStatus {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!isFirebaseClientConfigured() || !firebaseVapidKey) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "idle";
}

export async function registerPushToken(): Promise<boolean> {
  if (!isFirebaseClientConfigured() || !firebaseVapidKey) return false;
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  try {
    const messaging = await getClientMessaging();
    if (!messaging) return false;
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fcmToken: token }),
    });
    return true;
  } catch (err) {
    console.error("Push registration failed", err);
    return false;
  }
}

export async function requestPushPermissionAndRegister(): Promise<PushRegistrationStatus> {
  if (getPushPermissionStatus() === "unsupported") return "unsupported";
  if (Notification.permission === "granted") {
    await registerPushToken();
    return "granted";
  }
  if (Notification.permission === "denied") return "denied";
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    await registerPushToken();
    return "granted";
  }
  return perm === "denied" ? "denied" : "idle";
}
