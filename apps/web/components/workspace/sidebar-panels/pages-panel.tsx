"use client";

import { useDesign } from "@/hooks/use-design";
import { IconFile } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

export function PagesPanel() {
  const { design, state, setSelectedComponentId } = useDesign();
  if (!design) return null;

  const synthesized = design.components.filter(
    (c) => c.origin === "synthesized"
  );

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
              <p className="pl-5 text-xs text-fg-subtle">
                No components on this page.
              </p>
            )}
          </li>
        ))}
      </ul>

      {synthesized.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-xs font-semibold text-fg-subtle">
            Examples (no Figma page)
          </p>
          <ul className="space-y-px pl-5">
            {synthesized.map((c) => {
              const active = state.selectedComponentId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedComponentId(c.id)}
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
        </div>
      )}
    </div>
  );
}
