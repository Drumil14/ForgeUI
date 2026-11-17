"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./sidebar";
import { Preview } from "./preview";
import { Inspector } from "./inspector";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { IconBox, IconCode, IconLayers } from "@/components/ui/icons";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";

/**
 * Three-pane workspace with resizable sidebar/inspector on desktop and
 * stacked tabs on smaller screens. Panel widths persist to localStorage.
 * The dividers are real separators: draggable with a pointer and adjustable
 * with arrow keys when focused.
 */

const SIDEBAR = { min: 200, max: 400, default: 240 };
const INSPECTOR = { min: 300, max: 560, default: 360 };
const STORAGE_KEY = "forgeui.workspace.panes";

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function PaneDivider({
  label,
  value,
  min,
  max,
  onChange,
  invert = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  /** True when dragging right should shrink the pane (right-hand pane). */
  invert?: boolean;
}) {
  const dragging = useRef<{ startX: number; startValue: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = { startX: e.clientX, startValue: value };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    onChange(clamp(dragging.current.startValue + (invert ? -dx : dx), min, max));
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 32 : 8;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onChange(clamp(value + (invert ? step : -step), min, max));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onChange(clamp(value + (invert ? -step : step), min, max));
        } else if (e.key === "Home") {
          e.preventDefault();
          onChange(min);
        } else if (e.key === "End") {
          e.preventDefault();
          onChange(max);
        }
      }}
      className="group relative z-10 -mx-[3px] w-[7px] flex-shrink-0 cursor-col-resize touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-border-strong group-focus-visible:bg-accent"
      />
    </div>
  );
}

export function WorkspaceLayout() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarW, setSidebarW] = useState(SIDEBAR.default);
  const [inspectorW, setInspectorW] = useState(INSPECTOR.default);

  useWorkspaceShortcuts();

  useEffect(() => {
    // SSR hydration guard + one-time localStorage sync: the server renders
    // the desktop layout with default widths; the first client render must
    // re-sync from storage exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (typeof saved.sidebar === "number")
         
        setSidebarW(clamp(saved.sidebar, SIDEBAR.min, SIDEBAR.max));
      if (typeof saved.inspector === "number")
         
        setInspectorW(clamp(saved.inspector, INSPECTOR.min, INSPECTOR.max));
    } catch {
      // Corrupt storage — fall back to defaults.
    }
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const persist = useCallback((sidebar: number, inspector: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sidebar, inspector }));
    } catch {
      // Storage unavailable (private mode) — resizing still works per-session.
    }
  }, []);

  const onSidebarResize = useCallback(
    (v: number) => {
      setSidebarW(v);
      persist(v, inspectorW);
    },
    [inspectorW, persist],
  );
  const onInspectorResize = useCallback(
    (v: number) => {
      setInspectorW(v);
      persist(sidebarW, v);
    },
    [sidebarW, persist],
  );

  if (!mounted || !isMobile) {
    return (
      <div className="flex h-full min-h-0 overflow-hidden">
        <div style={{ width: sidebarW }} className="h-full flex-shrink-0">
          <Sidebar />
        </div>
        <PaneDivider
          label="Resize sidebar"
          value={sidebarW}
          min={SIDEBAR.min}
          max={SIDEBAR.max}
          onChange={onSidebarResize}
        />
        <div className="h-full min-w-0 flex-1">
          <Preview />
        </div>
        <PaneDivider
          label="Resize inspector"
          value={inspectorW}
          min={INSPECTOR.min}
          max={INSPECTOR.max}
          onChange={onInspectorResize}
          invert
        />
        <div style={{ width: inspectorW }} className="h-full flex-shrink-0">
          <Inspector />
        </div>
      </div>
    );
  }

  // Mobile / tablet stacked layout
  return (
    <Tabs defaultValue="preview" className="flex h-full min-h-0 flex-col overflow-hidden">
      <TabsList ariaLabel="Workspace sections" className="flex-shrink-0 bg-bg px-2">
        <Tab value="sidebar" icon={<IconLayers className="h-3.5 w-3.5" />}>
          Browse
        </Tab>
        <Tab value="preview" icon={<IconBox className="h-3.5 w-3.5" />}>
          Preview
        </Tab>
        <Tab value="inspector" icon={<IconCode className="h-3.5 w-3.5" />}>
          Inspect
        </Tab>
      </TabsList>
      <div className="min-h-0 flex-1 overflow-hidden">
        <TabPanel value="sidebar" className="h-full">
          <div className="h-full">
            <Sidebar />
          </div>
        </TabPanel>
        <TabPanel value="preview" className="h-full">
          <div className="h-full">
            <Preview />
          </div>
        </TabPanel>
        <TabPanel value="inspector" className="h-full">
          <div className="h-full">
            <Inspector />
          </div>
        </TabPanel>
      </div>
    </Tabs>
  );
}
