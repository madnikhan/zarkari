export type MeasurementKey =
  | "bust"
  | "waist"
  | "hip"
  | "shoulder"
  | "sleeve"
  | "dressLength"
  | "neck"
  | "armhole"
  | "wrist"
  | "trouserLength";

export type StandardSizeKey = "S" | "M" | "L" | "XL" | "XXL";

export type Measurements = Record<MeasurementKey, number>;

export type SizeSelection = {
  mode: "standard" | "custom";
  label: string;
  measurements: Measurements;
};

export const MEASUREMENT_FIELDS: {
  key: MeasurementKey;
  label: string;
  howTo: string;
  min: number;
  max: number;
}[] = [
  {
    key: "neck",
    label: "Neck",
    howTo: "Measure around the base of the neck where the collar sits.",
    min: 12,
    max: 20,
  },
  {
    key: "shoulder",
    label: "Shoulder width",
    howTo: "Measure from shoulder point to shoulder point across the back.",
    min: 12,
    max: 22,
  },
  {
    key: "bust",
    label: "Bust",
    howTo: "Measure around the fullest part of the bust, keeping the tape level.",
    min: 28,
    max: 50,
  },
  {
    key: "waist",
    label: "Waist",
    howTo: "Measure around the natural waistline, typically the narrowest point.",
    min: 22,
    max: 44,
  },
  {
    key: "hip",
    label: "Hip",
    howTo: "Measure around the fullest part of the hips, about 8\" below the waist.",
    min: 30,
    max: 54,
  },
  {
    key: "armhole",
    label: "Armhole",
    howTo: "Measure around the shoulder joint where the sleeve attaches.",
    min: 14,
    max: 24,
  },
  {
    key: "sleeve",
    label: "Sleeve length",
    howTo: "Measure from shoulder point down the arm to the wrist bone.",
    min: 18,
    max: 28,
  },
  {
    key: "wrist",
    label: "Wrist",
    howTo: "Measure around the wrist bone where the cuff will sit.",
    min: 5,
    max: 10,
  },
  {
    key: "dressLength",
    label: "Dress / kameez length",
    howTo: "Measure from shoulder point down to the desired hem length.",
    min: 38,
    max: 60,
  },
  {
    key: "trouserLength",
    label: "Trouser / sharara length",
    howTo: "Measure from the waist down the leg to the desired trouser or sharara hem.",
    min: 36,
    max: 48,
  },
];

export const STANDARD_SIZES: StandardSizeKey[] = ["S", "M", "L", "XL", "XXL"];

export const STANDARD_SIZE_CHART: {
  size: StandardSizeKey;
  uk: string;
  measurements: Measurements;
}[] = [
  {
    size: "S",
    uk: "8",
    measurements: {
      neck: 13,
      shoulder: 14.5,
      bust: 32,
      waist: 26,
      hip: 36,
      armhole: 16,
      sleeve: 22,
      wrist: 6,
      dressLength: 48,
      trouserLength: 40,
    },
  },
  {
    size: "M",
    uk: "10",
    measurements: {
      neck: 13.5,
      shoulder: 15,
      bust: 34,
      waist: 28,
      hip: 38,
      armhole: 17,
      sleeve: 22.5,
      wrist: 6.25,
      dressLength: 49,
      trouserLength: 40.5,
    },
  },
  {
    size: "L",
    uk: "12",
    measurements: {
      neck: 14,
      shoulder: 15.5,
      bust: 36,
      waist: 30,
      hip: 40,
      armhole: 18,
      sleeve: 23,
      wrist: 6.5,
      dressLength: 50,
      trouserLength: 41,
    },
  },
  {
    size: "XL",
    uk: "14",
    measurements: {
      neck: 14.5,
      shoulder: 16,
      bust: 38,
      waist: 32,
      hip: 42,
      armhole: 19,
      sleeve: 23.5,
      wrist: 6.75,
      dressLength: 51,
      trouserLength: 41.5,
    },
  },
  {
    size: "XXL",
    uk: "16",
    measurements: {
      neck: 15,
      shoulder: 16.5,
      bust: 40,
      waist: 34,
      hip: 44,
      armhole: 20,
      sleeve: 24,
      wrist: 7,
      dressLength: 52,
      trouserLength: 42,
    },
  },
];

export function formatInches(value: number): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 4) / 4;
  return `${rounded}"`;
}

export function getStandardSize(size: StandardSizeKey) {
  return STANDARD_SIZE_CHART.find((row) => row.size === size);
}

export function buildStandardSelection(size: StandardSizeKey): SizeSelection {
  const row = getStandardSize(size);
  if (!row) throw new Error(`Unknown size: ${size}`);
  return {
    mode: "standard",
    label: size,
    measurements: { ...row.measurements },
  };
}

export function buildCustomSelection(measurements: Measurements): SizeSelection {
  return {
    mode: "custom",
    label: "Custom",
    measurements: { ...measurements },
  };
}

export function emptyCustomMeasurements(): Partial<Record<MeasurementKey, string>> {
  return Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, ""])) as Partial<
    Record<MeasurementKey, string>
  >;
}

export function parseCustomMeasurements(
  raw: Partial<Record<MeasurementKey, string>>
): { ok: true; measurements: Measurements } | { ok: false; errors: Partial<Record<MeasurementKey, string>> } {
  const errors: Partial<Record<MeasurementKey, string>> = {};
  const measurements = {} as Measurements;

  for (const field of MEASUREMENT_FIELDS) {
    const value = raw[field.key]?.trim() ?? "";
    if (!value) {
      errors[field.key] = "Required";
      continue;
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      errors[field.key] = "Enter a valid number";
      continue;
    }
    if (num < field.min || num > field.max) {
      errors[field.key] = `${field.min}–${field.max}"`;
      continue;
    }
    measurements[field.key] = num;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, measurements };
}

export function buildLineId(variantId: string, sizeSelection: SizeSelection): string {
  const payload = JSON.stringify({
    variantId,
    mode: sizeSelection.mode,
    label: sizeSelection.label,
    measurements: sizeSelection.measurements,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
  }
  return `${variantId}-${hash.toString(36)}`;
}

export function formatSizeSummary(sizeSelection: SizeSelection): string {
  if (sizeSelection.mode === "standard") {
    return `Size ${sizeSelection.label}`;
  }
  const { bust, waist, hip } = sizeSelection.measurements;
  return `Custom — Bust ${formatInches(bust)}, Waist ${formatInches(waist)}, Hip ${formatInches(hip)}`;
}
