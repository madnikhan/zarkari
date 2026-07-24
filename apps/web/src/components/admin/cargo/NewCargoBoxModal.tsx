"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CargoBox, CargoCompany } from "@/lib/cargo/demo-store";
import type { Supplier } from "@/lib/data/seed";
import { parseJsonResponse } from "@/lib/upload/parse-json";

interface Props {
  companies: CargoCompany[];
  suppliers: Supplier[];
  onClose: () => void;
  onCreated: (box: CargoBox) => void;
}

export function NewCargoBoxModal({ companies, suppliers, onClose, onCreated }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [cargoCompanyId, setCargoCompanyId] = useState(companies[0]?.id ?? "");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [receivedDate, setReceivedDate] = useState(today);
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [postToKhata, setPostToKhata] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cargo/boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargoCompanyId,
          trackingNumber,
          supplierId,
          receivedDate,
          weightKg: weightKg || undefined,
          notes: notes || undefined,
          exchangeRate: exchangeRate || undefined,
          postToKhata,
        }),
      });
      const data = await parseJsonResponse<{ box?: CargoBox; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Failed to create box");
      if (!data.box) throw new Error("Failed to create box");
      onCreated(data.box);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create box");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Add New Box Entry</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Received date</label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Cargo company</label>
            <select
              required
              value={cargoCompanyId}
              onChange={(e) => setCargoCompanyId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Tracking number</label>
            <input
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Supplier</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Exchange rate (optional)</label>
            <input
              type="number"
              step="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="1 GBP = ? PKR"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={postToKhata}
              onChange={(e) => setPostToKhata(e.target.checked)}
              className="rounded border-slate-300"
            />
            Post costs to supplier khata on save
          </label>
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            After creating the box, add each dress with its name and detailed cost price (PKR / GBP).
            Post to khata after dresses are added if the box starts empty.
          </p>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 boms-btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Box"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
