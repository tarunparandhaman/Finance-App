import { ImageResponse } from "next/og";
import { BrandIconArt } from "@/lib/brandIcon";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<BrandIconArt size={192} />, { width: 192, height: 192 });
}
