import type {
  Violation,
  ViolationType,
  VerifyConfig,
  VerifyReport,
} from "../types.js";

const ALL_TYPES: ViolationType[] = [
  "spacing",
  "radius",
  "font-size",
  "color",
  "contrast",
];

const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, info: 2 };

/**
 * Assemble the machine-readable report: summary counts, budget verdict, and the
 * violations sorted most-severe first (stable within a severity by DOM order).
 */
export function buildReport(args: {
  url: string;
  fileKey: string;
  viewport: { width: number; height: number };
  config: VerifyConfig;
  elementsChecked: number;
  violations: Violation[];
}): VerifyReport {
  const { url, fileKey, viewport, config, elementsChecked } = args;

  const violations = [...args.violations].sort((a, b) => {
    const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (s !== 0) return s;
    return Number(a.id.slice(1)) - Number(b.id.slice(1));
  });

  const byType = Object.fromEntries(ALL_TYPES.map((t) => [t, 0])) as Record<
    ViolationType,
    number
  >;
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const v of violations) {
    byType[v.type] += 1;
    if (v.severity === "error") errors += 1;
    else if (v.severity === "warning") warnings += 1;
    else infos += 1;
  }

  const overBudget = errors + warnings > config.budget;

  return {
    url,
    fileKey,
    generatedAt: new Date().toISOString(),
    viewport,
    config,
    summary: {
      total: violations.length,
      errors,
      warnings,
      infos,
      byType,
      elementsChecked,
      overBudget,
    },
    violations,
  };
}

/** CI exit code: 1 when the error+warning count exceeds the budget. */
export function exitCodeFor(report: VerifyReport): number {
  return report.summary.overBudget ? 1 : 0;
}
