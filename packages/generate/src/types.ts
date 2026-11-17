import type { DesignTokens } from "@forgeui/core/browser";
import type { IRNode } from "./ir.js";

/**
 * Types for the generated / analyzed representation of a Figma file. The token
 * model itself lives in @forgeui/core; these are the generate-specific shapes.
 */

export type ComponentKind =
  | "Button"
  | "Card"
  | "Navbar"
  | "Hero"
  | "Footer"
  | "Input"
  | "Badge"
  | "Container"
  | "Text"
  | "Image"
  | "Icon"
  | "Section";

/**
 * Where a component came from:
 *  - "extracted"   — promoted from a Figma node the designer named semantically
 *                    (e.g. a layer called "Button/Primary").
 *  - "inferred"    — promoted from a Figma node classified by structural
 *                    heuristics (shape, auto-layout, children) rather than name.
 *  - "synthesized" — not in the Figma file at all; a demonstration example
 *                    built from the file's extracted tokens.
 */
export type ComponentOrigin = "extracted" | "inferred" | "synthesized";

export interface GeneratedComponent {
  id: string;
  name: string;
  kind: ComponentKind;
  /** Final JSX/TSX source ready for the user to copy. */
  source: string;
  /** The Tailwind classes used on the root element. */
  classes: string;
  /** Props inferred from the design. */
  props: ComponentProp[];
  /** Children rendered inside this component, if any. */
  children?: GeneratedComponent[];
  /** Optional preview text or content lifted from the design. */
  content?: string;
  /** How this component entered the library. */
  origin: ComponentOrigin;
  /** The Figma node this was generated from (absent for synthesized examples). */
  sourceNodeId?: string;
  /** The Figma page (CANVAS) the source node lives on. */
  pageId?: string;
  pageName?: string;
  /**
   * The Design IR this component's source was generated from (absent for
   * synthesized examples, which have no Figma subtree).
   */
  ir?: IRNode;
}

export interface ComponentProp {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export type A11ySeverity = "error" | "warning" | "info" | "pass";

export interface A11yIssue {
  id: string;
  severity: A11ySeverity;
  category:
    | "contrast"
    | "heading"
    | "label"
    | "aria"
    | "keyboard"
    | "semantic";
  title: string;
  description: string;
  /** Optional component name this issue is attached to. */
  componentName?: string;
}

export interface A11yReport {
  score: number; // 0–100
  issues: A11yIssue[];
  summary: {
    errors: number;
    warnings: number;
    passes: number;
  };
}

/** An exportable asset discovered in the file (bitmap image or vector/icon). */
export interface DesignAsset {
  nodeId: string;
  name: string;
  kind: "image" | "vector";
  pageName?: string;
  width?: number;
  height?: number;
  /**
   * Temporary Figma CDN render URL, resolved server-side via the Images API
   * when a server API key is configured. Absent for fixture imports.
   */
  url?: string;
}

/** What the parser saw — including what it could NOT translate. */
export interface ParseStats {
  totalNodes: number;
  byType: Record<string, number>;
  /** Features present in the file that ForgeUI does not (fully) translate. */
  unsupported: Array<{ feature: string; count: number }>;
}

export interface ParsedDesign {
  fileName: string;
  fileKey: string;
  lastModified: string;
  tokens: DesignTokens;
  components: GeneratedComponent[];
  /** Top-level pages (Figma canvases). */
  pages: Array<{ id: string; name: string; componentIds: string[] }>;
  layerTree: LayerNode[];
  accessibility: A11yReport;
  assets: DesignAsset[];
  stats: ParseStats;
}

export interface LayerNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  children?: LayerNode[];
}
