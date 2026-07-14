"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Preview } from "./preview";
import { Inspector } from "./inspector";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import {
  IconBox,
  IconCode,
  IconLayers,
} from "@/components/ui/icons";

/**
 * Renders the three-pane workspace on desktop and stacked tabs on smaller
 * screens. Avoids hydration mismatch by rendering the desktop layout on the
 * server and swapping after mount.
 */
export function WorkspaceLayout() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!mounted || !isMobile) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[240px_1fr_360px] overflow-hidden">
        <Sidebar />
        <Preview />
        <Inspector />
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
