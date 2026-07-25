"use client";

import type { CargoCompany } from "@/lib/cargo/demo-store";

export const CUSTOM_COMPANY_VALUE = "__custom__";

interface Props {
  companies: CargoCompany[];
  value: string;
  onChange: (companyId: string) => void;
  customName: string;
  onCustomNameChange: (name: string) => void;
  label?: string;
  className?: string;
  /** Called when a new company is created via Other… (so parent can refresh lists). */
  onCompanyCreated?: (company: CargoCompany) => void;
}

export function CargoCompanySelect({
  companies,
  value,
  onChange,
  customName,
  onCustomNameChange,
  label = "Cargo company",
  className = "",
}: Props) {
  const isCustom = value === CUSTOM_COMPANY_VALUE;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-slate-500 uppercase">{label}</label>
        <button
          type="button"
          onClick={() => {
            onChange(CUSTOM_COMPANY_VALUE);
            onCustomNameChange("");
          }}
          className="text-xs font-medium text-[#4C3BCF] hover:underline"
        >
          + Add custom company
        </button>
      </div>
      <select
        required={!isCustom}
        value={isCustom ? CUSTOM_COMPANY_VALUE : value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      >
        <option value={CUSTOM_COMPANY_VALUE}>Other… (type a custom name)</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {isCustom && (
        <div className="mt-2 rounded-lg border border-[#4C3BCF]/30 bg-[#4C3BCF]/5 p-3 space-y-1.5">
          <label className="text-xs font-medium text-slate-700">New company name</label>
          <input
            required
            autoFocus
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="e.g. Skynet Express"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <p className="text-[11px] text-slate-500">
            Saved when you create/update the box — appears in the list next time.
          </p>
        </div>
      )}
    </div>
  );
}

/** Resolve select value to a real company id, creating via API when Other… is chosen. */
export async function resolveCargoCompanyId(
  selectedId: string,
  customName: string
): Promise<{ id: string; company?: CargoCompany }> {
  if (selectedId !== CUSTOM_COMPANY_VALUE) return { id: selectedId };
  const name = customName.trim();
  if (!name) throw new Error("Enter a custom cargo company name");
  const res = await fetch("/api/cargo/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = (await res.json().catch(() => ({}))) as { company?: CargoCompany; error?: string };
  if (!res.ok || !data.company?.id) {
    throw new Error(data.error ?? "Failed to create cargo company");
  }
  return { id: data.company.id, company: data.company };
}
