"use client";

import { useDesign } from "@/hooks/use-design";
import { IconFile } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

export function PagesPanel() {
  const { design, state, setSelectedComponentId } = useDesign();
  if (!design) return null;

  return (
    <div className="space-y-3 p-4">
      <p className="eyebrow text-fg-subtle">
        Pages · {design.pages.length}
      </p>
      <ul className="space-y-3">
        {design.pages.map((page) => (
          <li key={page.id}>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-fg">
              <IconFile className="h-3.5 w-3.5 text-fg-muted" />
              <span>{page.name}</span>
              <span className="text-fg-subtle">·</span>
              <span className="font-mono text-[10px] text-fg-subtle">
                {page.componentIds.length}
              </span>
            </div>
            {page.componentIds.length > 0 ? (
              <ul className="space-y-px pl-5">
                {page.componentIds.map((cid) => {
                  const c = design.components.find((x) => x.id === cid);
                  if (!c) return null;
                  const active = state.selectedComponentId === cid;
                  return (
                    <li key={cid}>
                      <button
                        type="button"
                        onClick={() => setSelectedComponentId(cid)}
                        className={cn(
                          "block w-full truncate rounded px-2 py-1 text-left text-xs transition-colors",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                          active
                            ? "bg-bg-subtle text-fg"
                            : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
                        )}
                      >
                        {c.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="pl-5 text-xs text-fg-subtle">No components yet.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
