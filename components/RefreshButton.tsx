"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshAllPrices } from "@/lib/pricing";

export default function RefreshButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          await refreshAllPrices();
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${className}`}
    >
      <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
      {loading ? "Refreshing…" : "Refresh prices"}
    </button>
  );
}
