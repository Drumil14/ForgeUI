/**
 * Internal types for the parsed/generated representation of a Figma file.
 *
 * The Figma API gives us a raw node tree. ForgeUI transforms it into:
 *   - DesignTokens: extracted, deduplicated design primitives
 *   - GeneratedComponent: synthesized React + Tailwind source
 *   - AccessibilityReport: heuristic audit of the generated output
 *
 * Keeping these shapes separate from the raw Figma types means the rest of the
 * app never has to think about Figma's quirks.
 */

export interface ColorToken {
  /** A short, semantic-feeling name like "brand-500" or "neutral-900". */
  name: string;
  /** CSS hex, always lowercase. */
  hex: string;
  /** rgba() string for transparency-aware contexts. */
  rgba: string;
  /** How many times this color was seen across the parsed tree. */
  usage: number;
  /** Heuristic role we assigned to help users find the right token fast. */
  role: "primary" | "secondary" | "neutral" | "accent" | "surface";
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  letterSpacing?: number;
  usage: number;
}

export interface SpacingToken {
  name: string;
  value: number;
  usage: number;
}

export interface RadiusToken {
  name: string;
  value: number;
}

export interface ShadowToken {
  name: string;
  value: string;
}

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  radii: RadiusToken[];
  shadows: ShadowToken[];
}

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

export type Viewport = "desktop" | "tablet" | "mobile";

export interface WorkspaceState {
  selectedComponentId: string | null;
  viewport: Viewport;
  zoom: number;
  sidebarTab: SidebarTab;
}

export type SidebarTab =
  | "project"
  | "pages"
  | "layers"
  | "assets"
  | "components"
  | "tokens";
