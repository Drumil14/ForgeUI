"use client";

import { useMemo, useRef, useState } from "react";
import type {
  Severity,
  Violation,
  ViolationType,
  VerifyReport,
} from "@forgeui/verify/browser";
import { suggestFix } from "@forgeui/verify/browser";
import { Badge } from "@/components/ui/badge";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/utils/cn";

/**
 * Interactive viewer for a `forgeui verify` report: screenshot with clickable
 * violation overlays, filterable issue list, and a detail inspector with
 * deterministic fix suggestions. All rendering is client-side over the
 * report JSON — no scanning happens here (see /verify page for why).
 */

const TYPE_LABELS: Record<ViolationType, string> = {
  spacing: "Spacing",
  radius: "Radius",
  "font-size": "Type scale",
  color: "Color",
  contrast: "Contrast",
};

const SEVERITY_TONE: Record<Severity, "danger" | "warning" | "info"> = {
  error: "danger",
  warning: "warning",
  info: "info",
};

function CopyChip({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-bg px-2 py-1 font-mono text-[11px] text-fg transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      title={`Copy ${label}`}
    >
      <span className="text-fg-subtle">{label}</span>
      <span className="max-w-[260px] truncate">{value}</span>
      <span className={cn("text-[10px]", copied ? "text-success" : "text-fg-subtle")}>
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}

export function ReportViewer({ report }: { report: VerifyReport }) {
  const [severityFilter, setSeverityFilter] = useState<Set<Severity>>(
    new Set(["error", "warning", "info"]),
  );
  const [typeFilter, setTypeFilter] = useState<Set<ViolationType>>(
    new Set(Object.keys(TYPE_LABELS) as ViolationType[]),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    report.violations[0]?.id ?? null,
  );
  const imageWrapRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      report.violations.filter(
        (v) => severityFilter.has(v.severity) && typeFilter.has(v.type),
      ),
    [report.violations, severityFilter, typeFilter],
  );
  const selected = visible.find((v) => v.id === selectedId) ?? null;
  const fix = selected ? suggestFix(selected) : null;

  const art = report.artifacts;
  const hasScreenshot = Boolean(art?.screenshotDataUrl);

  const toggle = <T,>(set: Set<T>, value: T, update: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) {
      if (next.size > 1) next.delete(value);
    } else {
      next.add(value);
    }
    update(next);
  };

  const selectIssue = (v: Violation) => {
    setSelectedId(v.id);
    // Scroll the overlay into view within the screenshot pane.
    if (art && imageWrapRef.current) {
      const scale = imageWrapRef.current.clientWidth / art.pageWidth;
      imageWrapRef.current.scrollTo({
        top: Math.max(0, v.box.y * scale - 120),
        behavior: "smooth",
      });
    }
  };

  const s = report.summary;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-bg-elevated px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-fg-muted">{report.url}</p>
          <p className="text-[11px] text-fg-subtle">
            {s.elementsChecked} elements checked · viewport {report.viewport.width}×
            {report.viewport.height} · {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge tone="danger">{s.errors} errors</Badge>
          <Badge tone="warning">{s.warnings} warnings</Badge>
          <Badge tone="info">{s.infos} info</Badge>
          <Badge tone={s.overBudget ? "danger" : "success"}>
            {s.overBudget
              ? `over budget (${report.config.budget})`
              : `within budget (${report.config.budget})`}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow text-fg-subtle">Severity</span>
        {(["error", "warning", "info"] as Severity[]).map((sev) => (
          <button
            key={sev}
            type="button"
            aria-pressed={severityFilter.has(sev)}
            onClick={() => toggle(severityFilter, sev, setSeverityFilter)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              severityFilter.has(sev)
                ? "border-border-strong bg-bg-subtle text-fg"
                : "border-border text-fg-subtle hover:text-fg-muted",
            )}
          >
            {sev}
          </button>
        ))}
        <span className="eyebrow ml-3 text-fg-subtle">Category</span>
        {(Object.keys(TYPE_LABELS) as ViolationType[]).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={typeFilter.has(t)}
            onClick={() => toggle(typeFilter, t, setTypeFilter)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              typeFilter.has(t)
                ? "border-border-strong bg-bg-subtle text-fg"
                : "border-border text-fg-subtle hover:text-fg-muted",
            )}
          >
            {TYPE_LABELS[t]} ({s.byType[t] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Screenshot + overlays */}
        <div className="min-w-0">
          {hasScreenshot && art ? (
            <div
              ref={imageWrapRef}
              className="scrollbar-thin relative max-h-[640px] overflow-auto rounded-md border border-border bg-bg-elevated"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.screenshotDataUrl!}
                  alt={`Full-page screenshot of ${report.url}`}
                  className="block w-full"
                />
                {visible.map((v) => {
                  const active = v.id === selectedId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-label={`${v.type} issue: ${v.message}`}
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "absolute border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                        active
                          ? "z-10 border-accent bg-accent/15"
                          : v.severity === "error"
                            ? "border-danger/70 bg-danger/5 hover:bg-danger/15"
                            : v.severity === "warning"
                              ? "border-warning/70 bg-warning/5 hover:bg-warning/15"
                              : "border-border-strong bg-transparent hover:bg-bg-subtle/40",
                      )}
                      style={{
                        left: `${(v.box.x / art.pageWidth) * 100}%`,
                        top: `${(v.box.y / art.pageHeight) * 100}%`,
                        width: `${(v.box.width / art.pageWidth) * 100}%`,
                        height: `${(v.box.height / art.pageHeight) * 100}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[200px] place-items-center rounded-md border border-dashed border-border bg-bg-elevated p-6 text-center">
              <p className="text-xs text-fg-muted">
                This report has no embedded screenshot (budget-only run). The
                issue list and fixes on the right still apply.
              </p>
            </div>
          )}
        </div>

        {/* Issue list + inspector */}
        <div className="min-w-0 space-y-3">
          <ul className="scrollbar-thin max-h-[320px] space-y-1 overflow-auto pr-1">
            {visible.length === 0 && (
              <li className="rounded-md border border-dashed border-border p-4 text-center text-xs text-fg-muted">
                No issues match the current filters.
              </li>
            )}
            {visible.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => selectIssue(v)}
                  aria-current={v.id === selectedId ? "true" : undefined}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                    v.id === selectedId
                      ? "border-accent/50 bg-accent/5"
                      : "border-border bg-bg hover:bg-bg-subtle",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={SEVERITY_TONE[v.severity]}>{v.severity}</Badge>
                    <span className="text-xs font-medium text-fg">
                      {TYPE_LABELS[v.type]} · {v.property}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-fg-subtle">
                      {v.found}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[10px] text-fg-subtle">
                    {v.selector}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="space-y-3 rounded-md border border-border bg-bg-elevated p-4">
              <div>
                <p className="eyebrow text-fg-subtle">Issue</p>
                <p className="mt-1 text-sm text-fg">{selected.message}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-fg-subtle">Actual</dt>
                  <dd className="mt-0.5 font-mono text-fg">{selected.found}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">Expected (nearest token)</dt>
                  <dd className="mt-0.5 font-mono text-fg">
                    {selected.nearestToken
                      ? `${selected.nearestToken.name} · ${selected.nearestToken.value}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="eyebrow text-fg-subtle">Element</p>
                <p className="mt-1 break-all font-mono text-[11px] text-fg-muted">
                  {selected.selector}
                </p>
              </div>
              {fix && (
                <div className="space-y-2">
                  <p className="eyebrow text-fg-subtle">Suggested fix</p>
                  <p className="text-xs text-fg-muted">{fix.note}</p>
                  <div className="flex flex-wrap gap-2">
                    {fix.css && <CopyChip label="css" value={fix.css} />}
                    {fix.tailwind && (
                      <CopyChip label="tw" value={fix.tailwind} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
