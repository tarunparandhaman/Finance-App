import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 288,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        ₹
      </div>
    ),
    { width: 512, height: 512 }
  );
}
