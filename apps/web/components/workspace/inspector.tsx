"use client";

import { useState } from "react";
import { useDesign } from "@/hooks/use-design";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconAccessibility,
  IconBox,
  IconCode,
  IconDownload,
  IconSettings,
} from "@/components/ui/icons";

import { CodeTab } from "./inspector-tabs/code-tab";
import { ClassesTab } from "./inspector-tabs/classes-tab";
import { A11yTab } from "./inspector-tabs/a11y-tab";
import { PropsTab } from "./inspector-tabs/props-tab";
import { ExportTab } from "./inspector-tabs/export-tab";

export function Inspector() {
  const { design, state } = useDesign();
  const [tab, setTab] = useState("code");

  if (!design) return null;

  const selected = design.components.find(
    (c) => c.id === state.selectedComponentId
  );

  if (!selected) {
    return (
      <aside
        aria-label="Inspector"
        className="flex h-full flex-col border-l border-border bg-bg"
      >
        <div className="border-b border-border px-3 py-2.5">
          <p className="eyebrow text-fg-subtle">Inspector</p>
        </div>
        <EmptyState
          icon={<IconBox className="h-5 w-5" />}
          title="No component selected"
          description="Choose a component from the sidebar to see its source, classes, and accessibility report."
        />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Inspector"
      className="flex h-full flex-col overflow-hidden border-l border-border bg-bg"
    >
      {/* Header */}
      <div className="flex-shrink-0 space-y-1 border-b border-border px-3 py-2.5">
        <p className="eyebrow text-fg-subtle">Inspector</p>
        <p className="truncate text-sm font-semibold text-fg">
          {selected.name}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          {selected.kind}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden">
        <TabsList ariaLabel="Inspector sections" className="flex-shrink-0 overflow-x-auto px-2">
          <Tab value="code" icon={<IconCode className="h-3.5 w-3.5" />}>
            Code
          </Tab>
          <Tab value="classes" icon={<IconBox className="h-3.5 w-3.5" />}>
            Classes
          </Tab>
          <Tab value="a11y" icon={<IconAccessibility className="h-3.5 w-3.5" />}>
            A11y
          </Tab>
          <Tab value="props" icon={<IconSettings className="h-3.5 w-3.5" />}>
            Props
          </Tab>
          <Tab value="export" icon={<IconDownload className="h-3.5 w-3.5" />}>
            Export
          </Tab>
        </TabsList>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          <TabPanel value="code">
            <CodeTab component={selected} />
          </TabPanel>
          <TabPanel value="classes">
            <ClassesTab component={selected} />
          </TabPanel>
          <TabPanel value="a11y">
            <A11yTab />
          </TabPanel>
          <TabPanel value="props">
            <PropsTab component={selected} />
          </TabPanel>
          <TabPanel value="export">
            <ExportTab component={selected} />
          </TabPanel>
        </div>
      </Tabs>
    </aside>
  );
}
