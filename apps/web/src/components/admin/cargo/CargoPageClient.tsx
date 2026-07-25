"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { CargoBox, CargoCompany } from "@/lib/cargo/demo-store";
import type { Supplier } from "@/lib/data/seed";
import { resolveSearchDateBounds } from "@/lib/admin/date-range";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import { CargoBoxDetail } from "./CargoBoxDetail";
import { CargoBoxList } from "./CargoBoxList";
import { NewCargoBoxModal } from "./NewCargoBoxModal";

function buildBoxesQuery(search: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  const bounds = resolveSearchDateBounds({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    preset: searchParams.get("preset") ?? undefined,
  });
  if (bounds.from) params.set("from", bounds.from);
  if (bounds.to) params.set("to", bounds.to);
  // Keep preset so filter UI stays in sync when navigating
  const preset = searchParams.get("preset");
  if (preset && !searchParams.get("from")) params.set("preset", preset);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function CargoPageClient() {
  const searchParams = useSearchParams();
  const [boxes, setBoxes] = useState<CargoBox[]>([]);
  const [companies, setCompanies] = useState<CargoCompany[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<CargoBox | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewBox, setShowNewBox] = useState(false);
  const [error, setError] = useState("");

  const dateKey = `${searchParams.get("from") ?? ""}|${searchParams.get("to") ?? ""}|${searchParams.get("preset") ?? ""}`;

  const loadBoxes = useCallback(
    async (q?: string) => {
      const res = await fetch(`/api/cargo/boxes${buildBoxesQuery(q ?? "", searchParams)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load boxes");
      setBoxes(data.boxes ?? []);
      return data.boxes as CargoBox[];
    },
    [searchParams]
  );

  const loadBox = useCallback(async (id: string) => {
    const res = await fetch(`/api/cargo/boxes/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load box");
    setSelectedBox(data.box);
    return data.box as CargoBox;
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");
      try {
        const [companiesRes, suppliersRes] = await Promise.all([
          fetch("/api/cargo/companies"),
          fetch("/api/suppliers"),
        ]);
        const companiesData = await companiesRes.json();
        const suppliersData = await suppliersRes.json();
        setCompanies(companiesData.companies ?? []);
        setSuppliers(suppliersData.suppliers ?? []);
        const list = await loadBoxes(search || undefined);
        if (list.length && !selectedId) {
          setSelectedId(list[0].id);
          await loadBox(list[0].id);
        } else if (selectedId && !list.some((b) => b.id === selectedId)) {
          if (list[0]) {
            setSelectedId(list[0].id);
            await loadBox(list[0].id);
          } else {
            setSelectedId(null);
            setSelectedBox(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cargo data");
      } finally {
        setLoading(false);
      }
    }
    void init();
    // Reload when date range query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  async function handleSearch(q: string) {
    setSearch(q);
    try {
      const list = await loadBoxes(q);
      if (selectedId && !list.some((b) => b.id === selectedId)) {
        if (list[0]) {
          setSelectedId(list[0].id);
          await loadBox(list[0].id);
        } else {
          setSelectedId(null);
          setSelectedBox(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function selectBox(id: string) {
    setSelectedId(id);
    try {
      await loadBox(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load box");
    }
  }

  async function refreshAll() {
    const companiesRes = await fetch("/api/cargo/companies");
    const companiesData = await companiesRes.json();
    if (companiesRes.ok) setCompanies(companiesData.companies ?? []);
    await loadBoxes(search || undefined);
    if (selectedId) await loadBox(selectedId);
  }

  async function handleBoxCreated(box: CargoBox, newCompany?: CargoCompany) {
    setShowNewBox(false);
    if (newCompany) {
      setCompanies((prev) =>
        prev.some((c) => c.id === newCompany.id)
          ? prev
          : [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      const companiesRes = await fetch("/api/cargo/companies");
      const companiesData = await companiesRes.json();
      if (companiesRes.ok) setCompanies(companiesData.companies ?? []);
    }
    await loadBoxes(search || undefined);
    setSelectedId(box.id);
    setSelectedBox(box);
  }

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Loading cargo records…</p>;
  }

  return (
    <div className="p-4 lg:p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cargo &amp; Box Records</h1>
          <p className="text-sm text-slate-500 mt-1">Track incoming shipment boxes from Pakistan</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewBox(true)}
          data-tour="cargo-add-box"
          className="boms-btn-primary px-4 py-2 rounded-lg text-sm font-medium shrink-0"
        >
          + Add New Box Entry
        </button>
      </div>

      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminDateRangeFilter preserveKeys={[]} />
        </Suspense>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4 min-h-0">
        <div className="flex flex-col min-h-0 boms-card overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">All Boxes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => void handleSearch(e.target.value)}
                placeholder="Search Box / Tracking No."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <CargoBoxList
            boxes={boxes}
            selectedId={selectedId}
            onSelect={(id) => void selectBox(id)}
          />
          <p className="text-xs text-slate-400 px-3 py-2 border-t border-slate-100">
            Total Boxes: {boxes.length}
          </p>
        </div>

        <div className="min-h-0 overflow-auto">
          {selectedBox ? (
            <CargoBoxDetail
              box={selectedBox}
              companies={companies}
              suppliers={suppliers}
              onRefresh={() => void refreshAll()}
              onDeleted={() => {
                setSelectedId(null);
                setSelectedBox(null);
                void loadBoxes(search || undefined);
              }}
            />
          ) : (
            <div className="boms-card p-8 text-center text-sm text-slate-400">
              Select a box or add a new entry
            </div>
          )}
        </div>
      </div>

      {showNewBox && (
        <NewCargoBoxModal
          companies={companies}
          suppliers={suppliers}
          onClose={() => setShowNewBox(false)}
          onCreated={(box, company) => void handleBoxCreated(box, company)}
        />
      )}
    </div>
  );
}
