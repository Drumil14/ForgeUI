import type { FigmaNode } from "@/types/figma";
import type { ComponentKind } from "@/types";

/**
 * Identify what kind of UI element a Figma node represents.
 *
 * We combine three signals:
 *   1. Name hints — designers usually name layers semantically.
 *   2. Structural shape — auto-layout direction, child count, dimensions.
 *   3. Content type — is it text? does it have a fill?
 *
 * This is heuristic by design. Figma doesn't tell us "this is a button"; it
 * tells us "this is a frame with auto-layout containing a TEXT node." We
 * translate that.
 */

const NAME_HINTS: Array<{ kind: ComponentKind; patterns: RegExp[] }> = [
  { kind: "Button", patterns: [/btn/i, /button/i, /cta/i] },
  { kind: "Input", patterns: [/input/i, /field/i, /textfield/i, /textarea/i] },
  { kind: "Badge", patterns: [/badge/i, /tag/i, /chip/i, /pill/i] },
  { kind: "Card", patterns: [/card/i, /tile/i] },
  {
    kind: "Navbar",
    patterns: [/nav/i, /navbar/i, /header/i, /topbar/i, /menu/i],
  },
  { kind: "Footer", patterns: [/footer/i] },
  { kind: "Hero", patterns: [/hero/i, /banner/i, /jumbotron/i] },
  { kind: "Section", patterns: [/section/i, /block/i] },
  { kind: "Icon", patterns: [/icon/i, /^ic[-_]/i] },
];

export function classifyComponent(node: FigmaNode): ComponentKind {
  // 1. Name-based — most reliable when designers have been careful.
  const name = node.name ?? "";
  for (const { kind, patterns } of NAME_HINTS) {
    if (patterns.some((p) => p.test(name))) return kind;
  }

  // 2. Structural shape.
  if (node.type === "TEXT") return "Text";
  if (node.type === "RECTANGLE" || node.type === "ELLIPSE") return "Image";
  if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION")
    return "Icon";

  const w = node.absoluteBoundingBox?.width ?? 0;
  const h = node.absoluteBoundingBox?.height ?? 0;
  const aspect = h > 0 ? w / h : 1;

  // Button-ish: short, wide, has horizontal auto-layout and contains text
  if (
    node.layoutMode === "HORIZONTAL" &&
    h > 0 &&
    h < 64 &&
    aspect > 1.5 &&
    aspect < 8 &&
    node.children?.some((c) => c.type === "TEXT")
  ) {
    return "Button";
  }

  // Navbar-ish: very wide, short, near the top
  if (aspect > 8 && h < 120) {
    return "Navbar";
  }

  // Hero-ish: full-width, tall section near the top
  if (w >= 1000 && h >= 400 && (node.absoluteBoundingBox?.y ?? 0) < 800) {
    return "Hero";
  }

  // Card: a contained, multi-child rounded thing
  if (
    node.children &&
    node.children.length >= 2 &&
    (node.cornerRadius ?? 0) > 4 &&
    w < 600
  ) {
    return "Card";
  }

  // Fallback: a layout container or generic section
  if (node.children && node.children.length > 0) return "Section";
  return "Container";
}
