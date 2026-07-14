import type { FigmaFileResponse, FigmaNode } from "@/types/figma";
import type {
  ComponentKind,
  GeneratedComponent,
  ParsedDesign,
} from "@/types";
import { extractTokens } from "./extract-tokens";
import { classifyComponent } from "./classify-component";
import { buildLayerTree } from "./build-layer-tree";
import {
  generateComponent,
  resetIdCounter,
} from "../generator/generate-component";
import { analyzeAccessibility } from "../analyzer/accessibility";
import { synthesizePlaceholderComponents } from "./placeholder";

/**
 * Walk the file's top-level frames and turn each one into a GeneratedComponent.
 *
 * Strategy:
 *   - For each page (CANVAS), iterate top-level frames.
 *   - Promote any "interesting" descendant (button, card, hero, etc.) into its
 *     own GeneratedComponent so the user gets a real component library, not a
 *     single monolithic blob.
 */
function collectGenerableNodes(root: FigmaNode, out: FigmaNode[]): void {
  if (root.visible === false) return;

  const kind = classifyComponent(root);
  const isPromotable: ComponentKind[] = [
    "Button",
    "Card",
    "Input",
    "Badge",
    "Navbar",
    "Footer",
    "Hero",
  ];
  if (isPromotable.includes(kind)) {
    out.push(root);
    // Don't descend into a promoted node — we've already captured it.
    return;
  }

  if (root.children) {
    for (const c of root.children) collectGenerableNodes(c, out);
  }
}

function buildPages(
  file: FigmaFileResponse,
  components: GeneratedComponent[],
): ParsedDesign["pages"] {
  const canvases = (file.document.children ?? []).filter(
    (c) => c.type === "CANVAS",
  );
  return canvases.map((canvas) => ({
    id: canvas.id,
    name: canvas.name,
    componentIds: components.map((c) => c.id), // every page sees all components
  }));
}

export function parseFigmaFile(
  file: FigmaFileResponse,
  fileKey: string,
): ParsedDesign {
  resetIdCounter();

  // 1. Tokens — always extract from the full tree.
  const tokens = extractTokens(file.document);

  // 2. Components — walk the tree and promote interesting nodes.
  const candidates: FigmaNode[] = [];
  collectGenerableNodes(file.document, candidates);

  let components = candidates.slice(0, 24).map((n) => generateComponent(n));

  // Deduplicate by name to avoid 14 identical Button components.
  const seenNames = new Map<string, number>();
  components = components.map((c) => {
    const count = seenNames.get(c.name);
    if (count !== undefined) {
      seenNames.set(c.name, count + 1);
      return { ...c, name: `${c.name}${count + 1}` };
    }
    seenNames.set(c.name, 1);
    return c;
  });

  // 3. If the file produced an empty or thin set, top it up with realistic
  //    placeholders derived from the extracted tokens. The application should
  //    never feel broken; an empty panel is broken.
  const missingKinds: ComponentKind[] = ["Button", "Card", "Input", "Badge"];
  const haveKinds = new Set(components.map((c) => c.kind));
  for (const kind of missingKinds) {
    if (!haveKinds.has(kind)) {
      const placeholder = synthesizePlaceholderComponents(kind, tokens);
      if (placeholder) components.push(placeholder);
    }
  }

  // 4. Layer tree.
  const layerTree = buildLayerTree(file.document);

  // 5. Pages.
  const pages = buildPages(file, components);

  // 6. Accessibility audit.
  const accessibility = analyzeAccessibility(components, tokens);

  return {
    fileName: file.name,
    fileKey,
    lastModified: file.lastModified,
    tokens,
    components,
    pages,
    layerTree,
    accessibility,
  };
}
