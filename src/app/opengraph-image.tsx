import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MahjNearMe — Find Mahjong Games Anywhere You Go";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 50%, #87CEEB 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo tiles */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
          {"MahjNearMe".split("").map((char, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: char === "M" || char === "N" ? "56px" : char === "i" || char === "j" ? "36px" : "44px",
                height: "64px",
                borderRadius: "8px",
                background: "linear-gradient(to bottom, #FFFFF0, #F0EFE0)",
                borderBottom: "4px solid #87CEEB",
                fontSize: "38px",
                fontWeight: 800,
                color: "#4CAF50",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "white",
            marginBottom: "12px",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          Find Mahjong Games Anywhere You Go
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.85)",
            marginBottom: "40px",
          }}
        >
          The only directory of pickup mahjong games across the US
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            padding: "12px 40px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.2)",
            fontSize: "18px",
            fontWeight: 600,
            color: "white",
          }}
        >
          <span>2,000+ games</span>
          <span>|</span>
          <span>50 states</span>
          <span>|</span>
          <span>600+ cities</span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "22px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          mahjnearme.com
        </div>
      </div>
    ),
    { ...size }
  );
}
