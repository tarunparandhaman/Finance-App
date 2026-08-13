"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, PiggyBank, LineChart, Settings, ShieldCheck } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/invest", label: "Invest", icon: TrendingUp },
  { href: "/save", label: "Save", icon: PiggyBank },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-foreground md:flex">
      <Link href="/" className="flex items-center gap-3 px-6 py-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl">🐷</span>
        <div className="min-w-0">
          <div className="truncate text-base font-bold leading-tight">FinanceNerd</div>
          <div className="truncate text-xs text-sidebar-muted">Piggy Bank Tracker</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-ink"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-6 flex items-start gap-2 rounded-xl border border-sidebar-border bg-white/[0.03] px-3 py-3 text-xs text-sidebar-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
        Your data stays on this device — nothing is sent to a server.
      </div>
    </aside>
  );
}
