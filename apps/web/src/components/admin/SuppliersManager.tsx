"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, UserPlus } from "lucide-react";

interface SupplierRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

interface Perf {
  total: number;
  completed: number;
  successRate: number;
  lateDeliveries: number;
}

interface Props {
  initialSuppliers: SupplierRow[];
  performance: { supplierId: string; total: number; completed: number; successRate: number; lateDeliveries: number }[];
}

export function SuppliersManager({ initialSuppliers, performance }: Props) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const perfById = new Map(performance.map((p) => [p.supplierId, p]));

  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuppliers((prev) => [...prev, data.supplier]);
      setShowForm(false);
      setForm({ name: "", email: "", phone: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/suppliers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data.supplier } : s)));
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeSupplier(id: string) {
    if (!confirm("Remove this supplier? If they have orders, they will be deactivated instead.")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      return;
    }
    if (data.soft) {
      setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, active: false } : s)));
    } else {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
    router.refresh();
  }

  function startEdit(s: SupplierRow) {
    setEditing(s);
    setForm({ name: s.name, email: s.email ?? "", phone: s.phone ?? "" });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setForm({ name: "", email: "", phone: "" });
          }}
          data-tour="add-supplier"
          className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          Add Supplier
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={createSupplier} className="boms-card p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-900">New Supplier</h3>
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <button type="submit" disabled={loading} className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
            Create Supplier
          </button>
        </form>
      )}

      {editing && (
        <form onSubmit={saveEdit} className="boms-card p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Edit {editing.name}</h3>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {suppliers.map((supplier) => {
          const perf: Perf = perfById.get(supplier.id) ?? {
            total: 0,
            completed: 0,
            successRate: 0,
            lateDeliveries: 0,
          };
          return (
            <div key={supplier.id} className={`boms-card p-6 ${supplier.active === false ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{supplier.name}</h2>
                  <p className="text-sm text-slate-500">{supplier.email ?? supplier.phone ?? "—"}</p>
                  {supplier.active === false && (
                    <span className="text-xs text-amber-600 font-medium">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#4C3BCF]">{perf.successRate}%</span>
                  <button type="button" onClick={() => startEdit(supplier)} className="p-1.5 rounded hover:bg-slate-100" aria-label="Edit">
                    <Pencil className="h-4 w-4 text-slate-400" />
                  </button>
                  <button type="button" onClick={() => removeSupplier(supplier.id)} className="p-1.5 rounded hover:bg-red-50" aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                <div><dt className="text-slate-400 text-xs">Total</dt><dd className="font-semibold">{perf.total}</dd></div>
                <div><dt className="text-slate-400 text-xs">Completed</dt><dd className="font-semibold text-green-600">{perf.completed}</dd></div>
                <div><dt className="text-slate-400 text-xs">Late</dt><dd className="font-semibold text-red-600">{perf.lateDeliveries}</dd></div>
              </dl>
              <Link
                href={`/admin/users?supplierId=${supplier.id}&role=supplier`}
                className="inline-flex items-center gap-1.5 text-xs text-[#4C3BCF] hover:underline font-medium"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create login account
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
