"use client";

import { Plus } from "lucide-react";

/**
 * Mirrors PageShell's container math (mobile max-w-md, desktop max-w-3xl/6xl,
 * offset past the sidebar) so the button lines up with the page content's
 * right edge instead of the full viewport.
 */
export default function FloatingActionButton({
  onClick,
  wide,
  label = "Add",
}: {
  onClick: () => void;
  wide?: boolean;
  label?: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center md:inset-x-auto md:bottom-10 md:left-64 md:right-0">
      <div className={`flex w-full max-w-md justify-end px-5 md:px-8 ${wide ? "md:max-w-6xl" : "md:max-w-3xl"}`}>
        <button
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={26} />
        </button>
      </div>
    </div>
  );
}
