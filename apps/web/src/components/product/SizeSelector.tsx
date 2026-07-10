"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import {
  MEASUREMENT_FIELDS,
  STANDARD_SIZES,
  buildCustomSelection,
  buildStandardSelection,
  emptyCustomMeasurements,
  formatInches,
  getStandardSize,
  parseCustomMeasurements,
  type MeasurementKey,
  type SizeSelection,
  type StandardSizeKey,
} from "@/lib/sizing";
import { cn } from "@/lib/utils";
import { MeasurementGuideDiagram } from "./MeasurementGuideDiagram";

interface SizeSelectorProps {
  value: SizeSelection | null;
  onChange: (selection: SizeSelection | null) => void;
  stockBySize?: Partial<Record<StandardSizeKey, number>>;
  onSizeSelect?: (size: StandardSizeKey) => void;
}

export function SizeSelector({ value, onChange, stockBySize, onSizeSelect }: SizeSelectorProps) {
  const [mode, setMode] = useState<"standard" | "custom">(value?.mode ?? "standard");
  const [standardSize, setStandardSize] = useState<StandardSizeKey | null>(
    value?.mode === "standard" ? (value.label as StandardSizeKey) : null
  );
  const [customInputs, setCustomInputs] = useState(emptyCustomMeasurements());
  const [customErrors, setCustomErrors] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [customConfirmed, setCustomConfirmed] = useState(value?.mode === "custom");

  const activeStandard = standardSize ? getStandardSize(standardSize) : null;

  function selectStandard(size: StandardSizeKey) {
    if (stockBySize && (stockBySize[size] ?? 0) <= 0) return;
    setMode("standard");
    setStandardSize(size);
    setCustomConfirmed(false);
    setCustomErrors({});
    onSizeSelect?.(size);
    onChange(buildStandardSelection(size));
  }

  function openCustom() {
    setMode("custom");
    setStandardSize(null);
    setCustomConfirmed(false);
    onChange(null);
  }

  function updateCustomInput(key: MeasurementKey, val: string) {
    setCustomInputs((prev) => ({ ...prev, [key]: val }));
    setCustomConfirmed(false);
    onChange(null);
    if (customErrors[key]) {
      setCustomErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function confirmCustom() {
    const result = parseCustomMeasurements(customInputs);
    if (!result.ok) {
      setCustomErrors(result.errors);
      setCustomConfirmed(false);
      onChange(null);
      return;
    }
    setCustomErrors({});
    setCustomConfirmed(true);
    onChange(buildCustomSelection(result.measurements));
  }

  const displayMeasurements =
    mode === "standard" && activeStandard
      ? activeStandard.measurements
      : value?.mode === "custom"
        ? value.measurements
        : null;

  return (
    <div className="mb-6">
      <p className="text-xs tracking-[0.2em] uppercase text-charcoal mb-3">Size</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {STANDARD_SIZES.map((size) => {
          const outOfStock = stockBySize !== undefined && (stockBySize[size] ?? 0) <= 0;
          return (
            <button
              key={size}
              type="button"
              onClick={() => selectStandard(size)}
              disabled={outOfStock}
              className={cn(
                "min-w-[3rem] px-4 py-3 text-sm border transition-colors relative",
                outOfStock && "opacity-40 cursor-not-allowed line-through",
                mode === "standard" && standardSize === size
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-sand hover:border-charcoal"
              )}
            >
              {size}
            </button>
          );
        })}
        <button
          type="button"
          onClick={openCustom}
          className={cn(
            "px-4 py-3 text-sm border transition-colors",
            mode === "custom"
              ? "border-gold bg-gold/10 text-charcoal"
              : "border-sand hover:border-charcoal"
          )}
        >
          Custom
        </button>
      </div>

      {mode === "custom" && (
        <div className="border border-sand p-4 mb-4 space-y-4">
          <p className="text-xs tracking-[0.15em] uppercase text-charcoal/60">
            Enter your measurements (inches)
          </p>
          <details className="group">
            <summary className="text-sm text-gold cursor-pointer hover:underline list-none flex items-center gap-1">
              <span className="group-open:hidden">Show measurement guide diagram</span>
              <span className="hidden group-open:inline">Hide measurement guide diagram</span>
            </summary>
            <div className="mt-4 pt-4 border-t border-sand">
              <MeasurementGuideDiagram />
            </div>
          </details>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map((field, index) => (
              <label key={field.key} className="block text-sm">
                <span className="text-charcoal/80">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-charcoal text-xs font-medium mr-1.5">
                    {index + 1}
                  </span>
                  {field.label}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min={field.min}
                    max={field.max}
                    value={customInputs[field.key] ?? ""}
                    onChange={(e) => updateCustomInput(field.key, e.target.value)}
                    className={cn(
                      "w-full border px-3 py-2 text-charcoal bg-cream focus:outline-none focus:border-gold",
                      customErrors[field.key] ? "border-red-400" : "border-sand"
                    )}
                    placeholder={`${field.min}–${field.max}`}
                  />
                  <span className="text-charcoal/40 text-xs shrink-0">in</span>
                </div>
                {customErrors[field.key] && (
                  <span className="text-xs text-red-600 mt-0.5 block">{customErrors[field.key]}</span>
                )}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={confirmCustom}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-colors",
              customConfirmed
                ? "border-charcoal bg-charcoal text-cream"
                : "border-charcoal text-charcoal hover:bg-charcoal hover:text-cream"
            )}
          >
            <Check className="w-4 h-4" aria-hidden />
            {customConfirmed ? "Measurements confirmed" : "Confirm measurements"}
          </button>
        </div>
      )}

      {displayMeasurements && (
        <div className="border border-sand/80 bg-sand/10 p-4">
          <p className="text-xs tracking-[0.15em] uppercase text-charcoal/60 mb-3">
            {mode === "standard" && standardSize
              ? `Size ${standardSize} measurements`
              : "Your custom measurements"}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field.key}>
                <dt className="text-charcoal/50 text-xs">{field.label}</dt>
                <dd className="text-charcoal font-medium">
                  {formatInches(displayMeasurements[field.key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
