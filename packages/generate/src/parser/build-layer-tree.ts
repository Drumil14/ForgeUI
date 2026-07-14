import type { FigmaNode } from "@forgeui/core/browser";
import type { LayerNode } from "../types.js";

const MAX_DEPTH = 6;
const MAX_CHILDREN_PER_NODE = 50;

/**
 * Build a flattened representation of the Figma tree for the Layers panel.
 * We cap depth and breadth so very large files stay performant.
 */
export function buildLayerTree(root: FigmaNode, depth = 0): LayerNode[] {
  if (depth > MAX_DEPTH) return [];
  const children = (root.children ?? [])
    .filter((c) => c.visible !== false)
    .slice(0, MAX_CHILDREN_PER_NODE);

  return children.map((child) => ({
    id: child.id,
    name: child.name || child.type,
    type: child.type,
    depth,
    children:
      child.children && child.children.length > 0
        ? buildLayerTree(child, depth + 1)
        : undefined,
  }));
}
