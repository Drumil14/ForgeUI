"use client";

import { useDesign } from "@/hooks/use-design";
import { cn } from "@/utils/cn";
import type { ComponentKind, GeneratedComponent } from "@/types";

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

function ComponentButton({
  c,
  active,
  onSelect,
}: {
  c: GeneratedComponent;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
        active
          ? "bg-bg-subtle text-fg"
          : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
      )}
      aria-current={active ? "true" : undefined}
    >
      <span className="truncate">{c.name}</span>
      {c.origin === "inferred" && (
        <span
          className="flex-shrink-0 font-mono text-[9px] uppercase tracking-wider text-fg-subtle"
          title="Classified from the design's structure, not a layer name"
        >
          inferred
        </span>
      )}
    </button>
  );
}

export function ComponentsPanel() {
  const { design, state, setSelectedComponentId } = useDesign();
  if (!design) return null;

  const fromFigma = design.components.filter((c) => c.origin !== "synthesized");
  const synthesized = design.components.filter(
    (c) => c.origin === "synthesized"
  );

  // Group the real components by kind
  const grouped = new Map<ComponentKind, typeof design.components>();
  for (const c of fromFigma) {
    const arr = grouped.get(c.kind) ?? [];
    arr.push(c);
    grouped.set(c.kind, arr);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-fg-subtle">
          Components · {fromFigma.length}
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
              {components.map((c) => (
                <li key={c.id}>
                  <ComponentButton
                    c={c}
                    active={state.selectedComponentId === c.id}
                    onSelect={() => setSelectedComponentId(c.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {synthesized.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Examples · {synthesized.length}
          </p>
          <p className="text-[11px] leading-snug text-fg-subtle">
            Not in the Figma file — synthesized from its tokens to demonstrate
            component types the design doesn&apos;t include.
          </p>
          <ul className="space-y-px">
            {synthesized.map((c) => (
              <li key={c.id}>
                <ComponentButton
                  c={c}
                  active={state.selectedComponentId === c.id}
                  onSelect={() => setSelectedComponentId(c.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
