import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinanceNerd's Piggy Bank Tracker",
    short_name: "Piggy Bank",
    description: "Track stocks, mutual funds, PF, NPS and more in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#06080a",
    theme_color: "#00c805",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
