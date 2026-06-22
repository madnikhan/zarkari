"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "zarkari-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-charcoal text-cream p-6 md:p-8 shadow-2xl border border-cream/10">
        <h2 className="font-display text-lg mb-2">We value your privacy</h2>
        <p className="text-sm text-cream/70 leading-relaxed mb-6">
          We use cookies to improve your experience, analyse site traffic, and support our marketing efforts.
          By clicking &quot;Accept&quot;, you consent to our use of cookies in accordance with UK GDPR and PECR.
          Read our{" "}
          <Link href="/pages/privacy" className="text-gold underline hover:no-underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={accept}
            className="px-6 py-3 bg-gold text-charcoal text-xs tracking-[0.2em] uppercase hover:bg-cream transition-colors"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={decline}
            className="px-6 py-3 border border-cream/30 text-cream text-xs tracking-[0.2em] uppercase hover:bg-cream/10 transition-colors"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
