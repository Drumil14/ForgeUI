"use client";

import { useDesign } from "@/hooks/use-design";
import {
  IconAccessibility,
  IconBox,
  IconFile,
  IconFolder,
  IconImage,
  IconLayers,
  IconPalette,
} from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import type { SidebarTab } from "@/types";
import type { ReactNode } from "react";

import { ProjectPanel } from "./sidebar-panels/project-panel";
import { PagesPanel } from "./sidebar-panels/pages-panel";
import { LayersPanel } from "./sidebar-panels/layers-panel";
import { AssetsPanel } from "./sidebar-panels/assets-panel";
import { ComponentsPanel } from "./sidebar-panels/components-panel";
import { TokensPanel } from "./sidebar-panels/tokens-panel";

interface TabDef {
  id: SidebarTab;
  label: string;
  icon: ReactNode;
}

const TABS: TabDef[] = [
  { id: "project", label: "Project", icon: <IconFolder className="h-4 w-4" /> },
  { id: "pages", label: "Pages", icon: <IconFile className="h-4 w-4" /> },
  { id: "layers", label: "Layers", icon: <IconLayers className="h-4 w-4" /> },
  { id: "assets", label: "Assets", icon: <IconImage className="h-4 w-4" /> },
  { id: "components", label: "Components", icon: <IconBox className="h-4 w-4" /> },
  { id: "tokens", label: "Tokens", icon: <IconPalette className="h-4 w-4" /> },
];

export function Sidebar() {
  const { state, setSidebarTab } = useDesign();

  return (
    <aside
      aria-label="Sidebar"
      className="flex h-full flex-col border-r border-border bg-bg"
    >
      {/* Tab rail */}
      <div
        role="tablist"
        aria-label="Sidebar sections"
        className="flex flex-shrink-0 items-center justify-between gap-px border-b border-border bg-bg-subtle px-1.5"
      >
        {TABS.map((tab) => {
          const active = state.sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              title={tab.label}
              onClick={() => setSidebarTab(tab.id)}
              className={cn(
                "relative flex h-10 flex-1 items-center justify-center transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                active
                  ? "text-fg"
                  : "text-fg-subtle hover:text-fg-muted"
              )}
            >
              {tab.icon}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-px left-2 right-2 h-px bg-fg"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <SidebarPanel tab={state.sidebarTab} />
      </div>
    </aside>
  );
}

function SidebarPanel({ tab }: { tab: SidebarTab }) {
  switch (tab) {
    case "project":
      return <ProjectPanel />;
    case "pages":
      return <PagesPanel />;
    case "layers":
      return <LayersPanel />;
    case "assets":
      return <AssetsPanel />;
    case "components":
      return <ComponentsPanel />;
    case "tokens":
      return <TokensPanel />;
  }
}
