import Link from "next/link";
import { ChevronLeft, Settings as SettingsIcon } from "lucide-react";

export default function PageShell({
  title,
  subtitle,
  action,
  backHref,
  wide,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  backHref?: string;
  /** Use a wider desktop container for pages with multi-column grids. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mx-auto flex min-h-full max-w-md flex-col pb-24 md:pb-12 ${
        wide ? "md:max-w-6xl" : "md:max-w-3xl"
      }`}
    >
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur md:static md:border-none md:bg-transparent md:px-8 md:pb-2 md:pt-10 md:backdrop-blur-none">
        <div className="flex min-w-0 items-center gap-1">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Back"
              className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-alt"
            >
              <ChevronLeft size={20} />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            {subtitle && <div className="text-sm text-muted md:mt-1 md:text-base">{subtitle}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {/* Settings has no room in the mobile tab bar, so it lives here. */}
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-alt md:hidden"
          >
            <SettingsIcon size={19} />
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 pt-4 md:px-8 md:pt-4">{children}</main>
    </div>
  );
}
