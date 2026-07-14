/**
 * Barrel for the app's `@/types` imports.
 *
 * The design-token model lives in @forgeui/core and the generated/analyzed
 * shapes live in @forgeui/generate. The purely UI-side workspace types (which
 * only the Next.js app cares about) stay here.
 */

export type {
  ColorToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ShadowToken,
  DesignTokens,
} from "@forgeui/core";

export type {
  ComponentKind,
  GeneratedComponent,
  ComponentProp,
  A11ySeverity,
  A11yIssue,
  A11yReport,
  ParsedDesign,
  LayerNode,
} from "@forgeui/generate";

// --- App-only workspace UI state -----------------------------------------

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
