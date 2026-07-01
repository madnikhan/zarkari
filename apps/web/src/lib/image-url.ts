const FALLBACK_IMAGE = "/catalog/guldaan/1.png";

/** Encode # in URLs so fragments do not break next/image and browser fetches. */
export function publicAssetUrl(url?: string): string | undefined {
  if (!url) return url;
  if (!url.includes("#")) return url;
  return url.replace(/#/g, "%23");
}

/** Remap any remote placeholder URL to a local catalog image. */
export function sanitizeImageUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.includes("unsplash.com")) return FALLBACK_IMAGE;
  return publicAssetUrl(url);
}
