import type { FigmaNode } from "@forgeui/core/browser";
import { figmaColorToHex } from "@forgeui/core/browser";
import {
  pxToTailwindFontSize,
  pxToTailwindRadius,
  pxToTailwindSpacing,
  weightToTailwind,
} from "../tailwind-map.js";

/**
 * Compose Tailwind utility classes from a Figma node.
 *
 * The generator prefers Tailwind's scale (e.g. `p-4`) over arbitrary values
 * (`p-[16px]`) so the resulting code looks like something a human would write.
 * Arbitrary values are used only when the design is genuinely off-grid.
 */

interface BuildOptions {
  /** When true, emit layout + width/height. Off for inline children that should size to content. */
  includeLayout?: boolean;
}

export function buildTailwindClasses(
  node: FigmaNode,
  opts: BuildOptions = {},
): string {
  const classes: string[] = [];
  const { includeLayout = true } = opts;

  // --- Flex / Auto-layout -------------------------------------------------
  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    classes.push("flex");
    classes.push(node.layoutMode === "HORIZONTAL" ? "flex-row" : "flex-col");

    const justifyMap: Record<string, string> = {
      MIN: "justify-start",
      CENTER: "justify-center",
      MAX: "justify-end",
      SPACE_BETWEEN: "justify-between",
    };
    const alignMap: Record<string, string> = {
      MIN: "items-start",
      CENTER: "items-center",
      MAX: "items-end",
      BASELINE: "items-baseline",
    };
    if (node.primaryAxisAlignItems)
      classes.push(justifyMap[node.primaryAxisAlignItems] ?? "");
    if (node.counterAxisAlignItems)
      classes.push(alignMap[node.counterAxisAlignItems] ?? "");

    if (node.itemSpacing && node.itemSpacing > 0) {
      classes.push(`gap-${pxToTailwindSpacing(node.itemSpacing)}`);
    }
  }

  // --- Padding ------------------------------------------------------------
  const pt = node.paddingTop ?? 0;
  const pr = node.paddingRight ?? 0;
  const pb = node.paddingBottom ?? 0;
  const pl = node.paddingLeft ?? 0;
  if (pt && pt === pr && pr === pb && pb === pl) {
    classes.push(`p-${pxToTailwindSpacing(pt)}`);
  } else {
    if (pt && pt === pb) classes.push(`py-${pxToTailwindSpacing(pt)}`);
    else {
      if (pt) classes.push(`pt-${pxToTailwindSpacing(pt)}`);
      if (pb) classes.push(`pb-${pxToTailwindSpacing(pb)}`);
    }
    if (pl && pl === pr) classes.push(`px-${pxToTailwindSpacing(pl)}`);
    else {
      if (pl) classes.push(`pl-${pxToTailwindSpacing(pl)}`);
      if (pr) classes.push(`pr-${pxToTailwindSpacing(pr)}`);
    }
  }

  // --- Background fills ---------------------------------------------------
  const solidFill = node.fills?.find(
    (f) => f.type === "SOLID" && f.visible !== false && f.color,
  );
  if (solidFill?.color && node.type !== "TEXT") {
    classes.push(`bg-[${figmaColorToHex(solidFill.color)}]`);
  }

  // --- Text styling -------------------------------------------------------
  if (node.type === "TEXT" && node.style) {
    classes.push(pxToTailwindFontSize(node.style.fontSize));
    classes.push(weightToTailwind(node.style.fontWeight));
    const textColor = node.fills?.find(
      (f) => f.type === "SOLID" && f.color,
    )?.color;
    if (textColor) classes.push(`text-[${figmaColorToHex(textColor)}]`);

    const alignMap: Record<string, string> = {
      LEFT: "text-left",
      CENTER: "text-center",
      RIGHT: "text-right",
      JUSTIFIED: "text-justify",
    };
    if (node.style.textAlignHorizontal) {
      classes.push(alignMap[node.style.textAlignHorizontal] ?? "");
    }
    if (node.style.lineHeightPx && node.style.fontSize) {
      const ratio = node.style.lineHeightPx / node.style.fontSize;
      if (ratio <= 1.05) classes.push("leading-none");
      else if (ratio <= 1.2) classes.push("leading-tight");
      else if (ratio <= 1.4) classes.push("leading-snug");
      else if (ratio <= 1.6) classes.push("leading-normal");
      else if (ratio <= 1.8) classes.push("leading-relaxed");
      else classes.push("leading-loose");
    }
  }

  // --- Border -------------------------------------------------------------
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
    const w = Math.round(node.strokeWeight);
    classes.push(w === 1 ? "border" : `border-${w}`);
    const strokeColor = node.strokes[0]?.color;
    if (strokeColor) classes.push(`border-[${figmaColorToHex(strokeColor)}]`);
  }

  // --- Radius -------------------------------------------------------------
  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
    classes.push(pxToTailwindRadius(node.cornerRadius));
  }

  // --- Effects (shadow) ---------------------------------------------------
  const dropShadow = node.effects?.find(
    (e) => e.type === "DROP_SHADOW" && e.visible !== false,
  );
  if (dropShadow) {
    if (dropShadow.radius <= 4) classes.push("shadow-sm");
    else if (dropShadow.radius <= 10) classes.push("shadow");
    else if (dropShadow.radius <= 20) classes.push("shadow-lg");
    else classes.push("shadow-xl");
  }

  // --- Width/Height (only when meaningfully constrained) ------------------
  if (includeLayout && node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width > 0 && width < 400 && node.type !== "TEXT") {
      classes.push(`w-[${Math.round(width)}px]`);
    }
    if (height > 0 && height < 200 && node.type !== "TEXT") {
      classes.push(`h-[${Math.round(height)}px]`);
    }
  }

  return classes.filter(Boolean).join(" ");
}
