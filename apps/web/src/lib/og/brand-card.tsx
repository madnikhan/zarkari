import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "ZARKARI — Designer Formal Wear UK";

export const LOGO_SQUARE_SIZE = { width: 1080, height: 1080 };
export const SOCIAL_BANNER_SIZE = { width: 1500, height: 500 };

export type BrandVariant = "dark" | "light";
export type BrandLang = "en" | "ur";

const BRAND = {
  charcoal: "#1a1814",
  cream: "#faf8f5",
  gold: "#c9a962",
} as const;

const TAGLINE_EN = "Designer formal wear — hand-finished pieces from our catalogue.";
const TAGLINE_UR = "ڈیزائنر فارمل وئیر — ہمارے کیٹلاگ سے ہاتھ سے تیار کردہ پیسز";
const WORDMARK_UR = "زرکاری";

async function loadGoogleFont(
  familyQuery: string,
  weight: number
): Promise<ArrayBuffer | null> {
  try {
    // Prefer TTF/OTF — ImageResponse/Satori cannot use woff2.
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@${weight}&display=swap`,
      {
        next: { revalidate: 86400 },
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
      }
    ).then((res) => res.text());

    const match =
      css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/) ??
      css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff)'\)/);
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

/** Thin Z/RK/RI + barless Λ — English wordmark. */
function BrandWordmarkEn({
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

function BrandWordmarkUr({
  fontFamily,
  fontSize,
  variant,
}: {
  fontFamily: string;
  fontSize: number;
  variant: BrandVariant;
}) {
  const colors = wordmarkColors(variant);
  return (
    <div
      style={{
        display: "flex",
        direction: "rtl",
        fontFamily,
        fontSize,
        fontWeight: 400,
        color: colors.bold,
        lineHeight: 1.3,
      }}
    >
      {WORDMARK_UR}
    </div>
  );
}

function BrandTagline({
  fontFamily,
  fontSize,
  variant,
  marginTop,
  lang,
}: {
  fontFamily: string;
  fontSize: number;
  variant: BrandVariant;
  marginTop: number;
  lang: BrandLang;
}) {
  const colors = wordmarkColors(variant);
  const isUr = lang === "ur";
  // Split Urdu into words so Satori shapes shorter runs (avoids complex GSUB crashes).
  const urduWords = TAGLINE_UR.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        marginTop,
        maxWidth: "90%",
        direction: isUr ? "rtl" : "ltr",
        gap: isUr ? 8 : 0,
      }}
    >
      {isUr ? (
        urduWords.map((word, i) => (
          <span
            key={`${word}-${i}`}
            style={{
              fontSize,
              fontWeight: 400,
              color: colors.tagline,
              fontFamily,
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            {word}
          </span>
        ))
      ) : (
        <span
          style={{
            fontSize,
            fontWeight: 100,
            letterSpacing: "0.12em",
            color: colors.tagline,
            fontFamily,
            textAlign: "center",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          {TAGLINE_EN}
        </span>
      )}
    </div>
  );
}

export function BrandOgCard({
  fontFamily,
  variant = "dark",
  lang = "en",
}: {
  fontFamily: string;
  variant?: BrandVariant;
  lang?: BrandLang;
}) {
  return (
    <BrandShell variant={variant}>
      {lang === "ur" ? (
        <BrandWordmarkUr fontFamily={fontFamily} fontSize={96} variant={variant} />
      ) : (
        <BrandWordmarkEn fontFamily={fontFamily} fontSize={96} variant={variant} />
      )}
      <BrandTagline
        fontFamily={fontFamily}
        fontSize={lang === "ur" ? 28 : 26}
        variant={variant}
        marginTop={28}
        lang={lang}
      />
    </BrandShell>
  );
}

export function BrandLogoSquareCard({
  fontFamily,
  variant = "dark",
  lang = "en",
}: {
  fontFamily: string;
  variant?: BrandVariant;
  lang?: BrandLang;
}) {
  return (
    <BrandShell variant={variant} barHeight={8}>
      {lang === "ur" ? (
        <BrandWordmarkUr fontFamily={fontFamily} fontSize={140} variant={variant} />
      ) : (
        <BrandWordmarkEn fontFamily={fontFamily} fontSize={110} variant={variant} />
      )}
    </BrandShell>
  );
}

export function BrandSocialBannerCard({
  fontFamily,
  variant = "dark",
  lang = "en",
}: {
  fontFamily: string;
  variant?: BrandVariant;
  lang?: BrandLang;
}) {
  return (
    <BrandShell variant={variant} barHeight={6}>
      {lang === "ur" ? (
        <BrandWordmarkUr fontFamily={fontFamily} fontSize={88} variant={variant} />
      ) : (
        <BrandWordmarkEn fontFamily={fontFamily} fontSize={72} variant={variant} />
      )}
      <BrandTagline
        fontFamily={fontFamily}
        fontSize={lang === "ur" ? 22 : 20}
        variant={variant}
        marginTop={20}
        lang={lang}
      />
    </BrandShell>
  );
}

async function withBrandFonts(
  lang: BrandLang,
  element: (fontFamily: string) => ReactElement,
  size: { width: number; height: number }
) {
  if (lang === "ur") {
    // IBM Plex Sans Arabic: simpler GSUB than Noto Nastaliq / Noto Sans Arabic
    // (those throw lookupType 5 substFormat 3 in Satori on longer strings).
    const urdu = await loadGoogleFont("IBM+Plex+Sans+Arabic", 400);
    const fontFamily = urdu ? "IBM Plex Sans Arabic" : "serif";
    return new ImageResponse(element(fontFamily), {
      ...size,
      ...(urdu
        ? {
            fonts: [
              {
                name: "IBM Plex Sans Arabic",
                data: urdu,
                style: "normal" as const,
                weight: 400 as const,
              },
            ],
          }
        : {}),
    });
  }

  const [thin, regular] = await Promise.all([
    loadGoogleFont("Montserrat", 100),
    loadGoogleFont("Montserrat", 400),
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

export function parseBrandLang(value: string | null): BrandLang {
  return value === "ur" ? "ur" : "en";
}

export async function generateBrandOgImage(
  variant: BrandVariant = "dark",
  lang: BrandLang = "en"
) {
  return withBrandFonts(
    lang,
    (fontFamily) => <BrandOgCard fontFamily={fontFamily} variant={variant} lang={lang} />,
    OG_SIZE
  );
}

export async function generateBrandLogoSquareImage(
  variant: BrandVariant = "dark",
  lang: BrandLang = "en"
) {
  return withBrandFonts(
    lang,
    (fontFamily) => (
      <BrandLogoSquareCard fontFamily={fontFamily} variant={variant} lang={lang} />
    ),
    LOGO_SQUARE_SIZE
  );
}

export async function generateBrandSocialBannerImage(
  variant: BrandVariant = "dark",
  lang: BrandLang = "en"
) {
  return withBrandFonts(
    lang,
    (fontFamily) => (
      <BrandSocialBannerCard fontFamily={fontFamily} variant={variant} lang={lang} />
    ),
    SOCIAL_BANNER_SIZE
  );
}
