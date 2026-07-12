export type MeasurementUnit = "cm" | "inches" | "m";

export type BridalMeasurements = {
  unit: MeasurementUnit;
  top: Record<string, string>;
  bottom: Record<string, string>;
  dupatta: Record<string, string>;
  notes?: string;
  takenBy?: string;
};

export const MEASUREMENT_UNITS: { value: MeasurementUnit; label: string }[] = [
  { value: "inches", label: "Inches" },
  { value: "cm", label: "Centimetres (cm)" },
  { value: "m", label: "Metres (m)" },
];

/** Field keys match the Zarri Palace paper measurement form. */
export const TOP_MEASUREMENT_FIELDS = [
  "Material",
  "Colour",
  "Thread Colour",
  "Stones Colour",
  "Shoulder",
  "Bust",
  "Waist",
  "Tummy",
  "Hips",
  "Sleeves Length",
  "Arm Around",
  "Upper Arm Round",
  "Arm Hole",
  "Front Neck Depth",
  "Front Neck Width",
  "Back Neck Depth",
  "Neck Collar Around",
  "Both Leg Round On Thigh",
  "Zip On",
  "Front Length",
  "Back Length",
] as const;

export const BOTTOM_MEASUREMENT_FIELDS = [
  "Material",
  "Colour",
  "Embroidery Colour",
  "Stones Colour",
  "Border",
  "Waist",
  "Hips",
  "Thigh",
  "Length",
  "Back Length",
  "Poncha",
  "Geera",
] as const;

export const DUPATTA_MEASUREMENT_FIELDS = [
  "Material",
  "Colour",
  "Embroidery",
  "Stones Colour",
  "Border Size",
  "Head Piece",
  "Length",
  "Width",
  "Tassels",
] as const;

export function emptyBridalMeasurements(unit: MeasurementUnit = "inches"): BridalMeasurements {
  const empty = (fields: readonly string[]) =>
    Object.fromEntries(fields.map((k) => [k, ""])) as Record<string, string>;
  return {
    unit,
    top: empty(TOP_MEASUREMENT_FIELDS),
    bottom: empty(BOTTOM_MEASUREMENT_FIELDS),
    dupatta: empty(DUPATTA_MEASUREMENT_FIELDS),
    notes: "",
    takenBy: "",
  };
}

export function hasAnyMeasurementValue(m: BridalMeasurements | null | undefined): boolean {
  if (!m) return false;
  const sections = [m.top, m.bottom, m.dupatta];
  for (const section of sections) {
    if (Object.values(section ?? {}).some((v) => v?.trim())) return true;
  }
  return Boolean(m.notes?.trim() || m.takenBy?.trim());
}

export function normalizeBridalMeasurements(
  raw: unknown
): BridalMeasurements | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Partial<BridalMeasurements>;
  const unit: MeasurementUnit =
    data.unit === "cm" || data.unit === "m" || data.unit === "inches" ? data.unit : "inches";
  const base = emptyBridalMeasurements(unit);
  return {
    unit,
    top: { ...base.top, ...(data.top ?? {}) },
    bottom: { ...base.bottom, ...(data.bottom ?? {}) },
    dupatta: { ...base.dupatta, ...(data.dupatta ?? {}) },
    notes: data.notes ?? "",
    takenBy: data.takenBy ?? "",
  };
}
