"use client";

import { useDesign } from "@/hooks/use-design";
import {
  IconDesktop,
  IconMinus,
  IconMobile,
  IconPlus,
  IconTablet,
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { RenderComponent } from "./render-registry";
import { cn } from "@/utils/cn";
import type { Viewport } from "@/types";
import type { ReactNode } from "react";

const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

const VIEWPORT_DISPLAY_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

interface ViewportButton {
  id: Viewport;
  label: string;
  icon: ReactNode;
}

const VIEWPORTS: ViewportButton[] = [
  { id: "desktop", label: "Desktop", icon: <IconDesktop className="h-3.5 w-3.5" /> },
  { id: "tablet", label: "Tablet", icon: <IconTablet className="h-3.5 w-3.5" /> },
  { id: "mobile", label: "Mobile", icon: <IconMobile className="h-3.5 w-3.5" /> },
];

export function Preview() {
  const { design, state, setViewport, setZoom } = useDesign();

  const selected =
    design?.components.find((c) => c.id === state.selectedComponentId) ?? null;

  const zoomOut = () => setZoom(Math.max(50, state.zoom - 10));
  const zoomIn = () => setZoom(Math.min(200, state.zoom + 10));
  const resetZoom = () => setZoom(100);

  return (
    <div className="flex h-full flex-col bg-bg-subtle">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border bg-bg px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Viewport switcher */}
          <div
            role="radiogroup"
            aria-label="Viewport size"
            className="flex items-center rounded-md border border-border p-0.5"
          >
            {VIEWPORTS.map((v) => {
              const active = state.viewport === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={v.label}
                  title={v.label}
                  onClick={() => setViewport(v.id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent",
                    active
                      ? "bg-bg-subtle text-fg"
                      : "text-fg-muted hover:text-fg"
                  )}
                >
                  {v.icon}
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
          <Badge tone="neutral" className="font-mono">
            {VIEWPORT_WIDTHS[state.viewport]}px
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Zoom out"
              disabled={state.zoom <= 50}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent"
            >
              <IconMinus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="inline-flex h-7 min-w-[44px] items-center justify-center rounded px-1 font-mono text-[11px] text-fg-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent"
              aria-label="Reset zoom"
            >
              {state.zoom}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Zoom in"
              disabled={state.zoom >= 200}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent"
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="scrollbar-thin bg-dots flex-1 overflow-auto">
        <div className="flex min-h-full items-center justify-center p-6 sm:p-10">
          {selected ? (
            <div
              style={{
                width: VIEWPORT_DISPLAY_WIDTHS[state.viewport],
                maxWidth: "100%",
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: "center top",
                transition: "transform 0.15s ease",
              }}
            >
              <div className="rounded-lg border border-border bg-bg shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    {selected.kind} · {selected.name}
                  </p>
                  <p className="font-mono text-[10px] text-fg-subtle">
                    {state.viewport}
                  </p>
                </div>
                <div className="flex min-h-[240px] items-center justify-center p-6 ring-1 ring-inset ring-accent/0 transition-shadow">
                  <RenderComponent component={selected} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-bg px-8 py-12 text-center">
              <p className="text-sm text-fg-muted">
                Select a component from the sidebar to preview it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
