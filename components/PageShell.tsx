export default function PageShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <main className="flex-1 px-4 pt-4">{children}</main>
    </div>
  );
}
