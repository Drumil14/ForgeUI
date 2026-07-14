"use client";

import { useDesign } from "@/hooks/use-design";
import { Badge } from "@/components/ui/badge";

export function ProjectPanel() {
  const { design } = useDesign();
  if (!design) return null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const stats = [
    { label: "Components", value: design.components.length },
    { label: "Pages", value: design.pages.length },
    { label: "Colors", value: design.tokens.colors.length },
    { label: "Typography", value: design.tokens.typography.length },
    { label: "Spacing", value: design.tokens.spacing.length },
    { label: "Radii", value: design.tokens.radii.length },
  ];

  return (
    <div className="space-y-5 p-4">
      <div className="space-y-1">
        <p className="eyebrow text-fg-subtle">File</p>
        <h2 className="text-sm font-semibold text-fg" title={design.fileName}>
          {design.fileName}
        </h2>
        <p className="font-mono text-[11px] text-fg-subtle">
          {design.fileKey}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="success">Imported</Badge>
        <Badge tone="neutral">a11y {design.accessibility.score}</Badge>
      </div>

      <div className="space-y-1.5">
        <p className="eyebrow text-fg-subtle">Last modified</p>
        <p className="text-xs text-fg-muted">
          {formatDate(design.lastModified)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="eyebrow text-fg-subtle">Stats</p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-0.5 bg-bg p-2.5"
            >
              <dt className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {s.label}
              </dt>
              <dd className="font-display text-base font-semibold text-fg">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
