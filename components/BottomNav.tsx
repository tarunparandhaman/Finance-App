"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, PiggyBank, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/invest", label: "Invest", icon: TrendingUp },
  { href: "/save", label: "Save", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={active ? "text-primary" : "text-muted"}
              />
              <span className={active ? "font-medium text-primary" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
