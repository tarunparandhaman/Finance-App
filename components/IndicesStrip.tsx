"use client";

import { useEffect, useState } from "react";
import { formatNumber, formatPercent } from "@/lib/format";

interface IndexQuote {
  symbol: string;
  label: string;
  price?: number;
  changePercent?: number | null;
  error?: boolean;
}

export default function IndicesStrip() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/indices")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setIndices(d.indices ?? []);
        })
        .catch(() => {
          // Market context is decorative — a failed fetch just leaves it empty.
        });
    };

    load();
    const timer = setInterval(load, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const live = indices.filter((i) => !i.error && typeof i.price === "number");
  if (live.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-2 md:min-w-0">
        {live.map((i) => {
          const up = (i.changePercent ?? 0) >= 0;
          return (
            <div key={i.symbol} className="card flex-1 whitespace-nowrap px-3.5 py-2.5">
              <div className="text-[11px] tracking-wide text-muted">{i.label}</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-sm font-semibold tabular-nums">{formatNumber(i.price!, 2)}</span>
                {typeof i.changePercent === "number" && (
                  <span className={`text-xs tabular-nums ${up ? "text-positive" : "text-negative"}`}>
                    {up ? "▲" : "▼"} {formatPercent(i.changePercent)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
