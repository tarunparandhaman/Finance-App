"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, PiggyBank, LineChart, Settings, ShieldCheck, Eye } from "lucide-react";
import Logo from "@/components/Logo";

const items = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/invest", label: "Invest", icon: TrendingUp },
  { href: "/save", label: "Save", icon: PiggyBank },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-foreground md:flex">
      <Link href="/" className="flex items-center gap-3 px-6 py-7">
        <Logo size={34} />
        <div className="min-w-0">
          <div className="brand-mark truncate text-lg leading-tight">Corpus</div>
          <div className="truncate text-[11px] tracking-wide text-sidebar-muted">WEALTH TRACKER</div>
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
