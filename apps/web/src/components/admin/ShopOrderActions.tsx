"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  status: string;
  canDelete: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export function ShopOrderActions({
  orderId,
  status,
  canDelete,
  customerName = "",
  customerPhone = "",
  customerEmail = "",
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [email, setEmail] = useState(customerEmail);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/retail-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim() || null,
          customerPhone: phone.trim() || null,
          customerEmail: email.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrder() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/retail-orders/${orderId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      router.push("/admin/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="boms-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Edit customer</h2>
        <form onSubmit={saveCustomer} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save customer"}
          </button>
        </form>
      </div>

      {canDelete && status === "cancelled" && (
        <div className="boms-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Delete order</h2>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50"
            >
              Delete order
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Permanently delete this cancelled order? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={removeOrder}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
