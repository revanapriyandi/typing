import { ImageResponse } from "next/og";

export const alt = "TypeRush online typing speed test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          color: "#f8fafc",
          background: "linear-gradient(135deg, #09090b 0%, #172554 55%, #0f766e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#67e8f9", fontWeight: 700 }}>
          TYPERUSH
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 72, lineHeight: 1.05, fontWeight: 800 }}>
          Master your typing speed.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#cbd5e1" }}>
          Free online typing tests, WPM tracking, and multiplayer races.
        </div>
      </div>
    ),
    { ...size }
  );
}
