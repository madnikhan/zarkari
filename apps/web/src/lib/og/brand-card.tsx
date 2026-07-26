import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "ZARKARI — Designer Formal Wear UK";

export const LOGO_SQUARE_SIZE = { width: 1080, height: 1080 };
export const SOCIAL_BANNER_SIZE = { width: 1500, height: 500 };

async function loadMontserratThin(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@100&display=swap",
      { next: { revalidate: 86400 } }
    ).then((res) => res.text());

    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2)'\)/);
    if (!match?.[1]) return null;

    return fetch(match[1]).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
}

function BrandShell({
  children,
  barHeight = 4,
}: {
  children: ReactNode;
  barHeight?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf8f5",
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
          background: "#c9a962",
        }}
      />
      {children}
    </div>
  );
}

export function BrandOgCard({ fontFamily }: { fontFamily: string }) {
  return (
    <BrandShell>
      <span
        style={{
          fontSize: 96,
          fontWeight: 100,
          letterSpacing: "0.22em",
          color: "#1a1814",
          fontFamily,
          marginLeft: "0.22em",
        }}
      >
        ZΛRKΛRI
      </span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: "0.35em",
          color: "#1a1814",
          opacity: 0.55,
          fontFamily,
          marginTop: 24,
          textTransform: "uppercase",
        }}
      >
        Designer Formal Wear UK
      </span>
    </BrandShell>
  );
}

export function BrandLogoSquareCard({ fontFamily }: { fontFamily: string }) {
  return (
    <BrandShell barHeight={8}>
      <span
        style={{
          fontSize: 120,
          fontWeight: 100,
          letterSpacing: "0.22em",
          color: "#1a1814",
          fontFamily,
          marginLeft: "0.22em",
        }}
      >
        ZΛRKΛRI
      </span>
    </BrandShell>
  );
}

export function BrandSocialBannerCard({ fontFamily }: { fontFamily: string }) {
  return (
    <BrandShell barHeight={6}>
      <span
        style={{
          fontSize: 72,
          fontWeight: 100,
          letterSpacing: "0.22em",
          color: "#1a1814",
          fontFamily,
          marginLeft: "0.22em",
        }}
      >
        ZΛRKΛRI
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "0.35em",
          color: "#1a1814",
          opacity: 0.55,
          fontFamily,
          marginTop: 18,
          textTransform: "uppercase",
        }}
      >
        Designer Formal Wear UK
      </span>
    </BrandShell>
  );
}

async function withBrandFont(
  element: (fontFamily: string) => ReactElement,
  size: { width: number; height: number }
) {
  const fontData = await loadMontserratThin();
  const fontFamily = fontData ? "Montserrat" : "ui-sans-serif, system-ui, sans-serif";

  return new ImageResponse(element(fontFamily), {
    ...size,
    ...(fontData
      ? { fonts: [{ name: "Montserrat", data: fontData, style: "normal" as const, weight: 100 }] }
      : {}),
  });
}

export async function generateBrandOgImage() {
  return withBrandFont((fontFamily) => <BrandOgCard fontFamily={fontFamily} />, OG_SIZE);
}

export async function generateBrandLogoSquareImage() {
  return withBrandFont(
    (fontFamily) => <BrandLogoSquareCard fontFamily={fontFamily} />,
    LOGO_SQUARE_SIZE
  );
}

export async function generateBrandSocialBannerImage() {
  return withBrandFont(
    (fontFamily) => <BrandSocialBannerCard fontFamily={fontFamily} />,
    SOCIAL_BANNER_SIZE
  );
}
