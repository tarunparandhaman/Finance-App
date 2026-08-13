"use client";

import { useEffect, useRef } from "react";
import { refreshAllPrices, isPriceable } from "./pricing";
import { useFinanceStore } from "./store";

/** Yahoo's free endpoint is unofficial — two minutes is frequent enough to feel
 *  live without hammering it into rate-limiting us. */
const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Keeps prices fresh while the tab is actually being looked at: refreshes on
 * mount, on a timer, and whenever the tab regains focus after being hidden.
 * Pauses entirely in background tabs so a left-open tab doesn't poll all day.
 */
export function useAutoRefresh() {
  const hasPriceable = useFinanceStore((s) => s.holdings.some(isPriceable));
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!hasPriceable) return;

    const run = () => {
      if (inFlightRef.current || document.visibilityState !== "visible") return;
      inFlightRef.current = true;
      refreshAllPrices().finally(() => {
        inFlightRef.current = false;
      });
    };

    run();
    const timer = setInterval(run, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", run);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [hasPriceable]);
}
