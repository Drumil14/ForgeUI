"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DesignTokens, GeneratedComponent } from "@/types";
import { transpileComponent } from "@/lib/preview/transpile";
import { buildPreviewThemeCss } from "@/lib/preview/theme";
import { samplePropsFor } from "@/lib/preview/sample-props";

/**
 * Renders a generated component by executing its ACTUAL generated source in a
 * sandboxed iframe:
 *
 *   generated TSX ──sucrase──► CJS ──postMessage──► iframe (allow-scripts
 *   only, opaque origin) ──► React render + runtime-compiled Tailwind
 *
 * There is deliberately no second "preview implementation" of components —
 * what you see is the transpiled export. The iframe cannot touch the app:
 * no same-origin, no storage, no top-navigation.
 */

type RuntimeMessage =
  | { type: "forgeui:ready" }
  | { type: "forgeui:rendered"; height: number }
  | { type: "forgeui:error"; message: string };

const SRCDOC = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { font-family: "Inter", system-ui, -apple-system, sans-serif; }
  #root { padding: 24px; display: grid; place-items: center; min-height: 160px; }
</style>
</head>
<body>
<div id="root"></div>
<script src="/preview/runtime.js"></script>
</body>
</html>`;

export type PreviewStatus = "booting" | "rendering" | "rendered" | "error";

interface SandboxPreviewProps {
  component: GeneratedComponent;
  tokens: DesignTokens | null;
  /** User prop overrides from the Props tab (merged over sample props). */
  propsOverrides?: Record<string, unknown>;
  /** Fired whenever the runtime reports status (for toolbar indicators). */
  onStatus?: (status: PreviewStatus, detail?: string) => void;
}

export function SandboxPreview({
  component,
  tokens,
  propsOverrides,
  onStatus,
}: SandboxPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(220);
  const [error, setError] = useState<string | null>(null);

  const transpiled = useMemo(
    () => transpileComponent(component.source),
    [component.source],
  );
  const themeCss = useMemo(() => buildPreviewThemeCss(tokens), [tokens]);
  const props = useMemo(
    () => ({ ...samplePropsFor(component), ...propsOverrides }),
    [component, propsOverrides],
  );

  const postRender = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow || !transpiled.ok) return;
    setError(null);
    onStatus?.("rendering");
    frame.contentWindow.postMessage(
      {
        type: "forgeui:render",
        code: transpiled.code,
        props,
        themeCss,
      },
      "*",
    );
  }, [transpiled, props, themeCss, onStatus]);

  // Messages from the runtime.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as RuntimeMessage | undefined;
      if (!data || typeof data !== "object") return;
      if (data.type === "forgeui:ready") {
        setReady(true);
      } else if (data.type === "forgeui:rendered") {
        setHeight(Math.max(160, Math.min(data.height, 4000)));
        onStatus?.("rendered");
      } else if (data.type === "forgeui:error") {
        setError(data.message);
        onStatus?.("error", data.message);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onStatus]);

  // (Re-)render when the runtime is ready or inputs change.
  useEffect(() => {
    if (ready) postRender();
  }, [ready, postRender]);

  if (!transpiled.ok) {
    return (
      <div
        role="alert"
        className="w-full rounded-md border border-danger/30 bg-danger/5 p-4 text-left"
      >
        <p className="text-xs font-semibold text-danger">
          Generated source failed to transpile
        </p>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-fg-muted">
          {transpiled.error}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <iframe
        ref={iframeRef}
        title={`Preview of ${component.name}`}
        sandbox="allow-scripts"
        srcDoc={SRCDOC}
        className="w-full border-0 bg-white"
        style={{ height }}
      />
      {!ready && (
        <div
          className="absolute inset-0 grid place-items-center bg-bg-subtle"
          aria-live="polite"
        >
          <p className="text-xs text-fg-muted">Starting sandbox…</p>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="absolute inset-x-0 bottom-0 border-t border-danger/30 bg-danger/5 px-3 py-2"
        >
          <p className="font-mono text-[11px] text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
