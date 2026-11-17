import { DesignProvider } from "@/hooks/use-design";
import { sampleDesign } from "@/lib/sample-design";
import { Topbar } from "@/components/workspace/topbar";
import { DemoBanner } from "@/components/workspace/demo-banner";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export const metadata = {
  title: "Workspace · ForgeUI",
  description:
    "Convert a Figma design into accessible React + Tailwind components.",
};

export default function WorkspacePage() {
  return (
    <DesignProvider initialDesign={sampleDesign}>
      <div className="flex h-dvh flex-col overflow-hidden bg-bg">
        <Topbar />
        <DemoBanner />
        <main className="min-h-0 flex-1 overflow-hidden">
          <WorkspaceLayout />
        </main>
      </div>
    </DesignProvider>
  );
}
