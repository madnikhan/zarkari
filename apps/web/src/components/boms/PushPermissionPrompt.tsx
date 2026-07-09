"use client";

import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { getClientMessaging } from "@/lib/firebase/client";
import { firebaseVapidKey, isFirebaseClientConfigured } from "@/lib/firebase/config";
import { PwaServiceWorkerRegister } from "./PwaServiceWorkerRegister";

interface Props {
  variant?: "staff" | "customer";
}

export function PushPermissionPrompt({ variant = "staff" }: Props) {
  const [status, setStatus] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!isFirebaseClientConfigured() || !firebaseVapidKey) return;
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      registerToken();
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    const timer = window.setTimeout(() => {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") registerToken();
        else setStatus(perm === "denied" ? "denied" : "idle");
      });
    }, variant === "customer" ? 2000 : 4000);

    return () => window.clearTimeout(timer);
  }, [variant]);

  async function registerToken() {
    try {
      const messaging = await getClientMessaging();
      if (!messaging) {
        setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) return;
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken: token }),
      });
      setStatus("granted");
    } catch (err) {
      console.error("Push registration failed", err);
    }
  }

  if (!isFirebaseClientConfigured() || !firebaseVapidKey) {
    return <PwaServiceWorkerRegister />;
  }

  return <PwaServiceWorkerRegister />;
}
