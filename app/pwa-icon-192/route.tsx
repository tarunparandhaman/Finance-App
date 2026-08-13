import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#00c805",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 108,
        }}
      >
        🐷
      </div>
    ),
    { width: 192, height: 192 }
  );
}
