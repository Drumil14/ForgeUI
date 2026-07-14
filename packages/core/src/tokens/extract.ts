import type { FigmaNode } from "../figma/types.js";
import type {
  ColorToken,
  DesignTokens,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  TypographyToken,
} from "./types.js";
import {
  classifyColor,
  figmaColorToHex,
  figmaColorToRgba,
  nameForColor,
} from "./color.js";

/**
 * Walk a Figma node tree and pull out every visible primitive value:
 * colors, type styles, spacing values, radii, and shadows.
 *
 * The extraction is deliberately lossy — it counts usage so we can rank tokens
 * and skip ones that appear only once (almost always noise from a stray Figma
 * element rather than a real design decision).
 */

interface TokenAccumulator {
  colors: Map<string, ColorToken>;
  typography: Map<string, TypographyToken>;
  spacing: Map<number, SpacingToken>;
  radii: Map<number, number>;
  shadows: Map<string, number>;
}

function createAccumulator(): TokenAccumulator {
  return {
    colors: new Map(),
    typography: new Map(),
    spacing: new Map(),
    radii: new Map(),
    shadows: new Map(),
  };
}

function visit(node: FigmaNode, acc: TokenAccumulator): void {
  if (node.visible === false) return;

  // Fills → colors
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.visible === false || fill.type !== "SOLID" || !fill.color)
        continue;
      const hex = figmaColorToHex(fill.color).toLowerCase();
      const existing = acc.colors.get(hex);
      if (existing) {
        existing.usage += 1;
      } else {
        const role = classifyColor(hex);
        acc.colors.set(hex, {
          name: hex, // temporary — replaced after we know the full distribution
          hex,
          rgba: figmaColorToRgba(fill.color, fill.opacity ?? fill.color.a),
          usage: 1,
          role,
        });
      }
    }
  }

  // Text → typography
  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    const key = `${s.fontFamily}|${s.fontWeight}|${s.fontSize}|${s.lineHeightPx ?? "auto"}`;
    const existing = acc.typography.get(key);
    if (existing) {
      existing.usage += 1;
    } else {
      acc.typography.set(key, {
        name: key,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeightPx,
        letterSpacing: s.letterSpacing,
        usage: 1,
      });
    }
  }

  // Auto-layout padding & itemSpacing → spacing
  const spacings = [
    node.paddingTop,
    node.paddingRight,
    node.paddingBottom,
    node.paddingLeft,
    node.itemSpacing,
  ];
  for (const v of spacings) {
    if (typeof v === "number" && v > 0) {
      const rounded = Math.round(v);
      const existing = acc.spacing.get(rounded);
      if (existing) existing.usage += 1;
      else
        acc.spacing.set(rounded, {
          name: `spacing-${rounded}`,
          value: rounded,
          usage: 1,
        });
    }
  }

  // Corner radius
  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
    const r = Math.round(node.cornerRadius);
    acc.radii.set(r, (acc.radii.get(r) ?? 0) + 1);
  }

  // Effects → shadows
  if (node.effects) {
    for (const e of node.effects) {
      if (e.visible === false) continue;
      if (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW") continue;
      const color = e.color ? figmaColorToRgba(e.color) : "rgba(0,0,0,0.1)";
      const ox = e.offset?.x ?? 0;
      const oy = e.offset?.y ?? 0;
      const inset = e.type === "INNER_SHADOW" ? "inset " : "";
      const css = `${inset}${ox}px ${oy}px ${e.radius}px ${e.spread ?? 0}px ${color}`;
      acc.shadows.set(css, (acc.shadows.get(css) ?? 0) + 1);
    }
  }

  if (node.children) {
    for (const child of node.children) visit(child, acc);
  }
}

/**
 * Given the accumulated raw color map, produce a stable, named, deduplicated
 * list of color tokens. Sorting by usage means the user sees the brand-
 * defining colors at the top of the panel.
 */
function finalizeColors(map: Map<string, ColorToken>): ColorToken[] {
  const tokens = Array.from(map.values()).filter((t) => t.usage >= 1);

  // Sort: vivid (primary/accent) first, then by usage descending.
  const roleRank: Record<string, number> = {
    primary: 0,
    accent: 1,
    secondary: 2,
    surface: 3,
    neutral: 4,
  };
  tokens.sort((a, b) => {
    const r = roleRank[a.role] - roleRank[b.role];
    return r !== 0 ? r : b.usage - a.usage;
  });

  // Re-name with a Tailwind-flavoured scale.
  const counters: Record<string, number> = {};
  tokens.forEach((t) => {
    counters[t.role] = (counters[t.role] ?? 0) + 1;
    t.name = nameForColor(t.hex, t.role, counters[t.role]);
  });

  // Deduplicate generated names (different shades can collide on the heuristic).
  const seen = new Map<string, number>();
  tokens.forEach((t) => {
    const count = seen.get(t.name);
    if (count !== undefined) {
      seen.set(t.name, count + 1);
      t.name = `${t.name}-${count + 1}`;
    } else {
      seen.set(t.name, 1);
    }
  });

  return tokens.slice(0, 24); // keep the panel readable
}

function finalizeTypography(
  map: Map<string, TypographyToken>,
): TypographyToken[] {
  const tokens = Array.from(map.values());
  tokens.sort((a, b) => b.fontSize - a.fontSize);

  // Assign semantic names based on size.
  const roles = [
    { name: "display", minSize: 48 },
    { name: "h1", minSize: 36 },
    { name: "h2", minSize: 28 },
    { name: "h3", minSize: 22 },
    { name: "h4", minSize: 18 },
    { name: "body", minSize: 14 },
    { name: "caption", minSize: 0 },
  ];
  const used = new Map<string, number>();
  tokens.forEach((t) => {
    const role = roles.find((r) => t.fontSize >= r.minSize)?.name ?? "body";
    const n = (used.get(role) ?? 0) + 1;
    used.set(role, n);
    t.name = n === 1 ? role : `${role}-${n}`;
  });
  return tokens.slice(0, 12);
}

function finalizeSpacing(map: Map<number, SpacingToken>): SpacingToken[] {
  return Array.from(map.values())
    .filter((t) => t.usage >= 2 || t.value <= 32) // single-use big numbers are usually one-offs
    .sort((a, b) => a.value - b.value)
    .slice(0, 16);
}

function finalizeRadii(map: Map<number, number>): RadiusToken[] {
  const named = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"];
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .slice(0, 8)
    .map(([value], i) => ({
      name: `radius-${named[i] ?? i}`,
      value,
    }));
}

function finalizeShadows(map: Map<string, number>): ShadowToken[] {
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([value], i) => ({
      name: `shadow-${["sm", "md", "lg", "xl", "2xl", "inner"][i] ?? i}`,
      value,
    }));
}

export function extractTokens(root: FigmaNode): DesignTokens {
  const acc = createAccumulator();
  visit(root, acc);
  return {
    colors: finalizeColors(acc.colors),
    typography: finalizeTypography(acc.typography),
    spacing: finalizeSpacing(acc.spacing),
    radii: finalizeRadii(acc.radii),
    shadows: finalizeShadows(acc.shadows),
  };
}
