/**
 * The design-token model — the shared vocabulary for "what does this Figma
 * file's design system look like." Both @forgeui/generate (to emit code) and
 * @forgeui/verify (to check a live page against it) speak this model.
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
