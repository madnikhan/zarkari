"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOrder = searchParams.get("order") ?? "";
  const [orderNumber, setOrderNumber] = useState(presetOrder);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
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
        setError(data.error ?? "Could not verify your order");
        return;
      }
      router.push(`/my-order/${encodeURIComponent(orderNumber)}`);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full border border-slate-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]/30";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2 text-center">Track Your Order</h1>
      <p className="text-sm text-slate-500 text-center mb-8">
        Enter your order / invoice number and WhatsApp number to view status.
      </p>

      <form onSubmit={submit} className="boms-card p-6 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm">
          <span className="text-slate-500 text-xs uppercase">Order / Invoice Number</span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Order number"
            className={`${inputClass} font-mono`}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500 text-xs uppercase">WhatsApp Number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number"
            className={inputClass}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 boms-btn-primary rounded-lg text-sm font-medium"
        >
          {loading ? "Loading…" : "View Order Status"}
        </button>
      </form>
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
