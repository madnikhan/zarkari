"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("boms-pwa-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIos && !standalone) setShowIosHelp(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("boms-pwa-dismissed", "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferred || installing) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") dismiss();
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  }

  if (dismissed) return null;

  if (deferred) {
    return (
      <div className="bg-[#4C3BCF] text-white px-4 py-3 flex items-center gap-3 print:hidden">
        <Smartphone className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm flex-1">Install ZARKARI BOMS on your phone for quick access.</p>
        <button
          type="button"
          onClick={install}
          disabled={installing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#4C3BCF] rounded-lg text-xs font-semibold disabled:opacity-70"
        >
          {installing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Installing…
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Install
            </>
          )}
        </button>
        <button type="button" onClick={dismiss} aria-label="Dismiss" disabled={installing}>
          <X className="h-4 w-4 opacity-70" />
        </button>
      </div>
    );
  }

  if (showIosHelp) {
    return (
      <div className="bg-slate-800 text-white px-4 py-3 flex items-start gap-3 print:hidden">
        <Smartphone className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Add to Home Screen</p>
          <p className="text-white/70 text-xs mt-1">Tap Share → Add to Home Screen in Safari.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4 opacity-70" />
        </button>
      </div>
    );
  }

  return null;
}
