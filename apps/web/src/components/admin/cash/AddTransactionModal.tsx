"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { CashDirection, CashTransactionType } from "@/lib/db/cash-ledger";
import { CASH_TYPE_LABELS, CASH_IN_TYPES, CASH_OUT_TYPES } from "@/lib/cash/labels";
import { formatPrice } from "@/lib/utils";
import { GbpPkrConverter } from "@/components/admin/suppliers/GbpPkrConverter";

interface PayableOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  remainingBalance: string;
  depositPaid: string;
  totalPrice: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  direction: CashDirection;
  defaultType?: CashTransactionType;
}

const ORDER_LINKED_TYPES: CashTransactionType[] = ["order_deposit", "order_collection", "refund"];

function needsOrderPicker(type: CashTransactionType): boolean {
  return ORDER_LINKED_TYPES.includes(type);
}

export function AddTransactionModal({ open, onClose, date, direction, defaultType }: Props) {
  const router = useRouter();
  const [type, setType] = useState<CashTransactionType>(defaultType ?? (direction === "in" ? "other_in" : "other_out"));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [orderId, setOrderId] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [payableOrders, setPayableOrders] = useState<PayableOrder[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amountPkr, setAmountPkr] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(defaultType ?? (direction === "in" ? "other_in" : "other_out"));
    setAmount("");
    setMethod("cash");
    setOrderId("");
    setSupplierId("");
    setAmountPkr("");
    setExchangeRate("");
    setReference("");
    setDescription("");
    setError("");
  }, [open, defaultType, direction]);

  useEffect(() => {
    if (!open) return;
    setLoadingOrders(true);
    fetch("/api/cash/payable-orders")
      .then((r) => r.json())
      .then((d) => setPayableOrders(d.orders ?? []))
      .catch(() => setPayableOrders([]))
      .finally(() => setLoadingOrders(false));
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []))
      .catch(() => setSuppliers([]));
  }, [open]);

  if (!open) return null;

  const types = direction === "in" ? CASH_IN_TYPES : CASH_OUT_TYPES;
  const showOrderPicker = needsOrderPicker(type);
  const showSupplierPicker = type === "supplier_payment";
  const selectedOrder = payableOrders.find((o) => o.id === orderId);

  function handleTypeChange(next: CashTransactionType) {
    setType(next);
    if (!needsOrderPicker(next)) {
      setOrderId("");
    }
    if (next !== "supplier_payment") {
      setSupplierId("");
      setAmountPkr("");
      setExchangeRate("");
    }
  }

  function handleOrderSelect(id: string) {
    setOrderId(id);
    const order = payableOrders.find((o) => o.id === id);
    if (order) {
      setReference(order.orderNumber);
      setDescription(order.customerName);
    } else {
      setReference("");
      setDescription("");
    }
  }

  function fillRemainingBalance() {
    if (selectedOrder) setAmount(selectedOrder.remainingBalance);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (showOrderPicker && !orderId) {
        throw new Error("Please select an order / invoice number");
      }
      if (showSupplierPicker && !supplierId) {
        throw new Error("Please select a supplier");
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Please enter an amount");
      }

      if ((type === "order_deposit" || type === "order_collection") && orderId) {
        const paymentType = type === "order_deposit" ? "deposit" : "balance";
        const res = await fetch(`/api/orders/${orderId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: paymentType,
            amount,
            method: method === "cash" ? "cash" : "card",
            businessDate: date,
            description: description || selectedOrder?.customerName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save payment");
      } else {
        const res = await fetch("/api/cash/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction,
            type,
            amount,
            method,
            reference: reference || undefined,
            description: description || undefined,
            businessDate: date,
            orderId: orderId || undefined,
            supplierId: supplierId || undefined,
            amountPkr: showSupplierPicker ? amountPkr || undefined : undefined,
            exchangeRate: showSupplierPicker ? exchangeRate || undefined : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save");
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-slate-900">Add Transaction</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase">Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as CashTransactionType)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {CASH_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {showOrderPicker && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Order / Invoice</label>
              <select
                value={orderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                required
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">
                  {loadingOrders ? "Loading orders…" : "Select customer order…"}
                </option>
                {payableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customerName} ({formatPrice(o.remainingBalance)} due)
                  </option>
                ))}
              </select>
              {selectedOrder && (
                <p className="text-xs text-slate-500 mt-1">
                  Total {formatPrice(selectedOrder.totalPrice)} · Paid {formatPrice(selectedOrder.depositPaid)} ·
                  Remaining {formatPrice(selectedOrder.remainingBalance)}
                </p>
              )}
            </div>
          )}

          {showSupplierPicker && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showSupplierPicker && (
            <GbpPkrConverter
              amountGbp={amount}
              amountPkr={amountPkr}
              exchangeRate={exchangeRate}
              onGbpChange={setAmount}
              onPkrChange={setAmountPkr}
              onRateChange={setExchangeRate}
            />
          )}

          <div className={showSupplierPicker ? "" : "grid grid-cols-2 gap-3"}>
            {!showSupplierPicker && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Amount (£)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              {type === "order_collection" && selectedOrder && (
                <button
                  type="button"
                  onClick={fillRemainingBalance}
                  className="mt-1 text-xs text-[#4C3BCF] hover:underline"
                >
                  Fill remaining balance
                </button>
              )}
            </div>
            )}
            <div className={showSupplierPicker ? "w-full" : ""}>
              <label className="text-xs text-slate-500 uppercase">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "cash" | "online")}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          {!showOrderPicker && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional reference"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 uppercase">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={showOrderPicker ? "Customer name (auto-filled from order)" : "Optional note"}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full boms-btn-primary py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
