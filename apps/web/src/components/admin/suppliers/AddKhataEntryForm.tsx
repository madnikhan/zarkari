"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GbpPkrConverter } from "./GbpPkrConverter";

interface Props {
  supplierId: string;
}

export function AddKhataEntryForm({ supplierId }: Props) {
  const router = useRouter();
  const [type, setType] = useState<"bill" | "stock" | "payment">("bill");
  const [description, setDescription] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [amountGbp, setAmountGbp] = useState("");
  const [amountPkr, setAmountPkr] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          type,
          description: description || undefined,
          billNumber: billNumber || undefined,
          amountGbp: amountGbp || "0",
          amountPkr: amountPkr || "0",
          exchangeRate: exchangeRate || undefined,
          businessDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setDescription("");
      setBillNumber("");
      setAmountGbp("");
      setAmountPkr("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="boms-card p-5 space-y-4">
      <h3 className="font-semibold text-slate-900">Add Khata Entry</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 uppercase">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="bill">Bill</option>
            <option value="stock">Stock</option>
            <option value="payment">Payment</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Date</label>
          <input
            type="date"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
      {(type === "bill" || type === "stock") && (
        <input
          value={billNumber}
          onChange={(e) => setBillNumber(e.target.value)}
          placeholder="Bill / invoice number (optional)"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      )}
      <GbpPkrConverter
        amountGbp={amountGbp}
        amountPkr={amountPkr}
        exchangeRate={exchangeRate}
        onGbpChange={setAmountGbp}
        onPkrChange={setAmountPkr}
        onRateChange={setExchangeRate}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full boms-btn-primary py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Add Entry"}
      </button>
    </form>
  );
}
