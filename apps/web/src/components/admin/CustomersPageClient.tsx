"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { AdminTableShell } from "@/components/admin/AdminTableShell";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  orders: { id: string; orderNumber: string }[];
}

interface Props {
  customers: CustomerRow[];
  page: number;
  totalPages: number;
  total: number;
  q: string;
  dateQuery?: Record<string, string | undefined>;
  canDelete?: boolean;
}

export function CustomersPageClient({
  customers: initial,
  page,
  totalPages,
  total,
  q,
  dateQuery = {},
  canDelete = false,
}: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomers(initial);
  }, [initial]);

  function startEdit(c: CustomerRow) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      address: c.address ?? "",
    });
    setError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setCustomers((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...data.customer } : c))
      );
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(c: CustomerRow) {
    if (!confirm(`Delete customer “${c.name}”? This cannot be undone.`)) return;
    setError("");
    const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    setCustomers((prev) => prev.filter((row) => row.id !== c.id));
    router.refresh();
  }

  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch placeholder="Search name, phone, or email…" defaultValue={q} />
        </Suspense>
      </div>
      <AdminTableShell>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50/95 z-10">
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.orders.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.orders[0] ? (
                      <Link
                        href={`/admin/orders/${c.orders[0].id}`}
                        className="text-xs text-[#4C3BCF] hover:underline"
                      >
                        View latest
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="p-1.5 rounded hover:bg-slate-100"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => removeCustomer(c)}
                        className="p-1.5 rounded hover:bg-red-50"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        basePath="/admin/customers"
        query={{ q: q || undefined, ...dateQuery }}
      />

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={saveEdit}
            className="boms-card w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Edit Customer</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 text-sm text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
