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
      <label className="text-xs text-slate-500 uppercase">{label}</label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value={CUSTOM_COMPANY_VALUE}>Other… (custom name)</option>
      </select>
      {isCustom && (
        <input
          required
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          placeholder="Enter cargo company name"
          className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
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
