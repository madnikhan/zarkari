"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Ruler } from "lucide-react";
import type { BridalOrder } from "@/lib/data/seed";
import type { BridalMeasurements } from "@/lib/measurements/bridal-form";
import { MeasurementFormModal } from "@/components/admin/MeasurementFormModal";
import { formatPrice } from "@/lib/utils";

interface Props {
  order: BridalOrder;
  onUpdated: () => void;
}

export function BridalOrderEditPanel({ order, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chargeSaving, setChargeSaving] = useState(false);
  const [error, setError] = useState("");
  const [chargeError, setChargeError] = useState("");
  const [dressType, setDressType] = useState(order.dressType ?? "");
  const [customisationNotes, setCustomisationNotes] = useState(
    order.customisationNotes ?? order.comments ?? ""
  );
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate.slice(0, 10));
  const [totalPrice, setTotalPrice] = useState(order.totalPrice);
  const [depositPaid, setDepositPaid] = useState(order.depositPaid);
  const [measurements, setMeasurements] = useState<BridalMeasurements | null>(
    order.measurements ?? null
  );
  const [extraLabel, setExtraLabel] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  const remainingPreview = useMemo(() => {
    const total = parseFloat(totalPrice) || 0;
    const deposit = parseFloat(depositPaid) || 0;
    return Math.max(0, total - deposit).toFixed(2);
  }, [totalPrice, depositPaid]);

  function resetForm() {
    setDressType(order.dressType ?? "");
    setCustomisationNotes(order.customisationNotes ?? order.comments ?? "");
    setDeliveryDate(order.deliveryDate.slice(0, 10));
    setTotalPrice(order.totalPrice);
    setDepositPaid(order.depositPaid);
    setMeasurements(order.measurements ?? null);
    setError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dressType: dressType.trim() || undefined,
          customisationNotes: customisationNotes.trim() || undefined,
          deliveryDate,
          totalPrice,
          depositPaid,
          measurements,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update order");
      setOpen(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function addExtraCharge(e: React.FormEvent) {
    e.preventDefault();
    setChargeSaving(true);
    setChargeError("");
    const amount = parseFloat(extraAmount);
    if (!extraLabel.trim() || !amount || amount <= 0) {
      setChargeError("Enter a label and amount greater than zero");
      setChargeSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraCharge: { label: extraLabel.trim(), amountGbp: amount.toFixed(2) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add extra charge");
      setExtraLabel("");
      setExtraAmount("");
      onUpdated();
    } catch (err) {
      setChargeError(err instanceof Error ? err.message : "Failed to add extra charge");
    } finally {
      setChargeSaving(false);
    }
  }

  return (
    <div className="boms-card p-4 mb-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Edit order</h2>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          {open ? "Close" : "Edit details"}
        </button>
      </div>

      {open && (
        <form onSubmit={saveEdit} className="space-y-3 border-t border-slate-100 pt-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 uppercase">Dress type</label>
            <input
              value={dressType}
              onChange={(e) => setDressType(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Delivery date</label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Customisation notes</label>
            <textarea
              rows={3}
              value={customisationNotes}
              onChange={(e) => setCustomisationNotes(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Total price (£)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Deposit paid (£)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={depositPaid}
                onChange={(e) => setDepositPaid(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Remaining balance after save: <span className="font-medium">{formatPrice(remainingPreview)}</span>
          </p>
          <div>
            <button
              type="button"
              onClick={() => setShowMeasurements(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4C3BCF] hover:underline"
            >
              <Ruler className="h-3.5 w-3.5" />
              {measurements ? "Edit measurements" : "Add measurements"}
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="boms-btn-primary w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}

      <form onSubmit={addExtraCharge} className="border-t border-slate-100 pt-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add extra charge
        </h3>
        {chargeError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {chargeError}
          </div>
        )}
        <div className="grid sm:grid-cols-[1fr_120px_auto] gap-2">
          <input
            value={extraLabel}
            onChange={(e) => setExtraLabel(e.target.value)}
            placeholder="e.g. Dupatta"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
            placeholder="£"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={chargeSaving}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            {chargeSaving ? "Adding…" : "Add"}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Increases total price and remaining balance. A note is appended to customisation notes.
        </p>
      </form>

      {showMeasurements && (
        <MeasurementFormModal
          initial={measurements}
          onSave={(data) => setMeasurements(data)}
          onClose={() => setShowMeasurements(false)}
        />
      )}
    </div>
  );
}
