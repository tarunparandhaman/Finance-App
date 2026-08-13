"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

// Sheets can nest (a holding's detail sheet opens a transaction sheet), so the
// body scroll lock is refcounted — closing the inner sheet must not unlock
// scrolling while the outer one is still open.
let scrollLockCount = 0;

function lockScroll() {
  scrollLockCount += 1;
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = "";
}

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-xl sm:rounded-2xl sm:pb-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-snug">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-full p-1.5 text-muted hover:bg-surface-alt"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
