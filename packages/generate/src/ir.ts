import type { FigmaNode } from "@forgeui/core/browser";
import { figmaColorToHex } from "@forgeui/core/browser";
import { buildTailwindClasses } from "./generator/build-classes.js";

/**
 * The Design IR — a framework-neutral intermediate representation of a Figma
 * subtree. It is the single shared source that code generation derives from,
 * and it travels with each GeneratedComponent so inspectors, exporters, and
 * tests can all reason about the same structure the code was generated from.
 *
 *   Figma node ──► IRNode ──► TSX source ──► (transpiled) sandboxed preview
 *
 * The preview renders the *generated source itself*, so preview and export can
 * never disagree; the IR is what guarantees the generated source reflects the
 * design's actual hierarchy rather than a hardcoded template.
 */

export interface IRPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IRLayout {
  direction: "row" | "column";
  gap: number;
  padding: IRPadding;
  justify?: "start" | "center" | "end" | "between";
  align?: "start" | "center" | "end" | "baseline";
}

export interface IRTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx?: number;
  textAlign?: "left" | "center" | "right" | "justify";
}

export interface IRNode {
  /** Identity of the Figma node this came from. */
  sourceNodeId: string;
  name: string;
  /** What this node *is*, independent of how Figma stores it. */
  role: "container" | "text" | "image" | "vector";
  /** Auto-layout, when the node has it. */
  layout?: IRLayout;
  /** Design-time size, when meaningfully constrained. */
  size?: { width: number; height: number };
  /** Solid background fill (hex), if any. */
  fill?: string;
  /** Text color (hex) for text nodes. */
  textColor?: string;
  /** Uniform corner radius in px. */
  radius?: number;
  typography?: IRTypography;
  /** Text content for text nodes. */
  text?: string;
  /** Figma component instance reference (nested component / variant source). */
  componentId?: string;
  /**
   * The Tailwind classes derived from this node — the same derivation the
   * code generator emits, so IR consumers and generated code agree.
   */
  classes: string;
  children: IRNode[];
  /** True when children were truncated by depth/breadth caps. */
  truncated?: boolean;
}

export interface BuildIROptions {
  maxDepth?: number;
  maxChildren?: number;
}

function roleOf(node: FigmaNode): IRNode["role"] {
  if (node.type === "TEXT") return "text";
  if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION")
    return "vector";
  if (
    (node.type === "RECTANGLE" || node.type === "ELLIPSE") &&
    node.fills?.some((f) => f.type === "IMAGE")
  )
    return "image";
  return "container";
}

const JUSTIFY: Record<string, IRLayout["justify"]> = {
  MIN: "start",
  CENTER: "center",
  MAX: "end",
  SPACE_BETWEEN: "between",
};
const ALIGN: Record<string, IRLayout["align"]> = {
  MIN: "start",
  CENTER: "center",
  MAX: "end",
  BASELINE: "baseline",
};
const TEXT_ALIGN: Record<string, IRTypography["textAlign"]> = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
  JUSTIFIED: "justify",
};

export function buildIR(
  node: FigmaNode,
  opts: BuildIROptions = {},
  depth = 0,
): IRNode {
  const { maxDepth = 6, maxChildren = 12 } = opts;

  const ir: IRNode = {
    sourceNodeId: node.id,
    name: node.name,
    role: roleOf(node),
    classes: buildTailwindClasses(node, { includeLayout: depth === 0 }),
    children: [],
  };

  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    ir.layout = {
      direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
      gap: node.itemSpacing ?? 0,
      padding: {
        top: node.paddingTop ?? 0,
        right: node.paddingRight ?? 0,
        bottom: node.paddingBottom ?? 0,
        left: node.paddingLeft ?? 0,
      },
      justify: node.primaryAxisAlignItems
        ? JUSTIFY[node.primaryAxisAlignItems]
        : undefined,
      align: node.counterAxisAlignItems
        ? ALIGN[node.counterAxisAlignItems]
        : undefined,
    };
  }

  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width > 0 && height > 0) {
      ir.size = { width: Math.round(width), height: Math.round(height) };
    }
  }

  const solidFill = node.fills?.find(
    (f) => f.type === "SOLID" && f.visible !== false && f.color,
  );
  if (solidFill?.color) {
    const hex = figmaColorToHex(solidFill.color);
    if (node.type === "TEXT") ir.textColor = hex;
    else ir.fill = hex;
  }

  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
    ir.radius = node.cornerRadius;
  }

  if (node.type === "TEXT") {
    ir.text = node.characters ?? "";
    if (node.style) {
      ir.typography = {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        lineHeightPx: node.style.lineHeightPx,
        textAlign: node.style.textAlignHorizontal
          ? TEXT_ALIGN[node.style.textAlignHorizontal]
          : undefined,
      };
    }
  }

  if (node.componentId) ir.componentId = node.componentId;

  if (node.children && depth < maxDepth) {
    const visible = node.children.filter((c) => c.visible !== false);
    for (const child of visible.slice(0, maxChildren)) {
      ir.children.push(buildIR(child, opts, depth + 1));
    }
    if (visible.length > maxChildren) ir.truncated = true;
  } else if (node.children && node.children.length > 0) {
    ir.truncated = true;
  }

  return ir;
}
