"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, PiggyBank, LineChart, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/invest", label: "Invest", icon: TrendingUp },
  { href: "/save", label: "Save", icon: PiggyBank },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-md px-2 py-1.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs">
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-primary" : "text-muted"} />
              </span>
              <span className={active ? "font-medium text-primary" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
