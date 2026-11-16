"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDesign } from "./use-design";

/**
 * Trigger a Figma import with real-world reliability:
 *
 *  - AbortController: starting a new import cancels the in-flight one, and
 *    unmounting cancels everything.
 *  - Timeout: a hung request fails after IMPORT_TIMEOUT_MS instead of
 *    spinning forever.
 *  - Stale-response protection: every request gets a sequence number; only
 *    the latest request may write state, so a slow old response can never
 *    overwrite a newer successful import.
 *  - Retry: one automatic retry (with a short backoff) for transient
 *    failures — network errors and 429/5xx responses. Client errors
 *    (bad URL, auth, not found) fail immediately.
 */

const IMPORT_TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 1_500;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

interface ImportError {
  message: string;
  kind: string;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function postImport(
  url: string,
  signal: AbortSignal,
): Promise<{ ok: true; design: unknown } | { ok: false; error: ImportError; transient: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    return {
      ok: false,
      transient: true,
      error: {
        message:
          "Could not reach the import service. Check your network and try again.",
        kind: "network",
      },
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      transient: TRANSIENT_STATUS.has(res.status),
      error: {
        message: "The import service returned an unreadable response.",
        kind: "bad_response",
      },
    };
  }

  if (!res.ok) {
    const error =
      (data as { error?: ImportError }).error ?? ({
        message: "Import failed.",
        kind: "unknown",
      } satisfies ImportError);
    return { ok: false, transient: TRANSIENT_STATUS.has(res.status), error };
  }
  return { ok: true, design: data };
}

export function useFigmaImport() {
  const { setIsLoading, setDesign, setError } = useDesign();
  const controllerRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);

  // Cancel any in-flight import when the consumer unmounts.
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const cancelImport = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsLoading(false);
  }, [setIsLoading]);

  const importFile = useCallback(
    async (url: string): Promise<boolean> => {
      // Newer request supersedes anything in flight.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const seq = ++requestSeq.current;
      const isCurrent = () =>
        seq === requestSeq.current && !controller.signal.aborted;

      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, IMPORT_TIMEOUT_MS);
      setIsLoading(true);
      setError(null);

      try {
        let result = await postImport(url, controller.signal);
        if (!result.ok && result.transient && isCurrent()) {
          await sleep(RETRY_DELAY_MS, controller.signal);
          result = await postImport(url, controller.signal);
        }

        if (!isCurrent()) return false; // a newer import owns the state now

        if (!result.ok) {
          setError(result.error);
          return false;
        }
        setDesign(result.design as Parameters<typeof setDesign>[0]);
        return true;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Only report the abort if it was our own timeout and no newer
          // request has taken over; user cancels and superseded requests
          // stay silent.
          if (timedOut && seq === requestSeq.current) {
            setError({
              message: `The import took longer than ${IMPORT_TIMEOUT_MS / 1000}s and was cancelled. Large Figma files can be slow — try again, or import a smaller file.`,
              kind: "timeout",
            });
          }
          return false;
        }
        if (!isCurrent()) return false;
        setError({
          message: "Something unexpected went wrong during import.",
          kind: "unknown",
        });
        return false;
      } finally {
        clearTimeout(timeout);
        if (seq === requestSeq.current) setIsLoading(false);
      }
    },
    [setDesign, setError, setIsLoading],
  );

  return { importFile, cancelImport };
}
