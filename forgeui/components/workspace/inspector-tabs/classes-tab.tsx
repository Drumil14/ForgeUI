"use client";

import { useCopy } from "@/hooks/use-copy";
import { IconCheck, IconCopy } from "@/components/ui/icons";
import type { GeneratedComponent } from "@/types";

interface ClassesTabProps {
  component: GeneratedComponent;
}

// Group classes loosely by category for inspectability.
function groupClasses(classes: string): Array<{ group: string; values: string[] }> {
  const tokens = classes.split(/\s+/).filter(Boolean);
  const groups: Record<string, string[]> = {
    Layout: [],
    Spacing: [],
    Typography: [],
    Color: [],
    Border: [],
    Effect: [],
    Other: [],
  };

  for (const t of tokens) {
    if (/^(flex|grid|inline-flex|inline-grid|block|inline-block|hidden|relative|absolute|fixed|sticky|items-|justify-|self-|gap-|order-|col-|row-|w-|h-|min-w-|min-h-|max-w-|max-h-)/.test(t)) {
      groups.Layout.push(t);
    } else if (/^(p|m)[trbxylr]?-/.test(t) || /^(space-)/.test(t)) {
      groups.Spacing.push(t);
    } else if (/^(text-|font-|leading-|tracking-|whitespace-|truncate|underline)/.test(t)) {
      groups.Typography.push(t);
    } else if (/^(bg-|fill-|stroke-|text-(?:bg|fg|accent|success|warning|danger))/.test(t)) {
      groups.Color.push(t);
    } else if (/^(rounded|border|ring|outline|divide)/.test(t)) {
      groups.Border.push(t);
    } else if (/^(shadow|opacity|blur|transition|hover:|focus:|active:|focus-visible:)/.test(t)) {
      groups.Effect.push(t);
    } else {
      groups.Other.push(t);
    }
  }

  return Object.entries(groups)
    .filter(([, v]) => v.length > 0)
    .map(([group, values]) => ({ group, values }));
}

export function ClassesTab({ component }: ClassesTabProps) {
  const { copied, copy } = useCopy();
  const grouped = groupClasses(component.classes);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="eyebrow text-fg-subtle">Tailwind classes</p>
          <p className="text-xs text-fg-muted">
            Utilities applied to the root element, grouped by category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy(component.classes)}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-bg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {copied ? (
            <>
              <IconCheck className="h-3.5 w-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <IconCopy className="h-3.5 w-3.5" />
              Copy all
            </>
          )}
        </button>
      </div>

      {grouped.length === 0 ? (
        <p className="text-xs text-fg-subtle">No classes on the root element.</p>
      ) : (
        <ul className="space-y-3">
          {grouped.map(({ group, values }) => (
            <li key={group} className="space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                {group} · {values.length}
              </p>
              <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <span
                    key={v}
                    className="inline-block rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-fg-muted"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
