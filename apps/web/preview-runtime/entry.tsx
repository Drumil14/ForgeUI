/**
 * ForgeUI preview runtime — the ONLY code that runs inside the sandboxed
 * preview iframe (sandbox="allow-scripts", opaque origin: no cookies, no
 * storage, no access to the parent document).
 *
 * It receives the user's *generated component source* — already transpiled
 * from TSX to CommonJS by the parent (sucrase) — evaluates it with a module
 * shim that only resolves React, and renders it. Tailwind utilities are
 * compiled at runtime by @tailwindcss/browser, so the classes in generated
 * code (including arbitrary values like bg-[#e84e27]) resolve without any
 * network dependency.
 *
 * This file is bundled by scripts/build-preview-runtime.mjs into
 * public/preview/runtime.js (committed), so the preview works in dev without
 * a separate build step.
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import axe from "axe-core";
import "@tailwindcss/browser";

interface RenderMessage {
  type: "forgeui:render";
  /** CommonJS JS (transpiled from the generated TSX). */
  code: string;
  /** Props to render the component with. */
  props: Record<string, unknown>;
  /** Contents for the text/tailwindcss style tag (theme + @import). */
  themeCss: string;
}

interface AxeFindingPayload {
  id: string;
  impact: string | null;
  help: string;
  description: string;
  helpUrl: string;
  nodes: Array<{ target: string; html: string }>;
}

type ParentMessage =
  | { type: "forgeui:ready" }
  | { type: "forgeui:rendered"; height: number }
  | { type: "forgeui:error"; message: string }
  | {
      type: "forgeui:axe";
      violations: AxeFindingPayload[];
      passes: number;
      incomplete: number;
    };

function post(msg: ParentMessage) {
  window.parent.postMessage(msg, "*");
}

// --- Module evaluation -----------------------------------------------------

const MODULES: Record<string, unknown> = {
  react: React,
  "react-dom": ReactDOM,
};

function evalComponent(code: string): React.ComponentType<Record<string, unknown>> {
  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const requireShim = (name: string): unknown => {
    const m = MODULES[name];
    if (!m) {
      throw new Error(
        `The preview can only resolve "react" — generated components must not import "${name}".`,
      );
    }
    return m;
  };
  // Evaluated inside the sandboxed iframe only; the code is ForgeUI's own
  // generated output, and the opaque origin means it can't reach the app.
  const fn = new Function("require", "module", "exports", code);
  fn(requireShim, moduleObj, exportsObj);

  const exported =
    moduleObj.exports === exportsObj
      ? exportsObj
      : (moduleObj.exports as Record<string, unknown>);

  const candidates = Object.entries(exported).filter(([key, value]) => {
    if (key === "__esModule") return false;
    // Function components, classes, forwardRef/memo exotic components.
    return (
      typeof value === "function" ||
      (typeof value === "object" && value !== null && "$$typeof" in value)
    );
  });
  const def = candidates.find(([k]) => k === "default") ?? candidates[0];
  if (!def) throw new Error("The generated module exports no component.");
  return def[1] as React.ComponentType<Record<string, unknown>>;
}

// --- Error boundary --------------------------------------------------------

interface BoundaryState {
  error: string | null;
}

class Boundary extends React.Component<
  { children: React.ReactNode; onError: (msg: string) => void },
  BoundaryState
> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(err: Error): BoundaryState {
    return { error: err.message };
  }
  componentDidCatch(err: Error) {
    this.props.onError(err.message);
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

// --- Render loop -----------------------------------------------------------

let root: Root | null = null;
let themeEl: HTMLStyleElement | null = null;

function ensureThemeStyle(css: string) {
  if (!themeEl) {
    themeEl = document.createElement("style");
    themeEl.setAttribute("type", "text/tailwindcss");
    document.head.appendChild(themeEl);
  }
  if (themeEl.textContent !== css) themeEl.textContent = css;
}

function reportHeight() {
  const h = Math.ceil(document.documentElement.scrollHeight);
  post({ type: "forgeui:rendered", height: h });
}

// --- Accessibility audit (axe-core over the real rendered DOM) -------------

let axeSeq = 0;

function runAxe() {
  const container = document.getElementById("root");
  if (!container || container.childElementCount === 0) return;
  const seq = ++axeSeq;
  axe
    .run(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
      resultTypes: ["violations", "passes", "incomplete"],
    })
    .then((results) => {
      if (seq !== axeSeq) return; // a newer render superseded this audit
      post({
        type: "forgeui:axe",
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact ?? null,
          help: v.help,
          description: v.description,
          helpUrl: v.helpUrl,
          nodes: v.nodes.slice(0, 8).map((n) => ({
            target: n.target.join(" "),
            html: n.html.slice(0, 300),
          })),
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      });
    })
    .catch(() => {
      // Audit failures are non-fatal; the preview itself already rendered.
    });
}

function handleRender(msg: RenderMessage) {
  try {
    ensureThemeStyle(msg.themeCss);
    const Component = evalComponent(msg.code);
    const container = document.getElementById("root")!;
    if (!root) root = createRoot(container);
    root.render(
      <Boundary onError={(m) => post({ type: "forgeui:error", message: m })}>
        <Component {...msg.props} />
      </Boundary>,
    );
    // Give Tailwind's runtime a beat to inject utilities before measuring —
    // axe's color-contrast checks need the final computed styles too.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        reportHeight();
        setTimeout(runAxe, 120);
      }),
    );
  } catch (err) {
    post({ type: "forgeui:error", message: (err as Error).message });
  }
}

window.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as RenderMessage | undefined;
  if (!data || typeof data !== "object") return;
  if (data.type === "forgeui:render" && typeof data.code === "string") {
    handleRender(data);
  }
});

new ResizeObserver(() => reportHeight()).observe(document.documentElement);

post({ type: "forgeui:ready" });
