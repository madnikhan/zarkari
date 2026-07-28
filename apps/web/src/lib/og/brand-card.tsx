import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "ZARKARI — Designer Formal Wear UK";

export const LOGO_SQUARE_SIZE = { width: 1080, height: 1080 };
export const SOCIAL_BANNER_SIZE = { width: 1500, height: 500 };

export type BrandVariant = "dark" | "light";

const BRAND = {
  charcoal: "#1a1814",
  cream: "#faf8f5",
  gold: "#c9a962",
} as const;

const TAGLINE = "Designer formal wear — hand-finished pieces from our catalogue.";

async function loadMontserratWeight(weight: 100 | 400): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Montserrat:wght@${weight}&display=swap`,
      { next: { revalidate: 86400 } }
    ).then((res) => res.text());

    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2)'\)/);
    if (!match?.[1]) return null;

    return fetch(match[1]).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
}

function wordmarkColors(variant: BrandVariant) {
  if (variant === "dark") {
    return {
      thin: "rgba(250, 248, 245, 0.7)",
      bold: BRAND.cream,
      tagline: "rgba(250, 248, 245, 0.55)",
    };
  }
  return {
    thin: "rgba(26, 24, 20, 0.65)",
    bold: BRAND.charcoal,
    tagline: "rgba(26, 24, 20, 0.55)",
  };
}

function BrandShell({
  children,
  barHeight = 4,
  variant = "dark",
}: {
  children: ReactNode;
  barHeight?: number;
  variant?: BrandVariant;
}) {
  const isDark = variant === "dark";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? BRAND.charcoal : BRAND.cream,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barHeight,
          background: BRAND.gold,
        }}
      />
      {children}
    </div>
  );
}

/** Thin Z/RK/RI + bold barless Λ — matches screenshot wordmark. */
function BrandWordmark({
  fontFamily,
  fontSize,
  variant,
}: {
  fontFamily: string;
  fontSize: number;
  variant: BrandVariant;
}) {
  const colors = wordmarkColors(variant);
  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    lineHeight: 1,
    display: "flex",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        letterSpacing: "0.22em",
        marginLeft: "0.22em",
      }}
    >
      <span style={{ ...base, fontWeight: 100, color: colors.thin }}>Z</span>
      <span style={{ ...base, fontWeight: 400, color: colors.bold }}>Λ</span>
      <span style={{ ...base, fontWeight: 100, color: colors.thin }}>RK</span>
      <span style={{ ...base, fontWeight: 400, color: colors.bold }}>Λ</span>
      <span style={{ ...base, fontWeight: 100, color: colors.thin }}>RI</span>
    </div>
  );
}

function BrandTagline({
  fontFamily,
  fontSize,
  variant,
  marginTop,
}: {
  fontFamily: string;
  fontSize: number;
  variant: BrandVariant;
  marginTop: number;
}) {
  const colors = wordmarkColors(variant);
  return (
    <span
      style={{
        fontSize,
        fontWeight: 100,
        letterSpacing: "0.12em",
        color: colors.tagline,
        fontFamily,
        marginTop,
        textAlign: "center",
        maxWidth: "90%",
      }}
    >
      {TAGLINE}
    </span>
  );
}

export function BrandOgCard({
  fontFamily,
  variant = "dark",
}: {
  fontFamily: string;
  variant?: BrandVariant;
}) {
  return (
    <BrandShell variant={variant}>
      <BrandWordmark fontFamily={fontFamily} fontSize={96} variant={variant} />
      <BrandTagline fontFamily={fontFamily} fontSize={26} variant={variant} marginTop={28} />
    </BrandShell>
  );
}

export function BrandLogoSquareCard({
  fontFamily,
  variant = "dark",
}: {
  fontFamily: string;
  variant?: BrandVariant;
}) {
  return (
    <BrandShell variant={variant} barHeight={8}>
      <BrandWordmark fontFamily={fontFamily} fontSize={110} variant={variant} />
    </BrandShell>
  );
}

export function BrandSocialBannerCard({
  fontFamily,
  variant = "dark",
}: {
  fontFamily: string;
  variant?: BrandVariant;
}) {
  return (
    <BrandShell variant={variant} barHeight={6}>
      <BrandWordmark fontFamily={fontFamily} fontSize={72} variant={variant} />
      <BrandTagline fontFamily={fontFamily} fontSize={20} variant={variant} marginTop={20} />
    </BrandShell>
  );
}

async function withBrandFonts(
  element: (fontFamily: string) => ReactElement,
  size: { width: number; height: number }
) {
  const [thin, regular] = await Promise.all([
    loadMontserratWeight(100),
    loadMontserratWeight(400),
  ]);
  const fontFamily = thin || regular ? "Montserrat" : "ui-sans-serif, system-ui, sans-serif";

  const fonts: { name: string; data: ArrayBuffer; style: "normal"; weight: 100 | 400 }[] = [];
  if (thin) fonts.push({ name: "Montserrat", data: thin, style: "normal", weight: 100 });
  if (regular) fonts.push({ name: "Montserrat", data: regular, style: "normal", weight: 400 });

  return new ImageResponse(element(fontFamily), {
    ...size,
    ...(fonts.length ? { fonts } : {}),
  });
}

export function parseBrandVariant(value: string | null): BrandVariant {
  return value === "light" ? "light" : "dark";
}

export async function generateBrandOgImage(variant: BrandVariant = "dark") {
  return withBrandFonts(
    (fontFamily) => <BrandOgCard fontFamily={fontFamily} variant={variant} />,
    OG_SIZE
  );
}

export async function generateBrandLogoSquareImage(variant: BrandVariant = "dark") {
  return withBrandFonts(
    (fontFamily) => <BrandLogoSquareCard fontFamily={fontFamily} variant={variant} />,
    LOGO_SQUARE_SIZE
  );
}

export async function generateBrandSocialBannerImage(variant: BrandVariant = "dark") {
  return withBrandFonts(
    (fontFamily) => <BrandSocialBannerCard fontFamily={fontFamily} variant={variant} />,
    SOCIAL_BANNER_SIZE
  );
}
