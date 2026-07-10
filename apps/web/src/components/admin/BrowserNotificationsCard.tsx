"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getPushPermissionStatus,
  registerPushToken,
  requestPushPermissionAndRegister,
  type PushRegistrationStatus,
} from "@/lib/push/register";

const DISMISS_KEY = "zarkari-push-card-dismissed";

export function BrowserNotificationsCard() {
  const [status, setStatus] = useState<PushRegistrationStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setStatus(getPushPermissionStatus());
    if (getPushPermissionStatus() === "granted") {
      void registerPushToken();
    }
  }, []);

  if (dismissed || status === "granted" || status === "unsupported") return null;

  async function enable() {
    setLoading(true);
    try {
      const next = await requestPushPermissionAndRegister();
      setStatus(next);
      if (next === "granted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mb-6 boms-card p-4 flex gap-4 items-start border border-[#4C3BCF]/20 bg-[#F4F3FF]/50">
      <div className="p-2 rounded-lg bg-white shrink-0">
        {status === "denied" ? (
          <BellOff className="h-5 w-5 text-slate-400" />
        ) : (
          <Bell className="h-5 w-5 text-[#4C3BCF]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">Browser notifications</p>
        {status === "denied" ? (
          <p className="text-xs text-slate-600 mt-1">
            Notifications are blocked. Allow notifications in your browser site settings for zarkari.co.uk.
          </p>
        ) : (
          <p className="text-xs text-slate-600 mt-1">
            Get alerts for new messages and order updates even when this tab is in the background.
          </p>
        )}
        {status !== "denied" && (
          <button
            type="button"
            onClick={() => void enable()}
            disabled={loading}
            className="mt-3 boms-btn-primary px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {loading ? "Enabling…" : "Enable browser notifications"}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
