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

const ORDER_LINKED_TYPES: CashTransactionType[] = ["order_collection", "refund"];

function needsOrderPicker(type: CashTransactionType): boolean {
  return ORDER_LINKED_TYPES.includes(type);
}

function needsManualOrderNumber(type: CashTransactionType): boolean {
  return type === "order_deposit";
}

export function AddTransactionModal({ open, onClose, date, direction, defaultType }: Props) {
  const router = useRouter();
  const [type, setType] = useState<CashTransactionType>(defaultType ?? (direction === "in" ? "other_in" : "other_out"));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [orderId, setOrderId] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseOther, setExpenseOther] = useState("");
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
    setExpenseCategory("");
    setExpenseOther("");
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
  const showManualOrderNumber = needsManualOrderNumber(type);
  const showSupplierPicker = type === "supplier_payment";
  const showExpenseCategory = type === "business_expense";
  const selectedOrder = payableOrders.find((o) => o.id === orderId);

  const filteredOrders = (() => {
    if (!showOrderPicker) return payableOrders;
    const q = reference.trim().toLowerCase();
    if (!q || orderId) return payableOrders;
    return payableOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  })();

  function handleTypeChange(next: CashTransactionType) {
    setType(next);
    if (!needsOrderPicker(next)) {
      setOrderId("");
    }
    if (!needsManualOrderNumber(next) && !needsOrderPicker(next)) {
      setReference("");
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
      if (showManualOrderNumber && !reference.trim()) {
        throw new Error("Please enter an order / invoice number");
      }
      if (showSupplierPicker && !supplierId) {
        throw new Error("Please select a supplier");
      }
      if (type === "business_expense") {
        if (!expenseCategory) throw new Error("Please select an expense category");
        if (expenseCategory === "Other" && !expenseOther.trim()) throw new Error("Please enter a custom expense name");
      }
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Please enter an amount");
      }

      if (type === "order_deposit") {
        const matched =
          payableOrders.find(
            (o) => o.orderNumber.toLowerCase() === reference.trim().toLowerCase()
          ) ?? null;
        if (matched) {
          const res = await fetch(`/api/orders/${matched.id}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "deposit",
              amount,
              method: method === "cash" ? "cash" : "card",
              businessDate: date,
              description: description || matched.customerName,
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
              type: "order_deposit",
              amount,
              method,
              reference: reference.trim(),
              description: description || undefined,
              businessDate: date,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to save");
        }
      } else if (type === "order_collection" && orderId) {
        const res = await fetch(`/api/orders/${orderId}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "balance",
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
            expenseCategory:
              type === "business_expense"
                ? expenseCategory === "Other"
                  ? expenseOther.trim() || undefined
                  : expenseCategory || undefined
                : undefined,
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

          {showManualOrderNumber && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Order / Invoice</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                placeholder="Enter order / invoice number"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">
                Type the order number manually. If it matches an order in the system, the deposit will update that order too.
              </p>
            </div>
          )}

          {showOrderPicker && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Order / Invoice</label>
              <input
                list="payable-orders-list"
                value={
                  orderId
                    ? `${selectedOrder?.orderNumber ?? ""} — ${selectedOrder?.customerName ?? ""}`
                    : reference
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const match = payableOrders.find(
                    (o) =>
                      `${o.orderNumber} — ${o.customerName}` === val ||
                      o.orderNumber.toLowerCase() === val.trim().toLowerCase()
                  );
                  if (match) {
                    handleOrderSelect(match.id);
                  } else {
                    setOrderId("");
                    setReference(val);
                    setDescription("");
                  }
                }}
                required
                placeholder={loadingOrders ? "Loading orders…" : "Select customer order…"}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <datalist id="payable-orders-list">
                {filteredOrders.map((o) => (
                  <option
                    key={o.id}
                    value={`${o.orderNumber} — ${o.customerName}`}
                  >{`${formatPrice(o.remainingBalance)} due`}</option>
                ))}
              </datalist>
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

          {showExpenseCategory && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500 uppercase">Expense category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  required
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select category…</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Staff wages">Staff wages</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Travel">Travel</option>
                  <option value="Cargo / freight">Cargo / freight</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {expenseCategory === "Other" && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Custom expense name</label>
                  <input
                    value={expenseOther}
                    onChange={(e) => setExpenseOther(e.target.value)}
                    required
                    placeholder="e.g. Shop repairs"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
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

          {!showOrderPicker && !showManualOrderNumber && (
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
              placeholder={
                showOrderPicker
                  ? "Customer name (auto-filled from order)"
                  : showManualOrderNumber
                    ? "Customer name or note"
                    : "Optional note"
              }
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
