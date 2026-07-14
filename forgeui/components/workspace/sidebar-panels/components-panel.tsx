"use client";

import { useDesign } from "@/hooks/use-design";
import { cn } from "@/utils/cn";
import type { ComponentKind } from "@/types";

const KIND_COLORS: Record<ComponentKind, string> = {
  Button: "bg-accent",
  Card: "bg-success",
  Navbar: "bg-warning",
  Hero: "bg-accent",
  Footer: "bg-fg",
  Input: "bg-success",
  Badge: "bg-warning",
  Container: "bg-fg-muted",
  Text: "bg-fg-muted",
  Image: "bg-fg-muted",
  Icon: "bg-fg-muted",
  Section: "bg-fg-muted",
};

export function ComponentsPanel() {
  const { design, state, setSelectedComponentId } = useDesign();
  if (!design) return null;

  // Group by kind
  const grouped = new Map<ComponentKind, typeof design.components>();
  for (const c of design.components) {
    const arr = grouped.get(c.kind) ?? [];
    arr.push(c);
    grouped.set(c.kind, arr);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-fg-subtle">
          Components · {design.components.length}
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([kind, components]) => (
          <div key={kind} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  KIND_COLORS[kind] ?? "bg-fg-muted"
                )}
              />
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                {kind} · {components.length}
              </p>
            </div>
            <ul className="space-y-px">
              {components.map((c) => {
                const active = state.selectedComponentId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentId(c.id)}
                      className={cn(
                        "block w-full truncate rounded px-2 py-1.5 text-left text-xs transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                        active
                          ? "bg-bg-subtle text-fg"
                          : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
                      )}
                      aria-current={active ? "true" : undefined}
                    >
                      <span className="truncate">{c.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
