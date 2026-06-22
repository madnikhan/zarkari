"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ZarkariLogo } from "@/components/brand/ZarkariLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      const dest =
        data.role === "supplier" ? "/supplier" : data.role === "owner" || data.role === "staff" ? redirect : "/";
      router.push(dest);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
          <ZarkariLogo size="lg" />
        </div>
        <p className="text-center text-sm text-charcoal/50 mb-10">Staff & Supplier Login</p>
        <form onSubmit={submit} className="bg-white border border-sand rounded-lg p-8 space-y-5">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          <label className="block text-sm">
            <span className="text-charcoal/60 text-xs uppercase">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-sand rounded px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <span className="text-charcoal/60 text-xs uppercase">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-sand rounded px-3 py-2" required />
          </label>
          <button type="submit" disabled={loading} className="w-full py-3 bg-charcoal text-cream text-xs tracking-[0.15em] uppercase rounded hover:bg-gold hover:text-charcoal">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-charcoal/40 text-center mt-6">Demo: owner@zarkari.co.uk / demo123</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
