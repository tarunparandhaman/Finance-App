import { ImageResponse } from "next/og";
import { BrandIconArt } from "@/lib/brandIcon";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<BrandIconArt size={512} />, { width: 512, height: 512 });
}
