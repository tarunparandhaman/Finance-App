import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PageShell({
  title,
  subtitle,
  action,
  backHref,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur">
        <div className="flex items-center gap-1">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Back"
              className="-ml-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-alt"
            >
              <ChevronLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <main className="flex-1 px-4 pt-4">{children}</main>
    </div>
  );
}
