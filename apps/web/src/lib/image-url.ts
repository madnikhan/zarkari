const FALLBACK_IMAGE = "/catalog/guldaan/1.png";

/** Remap any remote placeholder URL to a local catalog image. */
export function sanitizeImageUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.includes("unsplash.com")) return FALLBACK_IMAGE;
  return url;
}
