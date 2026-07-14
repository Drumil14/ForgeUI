/**
 * The verify data model.
 *
 * The pipeline is: extract (ComputedElement[]) → match (Violation[]) → report.
 * Everything here is plain data so the matcher is deterministic and unit-testable
 * without a browser.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComputedStyles {
  /** Resolved text color, as the browser reports it (`rgb(...)`/`rgba(...)`). */
  color: string;
  /** The element's own background color (may be transparent). */
  backgroundColor: string;
  /**
   * The nearest non-transparent background found walking up the ancestor chain.
   * Used for contrast so translucent/inherited backgrounds resolve correctly.
   */
  effectiveBackground: string;
  fontSize: number;
  fontWeight: number;
  /** Resolved line-height in px, or null when `normal`. */
  lineHeight: number | null;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  /** Flex/grid gap in px, or null when not applicable. */
  gap: number | null;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
}

export interface ComputedElement {
  /** A stable CSS selector path back to this element. */
  selector: string;
  tag: string;
  box: BoundingBox;
  /** Trimmed text this element directly renders (empty if none). */
  text: string;
  /** Whether this element directly renders visible text (drives contrast checks). */
  rendersText: boolean;
  styles: ComputedStyles;
}

export type ViolationType =
  | "spacing"
  | "radius"
  | "font-size"
  | "color"
  | "contrast";

export type Severity = "error" | "warning" | "info";

export interface NearestToken {
  name: string;
  value: string | number;
}

export interface Violation {
  id: string;
  type: ViolationType;
  severity: Severity;
  selector: string;
  /** The CSS property in question, e.g. "padding-left", "color", "font-size". */
  property: string;
  /** The found (off-token) value, formatted for display. */
  found: string;
  /** Human-readable one-liner, e.g. "found 13px, nearest token space-3 (12px)". */
  message: string;
  nearestToken?: NearestToken;
  /** Where to draw the overlay in the report. */
  box: BoundingBox;
}

export interface VerifyConfig {
  /** Ignore spacing/radius/font diffs at or under this many px. */
  tolerancePx: number;
  /** OKLab ΔE above which a rendered color counts as "not in the palette". */
  colorDeltaThreshold: number;
  /** Minimum WCAG contrast ratio for normal text (large text uses 3.0). */
  contrastMin: number;
  /** Selectors to skip entirely (matched by the extractor). */
  ignore: string[];
  /** Skip elements inside iframes / third-party embeds. */
  ignoreIframes: boolean;
  /** Max (error+warning) violations tolerated before the run fails CI. */
  budget: number;
  /** Per-type severity overrides. */
  severity: Partial<Record<ViolationType, Severity>>;
}

export const DEFAULT_SEVERITY: Record<ViolationType, Severity> = {
  contrast: "error",
  color: "warning",
  "font-size": "warning",
  spacing: "warning",
  radius: "info",
};

export const DEFAULT_CONFIG: VerifyConfig = {
  tolerancePx: 1,
  colorDeltaThreshold: 0.05,
  contrastMin: 4.5,
  ignore: [],
  ignoreIframes: true,
  budget: 0,
  severity: {},
};

export interface VerifyReport {
  url: string;
  fileKey: string;
  generatedAt: string;
  viewport: { width: number; height: number };
  config: VerifyConfig;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    byType: Record<ViolationType, number>;
    elementsChecked: number;
    overBudget: boolean;
  };
  violations: Violation[];
}
