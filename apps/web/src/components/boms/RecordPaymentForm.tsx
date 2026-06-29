"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  orderNumber: string;
  remainingBalance: string;
}

export function RecordPaymentForm({ orderId, orderNumber, remainingBalance }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("balance");
  const [amount, setAmount] = useState(remainingBalance);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#4C3BCF] hover:underline font-medium"
      >
        Record payment
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
      <p className="font-medium text-slate-700">{orderNumber}</p>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
      >
        <option value="deposit">Deposit</option>
        <option value="balance">Balance</option>
        <option value="alteration">Alteration</option>
      </select>
      <input
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
        placeholder="Amount (£)"
      />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
      >
        <option value="card">Card</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank transfer</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-1.5 text-slate-600">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !amount}
          className="flex-1 py-1.5 boms-btn-primary rounded text-xs font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
