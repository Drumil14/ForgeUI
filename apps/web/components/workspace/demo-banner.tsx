"use client";

import Link from "next/link";
import { useState } from "react";
import { useDesign } from "@/hooks/use-design";
import { sampleDesign, SAMPLE_FILE_KEY } from "@/lib/sample-design";
import { Badge } from "@/components/ui/badge";

/**
 * Labels the demo state honestly. When the workspace is showing the committed
 * sample fixture, say so — it was parsed by the real engine, but it is not the
 * visitor's file. When a real import replaced it, offer the way back.
 */
export function DemoBanner() {
  const { design, setDesign } = useDesign();
  const [dismissed, setDismissed] = useState(false);

  if (!design) return null;
  const isSample = design.fileKey === SAMPLE_FILE_KEY;

  if (isSample && !dismissed) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-bg-subtle px-4 py-1.5">
        <Badge tone="accent">Demo</Badge>
        <p className="min-w-0 flex-1 truncate text-xs text-fg-muted">
          Showing the committed sample Figma fixture, parsed live by the real
          engine — tokens, components, provenance, and audits are all genuine
          output.{" "}
          <Link
            href="/verify"
            className="text-accent underline-offset-2 hover:underline"
          >
            See it verified against a drifted implementation →
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss demo notice"
          className="rounded px-1.5 py-0.5 text-xs text-fg-subtle transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!isSample) {
    return (
      <div className="flex items-center gap-3 border-b border-border bg-bg-subtle px-4 py-1.5">
        <p className="min-w-0 flex-1 truncate text-xs text-fg-muted">
          Imported: <span className="font-medium text-fg">{design.fileName}</span>
        </p>
        <button
          type="button"
          onClick={() => setDesign(sampleDesign)}
          className="rounded px-1.5 py-0.5 text-xs text-fg-subtle transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Restore sample
        </button>
      </div>
    );
  }

  return null;
}
