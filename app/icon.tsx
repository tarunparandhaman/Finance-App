import { ImageResponse } from "next/og";
import { BrandIconArt } from "@/lib/brandIcon";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconArt size={48} />, { ...size });
}
