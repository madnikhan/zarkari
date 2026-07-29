/** Bridal order dress types — curated allowlist (not retail stock). */
export const BRIDAL_DRESS_TYPES = [
  "Lehenga",
  "Sharara",
  "Gharara",
  "Anarkali",
  "Saree",
  "Suit",
  "Kurta",
  "Waistcoat",
  "Sherwani",
  "Dupatta only",
  "Other",
] as const;

export type BridalDressType = (typeof BRIDAL_DRESS_TYPES)[number];

export function isBridalDressType(value: string): boolean {
  return (BRIDAL_DRESS_TYPES as readonly string[]).includes(value);
}
