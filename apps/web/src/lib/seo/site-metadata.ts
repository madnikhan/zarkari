import type { Metadata } from "next";
import { OG_ALT, OG_SIZE } from "@/lib/og/brand-card";

export const SITE_NAME = "ZARKARI";
export const DEFAULT_TITLE = "ZARKARI | Designer Formal Wear UK";
export const DEFAULT_DESCRIPTION =
  "Designer formal wear from the ZARKARI catalogue — hand-finished pieces for weddings and celebrations.";

const PRODUCTION_SITE_URL = "https://www.zarkari.co.uk";

/** Canonical public site URL — no trailing slash. Used for metadataBase / OG. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  // Never bake localhost into production builds (common Vercel misconfig).
  if (raw && !(isProd && /localhost|127\.0\.0\.1/i.test(raw))) {
    return raw.replace(/\/+$/, "");
  }
  if (isProd) return PRODUCTION_SITE_URL;
  return "http://localhost:3000";
}

/** Static brand card — reliable for WhatsApp/Meta crawlers (avoids dynamic /opengraph-image). */
export const OG_IMAGE_PATH = "/og-image.png?v=2";

/** Relative paths — resolved against metadataBase. */
export function getOgImageUrls() {
  return {
    openGraph: OG_IMAGE_PATH,
    twitter: OG_IMAGE_PATH,
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
          url: OG_IMAGE_PATH,
          secureUrl: OG_IMAGE_PATH,
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
      images: [OG_IMAGE_PATH],
    },
  };
}
