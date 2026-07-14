"use client";

import { useCallback } from "react";
import { useDesign } from "./use-design";

/**
 * Trigger a Figma import. Handles loading, success, and error states centrally
 * so the call sites stay one-liners.
 */
export function useFigmaImport() {
  const { setIsLoading, setDesign, setError } = useDesign();

  const importFile = useCallback(
    async (url: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            data.error ?? {
              message: "Import failed.",
              kind: "unknown",
            },
          );
          return false;
        }
        setDesign(data);
        return true;
      } catch (err) {
        setError({
          message:
            "Could not reach the import service. Check your network and try again.",
          kind: "network",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setDesign, setError, setIsLoading],
  );

  return { importFile };
}
