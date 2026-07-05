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
            fontSize: 120,
            fontWeight: 600,
            color: "#c9a962",
            fontFamily: "Georgia, serif",
            marginTop: 8,
          }}
        >
          Z
        </span>
      </div>
    ),
    { ...size }
  );
}
