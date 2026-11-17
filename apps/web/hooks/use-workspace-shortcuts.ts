"use client";

import { useEffect } from "react";
import { useDesign } from "./use-design";

/**
 * Global workspace keyboard shortcuts (ignored while typing in a field):
 *
 *   1 / 2 / 3   viewport: desktop / tablet / mobile
 *   + / -       zoom in / out        0   reset zoom
 *   j / k       next / previous component
 */
export function useWorkspaceShortcuts() {
  const { design, state, setViewport, setZoom, setSelectedComponentId } =
    useDesign();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case "1":
          setViewport("desktop");
          break;
        case "2":
          setViewport("tablet");
          break;
        case "3":
          setViewport("mobile");
          break;
        case "+":
        case "=":
          setZoom(Math.min(200, state.zoom + 10));
          break;
        case "-":
          setZoom(Math.max(50, state.zoom - 10));
          break;
        case "0":
          setZoom(100);
          break;
        case "j":
        case "k": {
          if (!design || design.components.length === 0) return;
          const ids = design.components.map((c) => c.id);
          const idx = ids.indexOf(state.selectedComponentId ?? "");
          const delta = e.key === "j" ? 1 : -1;
          const next =
            ids[(idx + delta + ids.length) % ids.length] ?? ids[0];
          setSelectedComponentId(next);
          break;
        }
        default:
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [design, state.zoom, state.selectedComponentId, setViewport, setZoom, setSelectedComponentId]);
}
