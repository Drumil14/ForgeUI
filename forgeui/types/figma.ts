/**
 * Figma REST API type definitions.
 * Reference: https://www.figma.com/developers/api
 *
 * These cover only the subset of fields ForgeUI consumes — keeping the surface
 * small makes parsing predictable and the code easier to follow.
 */

export type NodeType =
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "SECTION"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "STAR"
  | "LINE"
  | "ELLIPSE"
  | "REGULAR_POLYGON"
  | "RECTANGLE"
  | "TEXT"
  | "SLICE"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE";

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Paint {
  type:
    | "SOLID"
    | "GRADIENT_LINEAR"
    | "GRADIENT_RADIAL"
    | "GRADIENT_ANGULAR"
    | "GRADIENT_DIAMOND"
    | "IMAGE";
  visible?: boolean;
  opacity?: number;
  color?: Color;
  gradientStops?: Array<{ position: number; color: Color }>;
}

export interface Effect {
  type: "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible?: boolean;
  radius: number;
  color?: Color;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  textAlignHorizontal?: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration?: "NONE" | "STRIKETHROUGH" | "UNDERLINE";
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  visible?: boolean;
  children?: FigmaNode[];

  // Layout
  absoluteBoundingBox?: Rectangle;
  size?: { x: number; y: number };
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // Painting
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: Effect[];

  // Text
  characters?: string;
  style?: TypeStyle;

  // Components
  componentId?: string;
}

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
  version: string;
  document: FigmaNode;
  components: Record<
    string,
    { key: string; name: string; description: string }
  >;
  styles: Record<
    string,
    { key: string; name: string; styleType: string; description: string }
  >;
}
