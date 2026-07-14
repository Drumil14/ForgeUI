import type { Color } from "@/types/figma";

/** Convert Figma's 0–1 RGB to a hex string. */
export function figmaColorToHex(c: Color): string {
  const to255 = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255);
  const toHex = (n: number) => to255(n).toString(16).padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

export function figmaColorToRgba(c: Color, opacityOverride?: number): string {
  const a = opacityOverride ?? c.a;
  const to255 = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255);
  return `rgba(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)}, ${a.toFixed(2)})`;
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6 && clean.length !== 3) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/** Relative luminance per WCAG 2.1. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two hex colors, per WCAG. Returns 1–21. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 1;
  const la = relativeLuminance(a.r, a.g, a.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Classify a color's role from its HSL position.
 * Vivid hues → primary/accent. Greys → neutral. Light backgrounds → surface.
 */
export function classifyColor(
  hex: string,
): "primary" | "secondary" | "neutral" | "accent" | "surface" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "neutral";
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (s < 0.08) {
    return l > 0.9 ? "surface" : "neutral";
  }
  if (l > 0.85) return "surface";
  if (s > 0.6) return "primary";
  return "secondary";
}

/** Heuristic name for a color, used as the token key. */
export function nameForColor(hex: string, role: string, index: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `${role}-${index}`;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  // Map luminance to a 50–950 scale, like Tailwind.
  const scale = Math.round((1 - l) * 9) * 100;
  const shade = scale === 0 ? 50 : Math.max(100, Math.min(950, scale));
  return `${role}-${shade}`;
}
