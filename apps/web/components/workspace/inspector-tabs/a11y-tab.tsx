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
import type { A11ySeverity, GeneratedComponent } from "@/types";
import type { ReactNode } from "react";

/**
 * Accessibility findings in three explicitly-labeled tiers, because they carry
 * different weight:
 *
 *  1. Rendered-DOM findings — axe-core running on the actual generated
 *     component inside the sandboxed preview. Strongest automated signal.
 *  2. Static design heuristics — analysis of tokens + generated source
 *     without a browser. Useful early warning, weaker evidence.
 *  3. Manual checks — things no automated tool can verify.
 *
 * None of these constitute WCAG compliance certification.
 */

const SEVERITY_META: Record<
  A11ySeverity,
  { label: string; icon: ReactNode; className: string }
> = {
  error: {
    label: "Error",
    icon: <IconAlert className="h-4 w-4" />,
    className: "text-danger",
  },
  warning: {
    label: "Warning",
    icon: <IconAlert className="h-4 w-4" />,
    className: "text-warning",
  },
  info: {
    label: "Info",
    icon: <IconInfo className="h-4 w-4" />,
    className: "text-fg-muted",
  },
  pass: {
    label: "Pass",
    icon: <IconCheck className="h-4 w-4" />,
    className: "text-success",
  },
};

const IMPACT_TONE: Record<string, "danger" | "warning" | "info"> = {
  critical: "danger",
  serious: "danger",
  moderate: "warning",
  minor: "info",
};

const MANUAL_CHECKS = [
  "Tab through every interactive element — focus order should follow the visual order and never get trapped.",
  "Confirm each interactive element shows a visible focus indicator at 200% zoom.",
  "Exercise the component with a screen reader (NVDA/VoiceOver): names, roles, and states should be announced.",
  "Check motion/animation against prefers-reduced-motion if you add transitions.",
  "Verify touch targets are at least 24×24 CSS px in the real layout.",
];

function AxeSection({ component }: { component: GeneratedComponent }) {
  const { axeResults } = useDesign();
  const result = axeResults[component.id];

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="eyebrow text-fg-subtle">Rendered DOM · axe-core</p>
        <Badge tone="accent" title="Runs on the actual generated component in the sandboxed preview">
          strongest signal
        </Badge>
      </div>
      {!result ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-fg-muted">
          Waiting for the preview to render {component.name} — the audit runs
          automatically on the real DOM once it does.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={result.violations.length ? "danger" : "success"}>
              {result.violations.length} violations
            </Badge>
            <Badge tone="success">{result.passes} rules passed</Badge>
            {result.incomplete > 0 && (
              <Badge tone="warning" title="Rules axe could not conclusively evaluate">
                {result.incomplete} inconclusive
              </Badge>
            )}
          </div>
          {result.violations.length === 0 ? (
            <p className="flex items-center gap-2 rounded-md border border-border bg-bg p-3 text-xs text-fg-muted">
              <IconCheck className="h-4 w-4 flex-shrink-0 text-success" />
              axe found no WCAG A/AA violations in this rendered state. Other
              states (hover, error, different props) may still differ — try
              them via the Props tab.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.violations.map((v) => (
                <li
                  key={v.id}
                  className="space-y-1 rounded-md border border-border bg-bg p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={IMPACT_TONE[v.impact ?? "minor"] ?? "info"}>
                      {v.impact ?? "unknown"}
                    </Badge>
                    <p className="text-xs font-semibold text-fg">{v.help}</p>
                  </div>
                  <p className="text-xs text-fg-muted">{v.description}</p>
                  {v.nodes[0] && (
                    <p className="truncate font-mono text-[10px] text-fg-subtle">
                      {v.nodes[0].target}
                    </p>
                  )}
                  <a
                    href={v.helpUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-block text-[11px] text-accent underline-offset-2 hover:underline"
                  >
                    How to fix ({v.id}) ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export function A11yTab({ component }: { component: GeneratedComponent | null }) {
  const { design } = useDesign();
  if (!design) return null;
  const { accessibility } = design;

  const groups: A11ySeverity[] = ["error", "warning", "info", "pass"];

  return (
    <div className="space-y-5 p-3">
      {/* Honest framing */}
      <div className="rounded-lg border border-border bg-bg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="eyebrow text-fg-subtle">Heuristic score</p>
            <p className="text-xs text-fg-muted">
              A weighted summary of the static checks below — a development
              aid, <strong className="font-semibold">not</strong> WCAG
              compliance. Automated tools catch roughly a third of WCAG
              issues; the manual checklist matters.
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-display text-4xl font-semibold tabular-nums",
                accessibility.score >= 90
                  ? "text-success"
                  : accessibility.score >= 70
                    ? "text-warning"
                    : "text-danger",
              )}
            >
              {accessibility.score}
            </span>
            <span className="text-xs text-fg-subtle">/100</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="danger">{accessibility.summary.errors} errors</Badge>
          <Badge tone="warning">{accessibility.summary.warnings} warnings</Badge>
          <Badge tone="success">{accessibility.summary.passes} passes</Badge>
        </div>
      </div>

      {/* 1. Rendered DOM — axe-core on the selected component */}
      {component && <AxeSection component={component} />}

      {/* 2. Static heuristics */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow text-fg-subtle">Static design heuristics</p>
          <Badge tone="neutral" title="Computed from tokens + generated source without a browser">
            early warning
          </Badge>
        </div>
        {accessibility.issues.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg p-4 text-center">
            <IconAccessibility className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 text-xs text-fg-muted">
              No heuristic findings for the generated components.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((severity) => {
              const items = accessibility.issues.filter(
                (i) => i.severity === severity,
              );
              if (items.length === 0) return null;
              const meta = SEVERITY_META[severity];
              return (
                <div key={severity} className="space-y-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Manual verification */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow text-fg-subtle">Needs manual verification</p>
          <Badge tone="neutral">no tool can check these</Badge>
        </div>
        <ul className="space-y-1.5">
          {MANUAL_CHECKS.map((check) => (
            <li
              key={check}
              className="flex items-start gap-2 rounded-md border border-border bg-bg px-3 py-2 text-xs text-fg-muted"
            >
              <span aria-hidden="true" className="mt-0.5 text-fg-subtle">
                ☐
              </span>
              {check}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
