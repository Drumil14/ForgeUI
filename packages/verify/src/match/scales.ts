import type { DesignTokens } from "@forgeui/core";
import type { NearestToken } from "../types.js";

/**
 * Turn the design tokens into the lookup structures the matcher needs:
 * numeric scales (spacing / font-size / radius) and a color palette. Building
 * these once per run keeps matching O(elements × tokens) and fully deterministic.
 */

export interface NumericStep {
  name: string;
  value: number;
}

export interface TokenScales {
  spacing: NumericStep[];
  fontSize: NumericStep[];
  radius: NumericStep[];
  /** Palette entries as { name, rgb }. */
  palette: Array<{ name: string; rgb: { r: number; g: number; b: number } }>;
  /** The largest radius token value (used to recognise pill/`full` radii). */
  maxRadius: number;
  /** The largest spacing token value (used to spot auto-centering margins). */
  maxSpacing: number;
}

function dedupeSteps(steps: NumericStep[]): NumericStep[] {
  const seen = new Map<number, NumericStep>();
  for (const s of steps) if (!seen.has(s.value)) seen.set(s.value, s);
  return Array.from(seen.values()).sort((a, b) => a.value - b.value);
}

export function buildScales(
  tokens: DesignTokens,
  hexToRgb: (hex: string) => { r: number; g: number; b: number } | null,
): TokenScales {
  const spacing = dedupeSteps(
    tokens.spacing.map((s) => ({ name: s.name, value: s.value })),
  );

  const fontSize = dedupeSteps(
    tokens.typography.map((t) => ({ name: t.name, value: t.fontSize })),
  );

  const radius = dedupeSteps(
    tokens.radii.map((r) => ({ name: r.name, value: r.value })),
  );

  const palette = tokens.colors
    .map((c) => ({ name: c.name, rgb: hexToRgb(c.hex) }))
    .filter((c): c is { name: string; rgb: { r: number; g: number; b: number } } => c.rgb !== null);

  const maxRadius = radius.reduce((m, r) => Math.max(m, r.value), 0);
  const maxSpacing = spacing.reduce((m, s) => Math.max(m, s.value), 0);

  return { spacing, fontSize, radius, palette, maxRadius, maxSpacing };
}

/** Nearest step to `value` in a sorted numeric scale. Returns null for empty scales. */
export function nearestStep(value: number, scale: NumericStep[]): NumericStep | null {
  if (scale.length === 0) return null;
  let best = scale[0];
  let bestDelta = Math.abs(scale[0].value - value);
  for (const step of scale) {
    const d = Math.abs(step.value - value);
    if (d < bestDelta) {
      best = step;
      bestDelta = d;
    }
  }
  return best;
}

/**
 * Decide whether `value` is off-scale. On-scale means it is within `tolerancePx`
 * of some step. Returns the nearest token when off-scale, else null.
 */
export function offScale(
  value: number,
  scale: NumericStep[],
  tolerancePx: number,
): NearestToken | null {
  const nearest = nearestStep(value, scale);
  if (!nearest) return null;
  if (Math.abs(nearest.value - value) <= tolerancePx) return null;
  return { name: nearest.name, value: nearest.value };
}
