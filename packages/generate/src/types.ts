import type { DesignTokens } from "@forgeui/core/browser";

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
}

export interface LayerNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  children?: LayerNode[];
}
