"use client";

import { useDesign } from "@/hooks/use-design";
import { Badge } from "@/components/ui/badge";
import {
  IconAccessibility,
  IconAlert,
  IconCheck,
  IconInfo,
} from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import type { A11ySeverity } from "@/types";
import type { ReactNode } from "react";

const SEVERITY_META: Record<
  A11ySeverity,
  { label: string; icon: ReactNode; tone: "danger" | "warning" | "info" | "success"; className: string }
> = {
  error: {
    label: "Error",
    icon: <IconAlert className="h-4 w-4" />,
    tone: "danger",
    className: "text-danger",
  },
  warning: {
    label: "Warning",
    icon: <IconAlert className="h-4 w-4" />,
    tone: "warning",
    className: "text-warning",
  },
  info: {
    label: "Info",
    icon: <IconInfo className="h-4 w-4" />,
    tone: "info",
    className: "text-fg-muted",
  },
  pass: {
    label: "Pass",
    icon: <IconCheck className="h-4 w-4" />,
    tone: "success",
    className: "text-success",
  },
};

function scoreColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-danger";
}

export function A11yTab() {
  const { design } = useDesign();
  if (!design) return null;
  const { accessibility } = design;

  const groups: A11ySeverity[] = ["error", "warning", "info", "pass"];

  return (
    <div className="space-y-4 p-3">
      {/* Score header */}
      <div className="rounded-lg border border-border bg-bg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="eyebrow text-fg-subtle">Accessibility score</p>
            <p className="text-xs text-fg-muted">
              Heuristic audit of contrast, structure, labels, and semantics.
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-display text-4xl font-semibold tabular-nums",
                scoreColor(accessibility.score)
              )}
            >
              {accessibility.score}
            </span>
            <span className="text-xs text-fg-subtle">/100</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="danger">{accessibility.summary.errors} errors</Badge>
          <Badge tone="warning">{accessibility.summary.warnings} warnings</Badge>
          <Badge tone="success">{accessibility.summary.passes} passes</Badge>
        </div>
      </div>

      {accessibility.issues.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg p-4 text-center">
          <IconAccessibility className="mx-auto h-8 w-8 text-success" />
          <p className="mt-2 text-sm font-medium text-fg">All clear</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            No accessibility issues found in the generated components.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((severity) => {
            const items = accessibility.issues.filter(
              (i) => i.severity === severity
            );
            if (items.length === 0) return null;
            const meta = SEVERITY_META[severity];

            return (
              <section key={severity} className="space-y-1.5">
                <p className="eyebrow text-fg-subtle">
                  {meta.label} · {items.length}
                </p>
                <ul className="space-y-2">
                  {items.map((issue) => (
                    <li
                      key={issue.id}
                      className="flex items-start gap-2.5 rounded-md border border-border bg-bg p-3"
                    >
                      <span
                        aria-hidden="true"
                        className={cn("flex-shrink-0", meta.className)}
                      >
                        {meta.icon}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-fg">
                          {issue.title}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                            {issue.category}
                          </span>
                          {issue.componentName && (
                            <>
                              <span className="text-fg-subtle">·</span>
                              <span className="font-mono text-[10px] text-fg-subtle">
                                {issue.componentName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
