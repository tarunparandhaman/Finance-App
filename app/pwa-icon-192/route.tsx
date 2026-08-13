import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 108,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        ₹
      </div>
    ),
    { width: 192, height: 192 }
  );
}
