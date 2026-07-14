import type { DesignTokens } from "@forgeui/core";
import {
  hexToRgb,
  parseCssColor,
  oklabDistance,
  contrastRatioRgb,
  compositeOver,
  rgbToHex,
  type Rgb,
} from "@forgeui/core";
import type {
  ComputedElement,
  Severity,
  Violation,
  ViolationType,
  VerifyConfig,
} from "../types.js";
import { DEFAULT_CONFIG, DEFAULT_SEVERITY } from "../types.js";
import { buildScales, offScale, nearestStep, type TokenScales } from "./scales.js";

function formatPx(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}px`;
}

function severityFor(type: ViolationType, config: VerifyConfig): Severity {
  return config.severity[type] ?? DEFAULT_SEVERITY[type];
}

function isIgnored(selector: string, ignore: string[]): boolean {
  return ignore.some((pat) => pat.length > 0 && selector.includes(pat));
}

/** Nearest palette color (by OKLab distance) to an rgb value. */
function nearestPalette(
  rgb: Rgb,
  scales: TokenScales,
): { name: string; hex: string; distance: number } | null {
  if (scales.palette.length === 0) return null;
  let best = scales.palette[0];
  let bestD = oklabDistance(rgb, best.rgb);
  for (const p of scales.palette) {
    const d = oklabDistance(rgb, p.rgb);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return { name: best.name, hex: rgbToHex(best.rgb), distance: bestD };
}

/**
 * Resolve an element's foreground/background to opaque rgb for contrast and
 * palette checks. Translucent colors are composited over the effective bg.
 */
function resolveColor(css: string, backdrop: Rgb): (Rgb & { opaque: boolean }) | null {
  const parsed = parseCssColor(css);
  if (!parsed) return null;
  if (parsed.a <= 0.02) return null; // fully transparent — nothing to check
  if (parsed.a >= 0.999) return { ...parsed, opaque: true };
  const composited = compositeOver(parsed, backdrop);
  return { ...composited, opaque: false };
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

function backdropRgb(el: ComputedElement): Rgb {
  const bg = parseCssColor(el.styles.effectiveBackground);
  if (bg && bg.a > 0.02) return { r: bg.r, g: bg.g, b: bg.b };
  return WHITE; // pages render on white by default
}

function checkSpacing(
  el: ComputedElement,
  scales: TokenScales,
  config: VerifyConfig,
  emit: (v: Omit<Violation, "id">) => void,
): void {
  const s = el.styles;
  const entries: Array<[string, number]> = [
    ["padding-top", s.paddingTop],
    ["padding-right", s.paddingRight],
    ["padding-bottom", s.paddingBottom],
    ["padding-left", s.paddingLeft],
    ["margin-top", s.marginTop],
    ["margin-right", s.marginRight],
    ["margin-bottom", s.marginBottom],
    ["margin-left", s.marginLeft],
  ];
  if (s.gap !== null) entries.push(["gap", s.gap]);

  for (const [property, value] of entries) {
    // Ignore zero, negative (layout offsets), and sub-tolerance values.
    if (!Number.isFinite(value) || value <= config.tolerancePx) continue;
    const nearest = offScale(value, scales.spacing, config.tolerancePx);
    if (!nearest) continue;
    emit({
      type: "spacing",
      severity: severityFor("spacing", config),
      selector: el.selector,
      property,
      found: formatPx(value),
      message: `${property} is ${formatPx(value)}, off the spacing scale — nearest token ${nearest.name} (${formatPx(Number(nearest.value))})`,
      nearestToken: { name: nearest.name, value: formatPx(Number(nearest.value)) },
      box: el.box,
    });
  }
}

function checkRadius(
  el: ComputedElement,
  scales: TokenScales,
  config: VerifyConfig,
  emit: (v: Omit<Violation, "id">) => void,
): void {
  const s = el.styles;
  const corners: Array<[string, number]> = [
    ["border-top-left-radius", s.borderTopLeftRadius],
    ["border-top-right-radius", s.borderTopRightRadius],
    ["border-bottom-left-radius", s.borderBottomLeftRadius],
    ["border-bottom-right-radius", s.borderBottomRightRadius],
  ];
  // Only inspect distinct positive radii, so a uniform radius reports once.
  const seen = new Set<number>();
  for (const [property, value] of corners) {
    if (!Number.isFinite(value) || value <= config.tolerancePx) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    // Pill/full radii: a large radius maps to the largest radius token.
    if (value >= 100 && scales.maxRadius >= 100) continue;
    const nearest = offScale(value, scales.radius, config.tolerancePx);
    if (!nearest) continue;
    emit({
      type: "radius",
      severity: severityFor("radius", config),
      selector: el.selector,
      property,
      found: formatPx(value),
      message: `${property} is ${formatPx(value)}, off the radius scale — nearest token ${nearest.name} (${formatPx(Number(nearest.value))})`,
      nearestToken: { name: nearest.name, value: formatPx(Number(nearest.value)) },
      box: el.box,
    });
  }
}

function checkFontSize(
  el: ComputedElement,
  scales: TokenScales,
  config: VerifyConfig,
  emit: (v: Omit<Violation, "id">) => void,
): void {
  if (!el.rendersText) return;
  const value = el.styles.fontSize;
  if (!Number.isFinite(value) || value <= 0) return;
  if (scales.fontSize.length === 0) return;
  const nearest = offScale(value, scales.fontSize, Math.max(config.tolerancePx, 0.5));
  if (!nearest) return;
  emit({
    type: "font-size",
    severity: severityFor("font-size", config),
    selector: el.selector,
    property: "font-size",
    found: formatPx(value),
    message: `font-size is ${formatPx(value)}, off the type scale — nearest token ${nearest.name} (${formatPx(Number(nearest.value))})`,
    nearestToken: { name: nearest.name, value: formatPx(Number(nearest.value)) },
    box: el.box,
  });
}

function checkColors(
  el: ComputedElement,
  scales: TokenScales,
  config: VerifyConfig,
  emit: (v: Omit<Violation, "id">) => void,
): void {
  const backdrop = backdropRgb(el);

  // Text color — only meaningful where the element renders text.
  if (el.rendersText) {
    const fg = resolveColor(el.styles.color, backdrop);
    if (fg) {
      const near = nearestPalette(fg, scales);
      if (near && near.distance > config.colorDeltaThreshold) {
        emit({
          type: "color",
          severity: severityFor("color", config),
          selector: el.selector,
          property: "color",
          found: rgbToHex(fg),
          message: `text color ${rgbToHex(fg)} is not in the palette — nearest is ${near.name} (${near.hex}, ΔE ${near.distance.toFixed(3)})`,
          nearestToken: { name: near.name, value: near.hex },
          box: el.box,
        });
      }
    }
  }

  // Background color — only opaque-ish backgrounds are worth checking.
  const bgParsed = parseCssColor(el.styles.backgroundColor);
  if (bgParsed && bgParsed.a > 0.5) {
    const bg = resolveColor(el.styles.backgroundColor, backdrop);
    if (bg) {
      const near = nearestPalette(bg, scales);
      if (near && near.distance > config.colorDeltaThreshold) {
        emit({
          type: "color",
          severity: severityFor("color", config),
          selector: el.selector,
          property: "background-color",
          found: rgbToHex(bg),
          message: `background ${rgbToHex(bg)} is not in the palette — nearest is ${near.name} (${near.hex}, ΔE ${near.distance.toFixed(3)})`,
          nearestToken: { name: near.name, value: near.hex },
          box: el.box,
        });
      }
    }
  }
}

function checkContrast(
  el: ComputedElement,
  config: VerifyConfig,
  emit: (v: Omit<Violation, "id">) => void,
): void {
  if (!el.rendersText || el.text.trim().length === 0) return;
  const backdrop = backdropRgb(el);
  const fg = resolveColor(el.styles.color, backdrop);
  if (!fg) return;

  const ratio = contrastRatioRgb(fg, backdrop);
  const largeText =
    el.styles.fontSize >= 24 ||
    (el.styles.fontSize >= 18.66 && el.styles.fontWeight >= 700);
  const min = largeText ? 3.0 : config.contrastMin;
  if (ratio >= min) return;

  emit({
    type: "contrast",
    severity: severityFor("contrast", config),
    selector: el.selector,
    property: "color",
    found: `${ratio.toFixed(2)}:1`,
    message: `text contrast ${ratio.toFixed(2)}:1 fails WCAG AA (needs ${min.toFixed(1)}:1) — ${rgbToHex(fg)} on ${rgbToHex(backdrop)}`,
    nearestToken: { name: `min ${min.toFixed(1)}:1`, value: `${ratio.toFixed(2)}:1` },
    box: el.box,
  });
}

/**
 * The deterministic matching engine. Given the elements extracted from a page
 * and the Figma design tokens, produce the exact set of violations. No LLM, no
 * randomness — the same input always yields the same output.
 */
export function matchPage(
  elements: ComputedElement[],
  tokens: DesignTokens,
  userConfig: Partial<VerifyConfig> = {},
): Violation[] {
  const config: VerifyConfig = { ...DEFAULT_CONFIG, ...userConfig, severity: { ...userConfig.severity } };
  const scales = buildScales(tokens, hexToRgb);
  const violations: Violation[] = [];
  let counter = 0;

  for (const el of elements) {
    if (isIgnored(el.selector, config.ignore)) continue;
    if (el.box.width <= 0 || el.box.height <= 0) continue;

    const emit = (v: Omit<Violation, "id">) => {
      violations.push({ ...v, id: `v${++counter}` });
    };

    checkSpacing(el, scales, config, emit);
    checkRadius(el, scales, config, emit);
    checkFontSize(el, scales, config, emit);
    checkColors(el, scales, config, emit);
    checkContrast(el, config, emit);
  }

  return violations;
}

export { buildScales, offScale, nearestStep };
