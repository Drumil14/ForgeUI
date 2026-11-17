"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AxeComponentResult,
  ParsedDesign,
  SidebarTab,
  Viewport,
  WorkspaceState,
} from "@/types";

/**
 * Single source of truth for workspace state.
 *
 * Lives at the workspace layout level so every panel — left sidebar, center
 * canvas, right inspector — reads from one place. No external state library
 * needed; React Context is enough for the cardinality we have here (handful of
 * primitive fields plus one parsed design object).
 */

interface DesignContextValue {
  design: ParsedDesign | null;
  setDesign: (d: ParsedDesign | null) => void;
  isLoading: boolean;
  setIsLoading: (b: boolean) => void;
  error: { message: string; kind: string } | null;
  setError: (e: { message: string; kind: string } | null) => void;
  state: WorkspaceState;
  setSelectedComponentId: (id: string | null) => void;
  setViewport: (v: Viewport) => void;
  setZoom: (z: number) => void;
  setSidebarTab: (t: SidebarTab) => void;
  /** Live prop overrides per component id, driven by the Props tab. */
  propsOverrides: Record<string, Record<string, unknown>>;
  setPropOverride: (componentId: string, prop: string, value: unknown) => void;
  resetPropOverrides: (componentId: string) => void;
  /** axe-core results per component id, reported by the sandboxed preview. */
  axeResults: Record<string, AxeComponentResult>;
  setAxeResult: (componentId: string, result: AxeComponentResult) => void;
}

const DesignContext = createContext<DesignContextValue | null>(null);

interface DesignProviderProps {
  children: ReactNode;
  initialDesign?: ParsedDesign | null;
}

export function DesignProvider({
  children,
  initialDesign = null,
}: DesignProviderProps) {
  const [design, setDesign] = useState<ParsedDesign | null>(initialDesign);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    { message: string; kind: string } | null
  >(null);
  const [selectedComponentId, setSelectedComponentId] = useState<
    string | null
  >(initialDesign?.components[0]?.id ?? null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("components");

  const [propsOverrides, setPropsOverrides] = useState<
    Record<string, Record<string, unknown>>
  >({});

  const handleSetDesign = useCallback((d: ParsedDesign | null) => {
    setDesign(d);
    setSelectedComponentId(d?.components[0]?.id ?? null);
    setPropsOverrides({});
    setError(null);
  }, []);

  const setPropOverride = useCallback(
    (componentId: string, prop: string, value: unknown) => {
      setPropsOverrides((prev) => ({
        ...prev,
        [componentId]: { ...prev[componentId], [prop]: value },
      }));
    },
    [],
  );

  const [axeResults, setAxeResults] = useState<
    Record<string, AxeComponentResult>
  >({});

  const setAxeResult = useCallback(
    (componentId: string, result: AxeComponentResult) => {
      setAxeResults((prev) => ({ ...prev, [componentId]: result }));
    },
    [],
  );

  const resetPropOverrides = useCallback((componentId: string) => {
    setPropsOverrides((prev) => {
      if (!(componentId in prev)) return prev;
      const next = { ...prev };
      delete next[componentId];
      return next;
    });
  }, []);

  const value = useMemo<DesignContextValue>(
    () => ({
      design,
      setDesign: handleSetDesign,
      isLoading,
      setIsLoading,
      error,
      setError,
      state: { selectedComponentId, viewport, zoom, sidebarTab },
      setSelectedComponentId,
      setViewport,
      setZoom,
      setSidebarTab,
      propsOverrides,
      setPropOverride,
      resetPropOverrides,
      axeResults,
      setAxeResult,
    }),
    [
      design,
      handleSetDesign,
      isLoading,
      error,
      selectedComponentId,
      viewport,
      zoom,
      sidebarTab,
      propsOverrides,
      setPropOverride,
      resetPropOverrides,
      axeResults,
      setAxeResult,
    ],
  );

  return (
    <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx)
    throw new Error("useDesign must be used inside <DesignProvider>");
  return ctx;
}
