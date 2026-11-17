"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "forgeui-theme";

/**
 * Persisted light/dark toggle.
 *
 * Reads the user's OS preference once on first load, then honors their
 * explicit choice for the rest of the session. We store on `<html>` rather
 * than `<body>` so the class is available during SSR hydration.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR hydration guard: the server can't know the stored/OS theme, so the
    // first client render must re-sync state once. This is the sanctioned
    // place for that one-time sync even though the rule dislikes it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
     
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggle, mounted };
}
