"use client";

import { useState } from "react";
import { useDesign } from "@/hooks/use-design";
import { IconChevronDown, IconChevronRight } from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import type { LayerNode } from "@/types";

function LayerRow({ layer, depth = 0 }: { layer: LayerNode; depth?: number }) {
  const hasChildren = (layer.children?.length ?? 0) > 0;
  const [open, setOpen] = useState(depth < 1);

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-bg-subtle"
        style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse" : "Expand"}
            aria-expanded={open}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-fg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent"
          >
            {open ? (
              <IconChevronDown className="h-3 w-3" />
            ) : (
              <IconChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="font-mono text-[10px] uppercase text-fg-subtle">
          {layer.type.slice(0, 4)}
        </span>
        <span className="truncate text-xs text-fg-muted group-hover:text-fg">
          {layer.name}
        </span>
      </div>
      {hasChildren && open && (
        <ul className="space-y-px">
          {layer.children!.map((c) => (
            <LayerRow key={c.id} layer={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LayersPanel() {
  const { design } = useDesign();
  if (!design) return null;

  return (
    <div className="space-y-3 p-4">
      <p className="eyebrow text-fg-subtle">Layer tree</p>
      {design.layerTree.length === 0 ? (
        <p className="text-xs text-fg-subtle">No layers parsed.</p>
      ) : (
        <ul className="space-y-px">
          {design.layerTree.map((l) => (
            <LayerRow key={l.id} layer={l} />
          ))}
        </ul>
      )}
    </div>
  );
}
