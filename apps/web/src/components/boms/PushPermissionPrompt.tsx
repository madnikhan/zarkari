"use client";

import { useEffect, useState } from "react";
import { getPushPermissionStatus, registerPushToken } from "@/lib/push/register";
import { isFirebaseClientConfigured, firebaseVapidKey } from "@/lib/firebase/config";
import { PwaServiceWorkerRegister } from "./PwaServiceWorkerRegister";

interface Props {
  variant?: "staff" | "customer";
}

export function PushPermissionPrompt({ variant = "staff" }: Props) {
  const [, setStatus] = useState<ReturnType<typeof getPushPermissionStatus>>("idle");

  useEffect(() => {
    if (!isFirebaseClientConfigured() || !firebaseVapidKey) return;
    const current = getPushPermissionStatus();
    setStatus(current);

    if (current === "granted") {
      void registerPushToken();
      return;
    }

    if (variant === "customer" && current === "idle") {
      const timer = window.setTimeout(() => {
        void import("@/lib/push/register").then((m) =>
          m.requestPushPermissionAndRegister().then(setStatus)
        );
      }, 1000);
      return () => window.clearTimeout(timer);
    }
  }, [variant]);

  return <PwaServiceWorkerRegister />;
}
