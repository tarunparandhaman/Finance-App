"use client";

import { useSyncExternalStore } from "react";

/**
 * The clock is external state, so it's read through useSyncExternalStore
 * rather than pinned via setState-in-an-effect (which causes a cascading
 * render) or read during render (which isn't pure).
 *
 * The snapshot is cached so repeated reads within a render are identical, and
 * refreshed hourly — plenty for the day-level counters that use it.
 */
const listeners = new Set<() => void>();
let cached = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const REFRESH_MS = 60 * 60 * 1000;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (cached === 0) cached = Date.now();

  if (!timer) {
    timer = setInterval(() => {
      cached = Date.now();
      for (const listener of listeners) listener();
    }, REFRESH_MS);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => cached;
/** Server render has no meaningful clock; 0 means "not known yet". */
const getServerSnapshot = () => 0;

/** Current epoch ms, refreshed hourly. Returns 0 before the first client render. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
