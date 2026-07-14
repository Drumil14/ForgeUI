/**
 * Barrel: the raw Figma REST types now live in @forgeui/core. Re-exported here
 * so the app's existing `@/types/figma` imports keep working unchanged.
 */
export type {
  NodeType,
  Color,
  Paint,
  Effect,
  TypeStyle,
  Rectangle,
  FigmaNode,
  FigmaFileResponse,
} from "@forgeui/core/browser";
