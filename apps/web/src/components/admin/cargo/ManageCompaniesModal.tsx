"use client";

import { useEffect, useState } from "react";
import type { CargoCompany } from "@/lib/cargo/demo-store";

interface Props {
  canDelete: boolean;
  onClose: () => void;
  onChanged: (activeCompanies: CargoCompany[]) => void;
}

export function ManageCompaniesModal({ canDelete, onClose, onChanged }: Props) {
  const [companies, setCompanies] = useState<CargoCompany[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cargo/companies?all=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load companies");
      const list = (data.companies ?? []) as CargoCompany[];
      setCompanies(list);
      setDrafts(Object.fromEntries(list.map((c) => [c.id, c.name])));
      onChanged(list.filter((c) => c.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function rename(id: string) {
    const name = (drafts[id] ?? "").trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/cargo/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to rename");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setBusyId(null);
    }
  }

  async function deactivate(id: string, name: string) {
    if (!confirm(`Deactivate “${name}”? Existing boxes keep this company.`)) return;
    setBusyId(id);
    setError("");
    try {
      if (canDelete) {
        const res = await fetch("/api/cargo/companies", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to deactivate");
      } else {
        const res = await fetch("/api/cargo/companies", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, active: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to deactivate");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setBusyId(null);
    }
  }

  async function reactivate(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/cargo/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reactivate");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Manage companies</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rename or deactivate cargo companies</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm px-2 py-1"
          >
            Close
          </button>
        </div>

        <div className="p-5 overflow-auto flex-1 space-y-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : companies.length === 0 ? (
            <p className="text-sm text-slate-500">No companies yet.</p>
          ) : (
            companies.map((c) => {
              const dirty = (drafts[c.id] ?? "") !== c.name;
              const busy = busyId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-lg border px-3 py-3 space-y-2 ${
                    c.active ? "border-slate-200" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex gap-2">
                    <input
                      value={drafts[c.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => void rename(c.id)}
                      disabled={busy || !dirty}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${c.active ? "text-emerald-600" : "text-slate-400"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                    {c.active ? (
                      <button
                        type="button"
                        onClick={() => void deactivate(c.id, c.name)}
                        disabled={busy}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void reactivate(c.id)}
                        disabled={busy}
                        className="text-xs text-[#4C3BCF] hover:underline disabled:opacity-40"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
