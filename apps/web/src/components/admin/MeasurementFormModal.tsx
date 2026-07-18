"use client";

import { useState } from "react";
import { Ruler, X } from "lucide-react";
import {
  BOTTOM_MEASUREMENT_FIELDS,
  DUPATTA_MEASUREMENT_FIELDS,
  MEASUREMENT_UNITS,
  TOP_MEASUREMENT_FIELDS,
  emptyBridalMeasurements,
  type BridalMeasurements,
  type MeasurementUnit,
} from "@/lib/measurements/bridal-form";

interface Props {
  initial?: BridalMeasurements | null;
  onSave: (data: BridalMeasurements) => void;
  onClose: () => void;
}

function SectionFields({
  title,
  fields,
  values,
  onChange,
}: {
  title: string;
  fields: readonly string[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#4C3BCF] mb-3 border-b border-slate-100 pb-2">
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((key) => (
          <label key={`${title}-${key}`} className="block text-sm">
            <span className="text-slate-500 text-xs">{key}</span>
            <input
              type="text"
              value={values[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

export function MeasurementFormModal({ initial, onSave, onClose }: Props) {
  const [data, setData] = useState<BridalMeasurements>(
    () => initial ?? emptyBridalMeasurements("inches")
  );

  function setUnit(unit: MeasurementUnit) {
    setData((d) => ({ ...d, unit }));
  }

  function setSection(
    section: "top" | "bottom" | "dupatta",
    key: string,
    value: string
  ) {
    setData((d) => ({
      ...d,
      [section]: { ...d[section], [key]: value },
    }));
  }

  function handleSave() {
    onSave(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-[#4C3BCF]" />
            <h2 className="font-semibold text-slate-900">Measurements</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto p-5 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Measurement scale</p>
              <div className="flex flex-wrap gap-2">
                {MEASUREMENT_UNITS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUnit(u.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      data.unit === u.value
                        ? "bg-[#4C3BCF] text-white border-[#4C3BCF]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#4C3BCF]/40"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                All values below are recorded in {data.unit}.
              </p>
            </div>

            <SectionFields
              title="Top"
              fields={TOP_MEASUREMENT_FIELDS}
              values={data.top}
              onChange={(k, v) => setSection("top", k, v)}
            />
            <SectionFields
              title="Bottom"
              fields={BOTTOM_MEASUREMENT_FIELDS}
              values={data.bottom}
              onChange={(k, v) => setSection("bottom", k, v)}
            />
            <SectionFields
              title="Dupatta"
              fields={DUPATTA_MEASUREMENT_FIELDS}
              values={data.dupatta}
              onChange={(k, v) => setSection("dupatta", k, v)}
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-500 text-xs uppercase tracking-wide">Notes</span>
                <textarea
                  value={data.notes ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[72px]"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-500 text-xs uppercase tracking-wide">
                  Measurement taken by
                </span>
                <input
                  type="text"
                  value={data.takenBy ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, takenBy: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end px-5 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="boms-btn-primary px-4 py-2 rounded-lg text-sm font-medium"
            >
              Save measurements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
