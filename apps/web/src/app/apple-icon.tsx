import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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

export default async function AppleIcon() {
  const fontData = await loadMontserratThin();
  const fontFamily = fontData ? "Montserrat" : "ui-sans-serif, system-ui, sans-serif";

  return new ImageResponse(
    (
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
            fontSize: 112,
            fontWeight: 100,
            color: "#1a1814",
            fontFamily,
            letterSpacing: "0.05em",
          }}
        >
          Z
        </span>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? { fonts: [{ name: "Montserrat", data: fontData, style: "normal" as const, weight: 100 }] }
        : {}),
    }
  );
}
