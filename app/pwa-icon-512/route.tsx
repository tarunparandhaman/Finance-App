import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#00c805",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 288,
        }}
      >
        🐷
      </div>
    ),
    { width: 512, height: 512 }
  );
}
