import type { Color } from "../figma/types.js";

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

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb | null {
  const clean = hex.replace("#", "").trim();
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

export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse any of the CSS color forms a browser's `getComputedStyle` emits:
 * `rgb(r, g, b)`, `rgba(r, g, b, a)`, and hex. Returns rgb plus alpha.
 * Non-solid / unparseable inputs (e.g. `transparent`, gradients) return null.
 */
export function parseCssColor(input: string): (Rgb & { a: number }) | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (value === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const rgbMatch = value.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/,
  );
  if (rgbMatch) {
    const a = rgbMatch[4]
      ? rgbMatch[4].endsWith("%")
        ? parseFloat(rgbMatch[4]) / 100
        : parseFloat(rgbMatch[4])
      : 1;
    return {
      r: Math.round(parseFloat(rgbMatch[1])),
      g: Math.round(parseFloat(rgbMatch[2])),
      b: Math.round(parseFloat(rgbMatch[3])),
      a,
    };
  }

  const rgb = hexToRgb(value);
  if (rgb) return { ...rgb, a: 1 };
  return null;
}

/** Relative luminance per WCAG 2.1, from 8-bit channels. */
export function relativeLuminanceRgb({ r, g, b }: Rgb): number {
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
  return contrastRatioRgb(a, b);
}

/** Contrast ratio between two rgb triples, per WCAG. Returns 1–21. */
export function contrastRatioRgb(a: Rgb, b: Rgb): number {
  const la = relativeLuminanceRgb(a);
  const lb = relativeLuminanceRgb(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Alpha-composite a (possibly translucent) foreground color over an opaque
 * background. Needed because a text color of rgba(0,0,0,.6) on white is not
 * actually black for contrast purposes.
 */
export function compositeOver(
  fg: Rgb & { a: number },
  bg: Rgb,
): Rgb {
  const blend = (f: number, b: number) => f * fg.a + b * (1 - fg.a);
  return {
    r: blend(fg.r, bg.r),
    g: blend(fg.g, bg.g),
    b: blend(fg.b, bg.b),
  };
}

// ---------------------------------------------------------------------------
// Perceptual color (OKLab)
//
// Comparing raw hex distance is perceptually wrong — a small hex delta in one
// hue region reads very differently from the same delta elsewhere. OKLab is a
// modern, perceptually-uniform space, so Euclidean distance in OKLab is a good
// "do these two colors look like the same design token?" metric. verify uses
// this to decide whether a rendered color is a legitimate palette color or a
// rogue one.
// ---------------------------------------------------------------------------

export interface Oklab {
  L: number;
  a: number;
  b: number;
}

function srgbChannelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function rgbToOklab({ r, g, b }: Rgb): Oklab {
  const lr = srgbChannelToLinear(r);
  const lg = srgbChannelToLinear(g);
  const lb = srgbChannelToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** Perceptual distance (OKLab ΔE) between two rgb colors. ~0 = identical. */
export function oklabDistance(a: Rgb, b: Rgb): number {
  const oa = rgbToOklab(a);
  const ob = rgbToOklab(b);
  return Math.sqrt(
    (oa.L - ob.L) ** 2 + (oa.a - ob.a) ** 2 + (oa.b - ob.b) ** 2,
  );
}

/** Perceptual distance between two hex colors. Returns Infinity if unparseable. */
export function oklabHexDistance(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return Infinity;
  return oklabDistance(a, b);
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
