import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Corpus — Wealth Tracker",
    short_name: "Corpus",
    description: "Track stocks, mutual funds, PF, NPS and more in one private place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0d10",
    theme_color: "#0f766e",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
