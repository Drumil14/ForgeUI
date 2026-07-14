"use client";

import { CodeBlock } from "@/components/ui/code-block";
import type { GeneratedComponent } from "@/types";

interface CodeTabProps {
  component: GeneratedComponent;
}

export function CodeTab({ component }: CodeTabProps) {
  return (
    <div className="space-y-3 p-3">
      <div className="space-y-1">
        <p className="eyebrow text-fg-subtle">Component source</p>
        <p className="text-xs text-fg-muted">
          Production-ready TSX. Drop it into your app, swap in your own colors,
          ship it.
        </p>
      </div>
      <CodeBlock
        code={component.source}
        language="tsx"
        filename={`${component.name}.tsx`}
        maxHeight="calc(100vh - 280px)"
      />
    </div>
  );
}
