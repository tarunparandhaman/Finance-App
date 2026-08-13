"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "finance-tracker-theme";

/**
 * Runs before first paint (injected as a blocking inline script in the root
 * layout) so the correct palette is applied without a light-mode flash.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var pref = stored === 'light' || stored === 'dark' ? stored : 'system';
    var resolved = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

// The theme lives outside React (localStorage + the OS setting), so it's
// exposed as an external store rather than mirrored into component state.
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", emit);
  // Keeps other tabs in sync.
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", emit);
    window.removeEventListener("storage", emit);
  };
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getPreferenceSnapshot(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function getResolvedSnapshot(): ResolvedTheme {
  const pref = getPreferenceSnapshot();
  return pref === "system" ? systemTheme() : pref;
}

export function useTheme() {
  // Snapshots are primitives, so they're referentially stable by value.
  const preference = useSyncExternalStore(subscribe, getPreferenceSnapshot, () => "system" as ThemePreference);
  const resolved = useSyncExternalStore(subscribe, getResolvedSnapshot, () => "light" as ResolvedTheme);

  // Mirrors the store into the DOM; the inline script already did this for the
  // first paint, so this only matters for later changes.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setPreference = useCallback((pref: ThemePreference) => {
    try {
      if (pref === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // Storage can be blocked (private browsing) — the theme still applies
      // for this session, it just won't be remembered.
    }
    emit();
  }, []);

  return { preference, resolved, setPreference };
}
