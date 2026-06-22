import type { Metadata } from "next";
import { OG_ALT, OG_SIZE } from "@/lib/og/brand-card";

export const SITE_NAME = "ZARKARI";
export const DEFAULT_TITLE = "ZARKARI | Designer Formal Wear UK";
export const DEFAULT_DESCRIPTION =
  "Designer formal wear from the ZARKARI catalogue — hand-finished pieces for weddings and celebrations.";

/** Canonical public site URL — no trailing slash. Used for OG/Twitter absolute image URLs. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Static brand card — reliable for WhatsApp/Meta crawlers (avoids dynamic /opengraph-image). */
export const OG_IMAGE_PATH = "/og-image.png?v=1";

export function getOgImageUrls() {
  const base = getSiteUrl();
  const image = `${base}${OG_IMAGE_PATH}`;
  return {
    openGraph: image,
    twitter: image,
  };
}

/** Merge page title/description into site-wide openGraph + twitter with brand OG image. */
export function pageMetadata(title: string, description?: string): Metadata {
  const desc = description ?? DEFAULT_DESCRIPTION;
  const fullTitle = title.includes("ZARKARI") ? title : `${title} | ZARKARI`;
  const base = getSiteUrl();

  return {
    title,
    description: desc,
    openGraph: {
      title: fullTitle,
      description: desc,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
      url: base,
      images: [
        {
          url: `${base}${OG_IMAGE_PATH}`,
          secureUrl: `${base}${OG_IMAGE_PATH}`,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt: OG_ALT,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [`${base}${OG_IMAGE_PATH}`],
    },
  };
}
