"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  supplierId?: string;
}

interface Supplier {
  id: string;
  name: string;
}

export function UsersManager() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "staff", supplierId: "" });
  const [editForm, setEditForm] = useState({ name: "", role: "staff", password: "", supplierId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setError("Failed to load users"));
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []))
      .catch(() => {});
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierId: form.role === "supplier" ? form.supplierId || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUsers((prev) => [...prev, data.user]);
      setShowForm(false);
      setForm({ email: "", password: "", name: "", role: "staff", supplierId: "" });
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
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: editForm.name,
          role: editForm.role,
          supplierId: editForm.role === "supplier" ? editForm.supplierId || undefined : undefined,
          ...(editForm.password ? { password: editForm.password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...data.user } : u)));
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeUser(id: string) {
    if (!confirm("Remove this user?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    else setError("Failed to remove user");
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => setShowForm(!showForm)} className="boms-btn-primary px-4 py-2 rounded-lg text-sm">
          Add user
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={createUser} className="boms-card p-4 mb-6 space-y-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
            <option value="supplier">Supplier</option>
          </select>
          {form.role === "supplier" && (
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={loading} className="boms-btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            Create user
          </button>
        </form>
      )}

      {editing && (
        <form onSubmit={saveEdit} className="boms-card p-4 mb-6 space-y-3">
          <p className="text-sm font-medium">Edit {editing.email}</p>
          <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
            <option value="supplier">Supplier</option>
          </select>
          {editForm.role === "supplier" && (
            <select
              value={editForm.supplierId}
              onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <input type="password" placeholder="New password (optional)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="boms-btn-primary px-4 py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs bg-[#F4F3FF] text-[#4C3BCF] capitalize">{user.role}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(user);
                      setEditForm({
                        name: user.name,
                        role: user.role,
                        password: "",
                        supplierId: user.supplierId ?? "",
                      });
                    }}
                    className="text-xs text-[#4C3BCF] hover:underline"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => removeUser(user.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
