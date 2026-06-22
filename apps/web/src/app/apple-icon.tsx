import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f5",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 100,
            letterSpacing: "0.18em",
            color: "#1a1814",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          ZΛRKΛRI
        </span>
      </div>
    ),
    { ...size }
  );
}
