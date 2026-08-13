import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import HydrationGate from "@/components/HydrationGate";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanceNerd's Piggy Bank Tracker",
  description: "Track stocks, mutual funds, PF, NPS and more — all in one attractive, private place.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Piggy Bank Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00c805" },
    { media: "(prefers-color-scheme: dark)", color: "#06080a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved theme before first paint to avoid a light flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <HydrationGate>
          <div className="flex min-h-full">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
          <BottomNav />
        </HydrationGate>
      </body>
    </html>
  );
}
