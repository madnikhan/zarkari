import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "ZARKARI — Designer Formal Wear UK";

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

export function BrandOgCard({ fontFamily }: { fontFamily: string }) {
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
          height: 4,
          background: "#c9a962",
        }}
      />
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
    </div>
  );
}

export async function generateBrandOgImage() {
  const fontData = await loadMontserratThin();
  const fontFamily = fontData ? "Montserrat" : "ui-sans-serif, system-ui, sans-serif";

  return new ImageResponse(<BrandOgCard fontFamily={fontFamily} />, {
    ...OG_SIZE,
    ...(fontData
      ? { fonts: [{ name: "Montserrat", data: fontData, style: "normal" as const, weight: 100 }] }
      : {}),
  });
}
