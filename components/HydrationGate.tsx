"use client";

import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store";

export default function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useFinanceStore((s) => s.hydrated);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!hydrated && !timedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
