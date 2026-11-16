import type { Violation } from "../types.js";

/**
 * Deterministic fix suggestions for a violation: a CSS declaration and, where
 * it maps cleanly, the equivalent Tailwind utility. Pure data-in/data-out so
 * the web report viewer, the HTML report, and tests all agree.
 */

export interface FixSuggestion {
  /** A CSS declaration that moves the value onto the design scale. */
  css?: string;
  /** The equivalent Tailwind utility, when one exists. */
  tailwind?: string;
  /** Human guidance for cases that need judgement (e.g. contrast). */
  note: string;
}

const SPACING_PREFIX: Record<string, string> = {
  "padding-top": "pt",
  "padding-right": "pr",
  "padding-bottom": "pb",
  "padding-left": "pl",
  "margin-top": "mt",
  "margin-right": "mr",
  "margin-bottom": "mb",
  "margin-left": "ml",
  gap: "gap",
};

const RADIUS_PREFIX: Record<string, string> = {
  "border-radius": "rounded",
  "border-top-left-radius": "rounded-tl",
  "border-top-right-radius": "rounded-tr",
  "border-bottom-left-radius": "rounded-bl",
  "border-bottom-right-radius": "rounded-br",
};

const FONT_SIZES: Array<[number, string]> = [
  [12, "text-xs"],
  [14, "text-sm"],
  [16, "text-base"],
  [18, "text-lg"],
  [20, "text-xl"],
  [24, "text-2xl"],
  [30, "text-3xl"],
  [36, "text-4xl"],
  [48, "text-5xl"],
  [60, "text-6xl"],
];

const RADII: Array<[number, string]> = [
  [2, "-sm"],
  [4, ""],
  [6, "-md"],
  [8, "-lg"],
  [12, "-xl"],
  [16, "-2xl"],
  [24, "-3xl"],
  [9999, "-full"],
];

function parsePx(value: string | number | undefined): number | null {
  if (value === undefined) return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function spacingClass(prefix: string, px: number): string {
  if (px === 1) return `${prefix}-px`;
  if (px % 4 === 0 && px / 4 <= 96) return `${prefix}-${px / 4}`;
  if (px === 2) return `${prefix}-0.5`;
  if (px === 6) return `${prefix}-1.5`;
  if (px === 10) return `${prefix}-2.5`;
  if (px === 14) return `${prefix}-3.5`;
  return `${prefix}-[${px}px]`;
}

function radiusClass(prefix: string, px: number): string {
  const exact = RADII.find(([v]) => v === px);
  if (exact) return `${prefix}${exact[1]}`;
  return `${prefix}-[${px}px]`;
}

function fontSizeClass(px: number): string {
  const exact = FONT_SIZES.find(([v]) => v === px);
  if (exact) return exact[1];
  return `text-[${px}px]`;
}

export function suggestFix(violation: Violation): FixSuggestion {
  const token = violation.nearestToken;

  switch (violation.type) {
    case "spacing": {
      const px = parsePx(token?.value);
      const prefix = SPACING_PREFIX[violation.property];
      if (px === null || !prefix) {
        return { note: "Align this value to the nearest spacing token." };
      }
      return {
        css: `${violation.property}: ${px}px;`,
        tailwind: spacingClass(prefix, px),
        note: `Replace ${violation.found} with the ${token!.name} token (${px}px).`,
      };
    }
    case "radius": {
      const px = parsePx(token?.value);
      const prefix = RADIUS_PREFIX[violation.property] ?? "rounded";
      if (px === null) {
        return { note: "Align this radius to the nearest radius token." };
      }
      return {
        css: `${violation.property}: ${px}px;`,
        tailwind: radiusClass(prefix, px),
        note: `Replace ${violation.found} with the ${token!.name} token (${px}px).`,
      };
    }
    case "font-size": {
      const px = parsePx(token?.value);
      if (px === null) {
        return { note: "Align this size to the nearest type-scale token." };
      }
      return {
        css: `font-size: ${px}px;`,
        tailwind: fontSizeClass(px),
        note: `Replace ${violation.found} with the ${token!.name} step (${px}px).`,
      };
    }
    case "color": {
      const hex = typeof token?.value === "string" ? token.value : null;
      if (!hex) return { note: "Use a color from the design palette." };
      const isBg = violation.property === "background-color";
      return {
        css: `${violation.property}: ${hex};`,
        tailwind: `${isBg ? "bg" : "text"}-[${hex}]`,
        note: `Replace ${violation.found} with palette token ${token!.name} (${hex}).`,
      };
    }
    case "contrast": {
      return {
        note:
          "Contrast fix needs a design decision: darken the text or lighten the background until the ratio clears the WCAG AA threshold shown in the message. Prefer the nearest darker/lighter step of the same palette ramp.",
      };
    }
  }
}
