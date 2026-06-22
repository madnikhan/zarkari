"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOrder = searchParams.get("order") ?? "";
  const [step, setStep] = useState<"lookup" | "otp">("lookup");
  const [orderNumber, setOrderNumber] = useState(presetOrder);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone: phone.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      if (data.demoOtp) setDemoOtp(data.demoOtp);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone: phone.replace(/\s/g, ""), otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        return;
      }
      router.push(`/my-order/${encodeURIComponent(orderNumber)}`);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]/30";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2 text-center">Track Your Order</h1>
      <p className="text-sm text-slate-500 text-center mb-8">
        {step === "lookup" ? "Enter your order number and phone." : "Enter the verification code sent to your email."}
      </p>

      {step === "lookup" ? (
        <form onSubmit={requestOtp} className="boms-card p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <label className="block text-sm">
            <span className="text-slate-500 text-xs uppercase">Order Number</span>
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="BR-2026-0152" className={`${inputClass} font-mono`} required />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500 text-xs uppercase">Phone Number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="447700900123" className={inputClass} required />
          </label>
          <button type="submit" disabled={loading} className="w-full py-3.5 boms-btn-primary rounded-lg text-sm font-medium">
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOtp} className="boms-card p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {demoOtp && (
            <p className="text-xs bg-[#F4F3FF] p-3 rounded-lg">
              Demo mode code: <strong>{demoOtp}</strong>
            </p>
          )}
          <label className="block text-sm">
            <span className="text-slate-500 text-xs uppercase">Verification Code</span>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" className={`${inputClass} font-mono text-center tracking-widest`} required maxLength={6} />
          </label>
          <button type="submit" disabled={loading} className="w-full py-3.5 boms-btn-primary rounded-lg text-sm font-medium">
            {loading ? "Verifying..." : "View Order"}
          </button>
          <button type="button" onClick={() => setStep("lookup")} className="w-full text-xs text-slate-400">
            ← Back
          </button>
        </form>
      )}

      <p className="text-xs text-slate-400 text-center mt-6">Demo: BR-2026-0152 · 447700900123</p>
    </div>
  );
}

export default function MyOrderLoginPage() {
  return (
    <Suspense>
      <LoginFlow />
    </Suspense>
  );
}
