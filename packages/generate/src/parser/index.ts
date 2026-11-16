import type { FigmaFileResponse, FigmaNode } from "@forgeui/core/browser";
import { extractTokens } from "@forgeui/core/browser";
import type {
  ComponentKind,
  GeneratedComponent,
  ParsedDesign,
} from "../types.js";
import { classifyComponentDetailed } from "./classify-component.js";
import { buildLayerTree } from "./build-layer-tree.js";
import {
  generateComponent,
  resetIdCounter,
  sanitizeName,
} from "../generator/generate-component.js";
import { analyzeAccessibility } from "../analyzer/accessibility.js";
import {
  resetPlaceholderCounter,
  synthesizePlaceholderComponents,
} from "./placeholder.js";

/**
 * Walk the file's pages and turn "interesting" nodes into GeneratedComponents.
 *
 * Strategy:
 *   - For each page (CANVAS), walk its frames and promote any descendant that
 *     classifies as a concrete UI element (button, card, hero, …) into its own
 *     GeneratedComponent, remembering which page and node it came from.
 *   - Component names are finalized (sanitized + de-duplicated) BEFORE source
 *     generation, so the exported function name, props interface, filename,
 *     and metadata always agree.
 */

interface Candidate {
  node: FigmaNode;
  pageId: string;
  pageName: string;
}

const PROMOTABLE: ComponentKind[] = [
  "Button",
  "Card",
  "Input",
  "Badge",
  "Navbar",
  "Footer",
  "Hero",
];

function collectGenerableNodes(
  root: FigmaNode,
  page: { id: string; name: string },
  out: Candidate[],
): void {
  if (root.visible === false) return;

  const { kind } = classifyComponentDetailed(root);
  if (PROMOTABLE.includes(kind)) {
    out.push({ node: root, pageId: page.id, pageName: page.name });
    // Don't descend into a promoted node — we've already captured it.
    return;
  }

  if (root.children) {
    for (const c of root.children) collectGenerableNodes(c, page, out);
  }
}

/**
 * Finalize names before any source is generated: sanitize each candidate's
 * layer name, then de-duplicate with numeric suffixes. The suffixed name is
 * what gets baked into the TSX.
 */
function finalizeNames(candidates: Candidate[]): string[] {
  const seen = new Map<string, number>();
  return candidates.map(({ node }) => {
    const base = sanitizeName(node.name, classifyComponentDetailed(node).kind);
    const count = seen.get(base);
    if (count === undefined) {
      seen.set(base, 1);
      return base;
    }
    seen.set(base, count + 1);
    return `${base}${count + 1}`;
  });
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
    // Only the components whose source node actually lives on this page.
    componentIds: components
      .filter((c) => c.pageId === canvas.id)
      .map((c) => c.id),
  }));
}

export function parseFigmaFile(
  file: FigmaFileResponse,
  fileKey: string,
): ParsedDesign {
  resetIdCounter();
  resetPlaceholderCounter();

  // 1. Tokens — always extract from the full tree.
  const tokens = extractTokens(file.document);

  // 2. Candidates — walk each page separately so provenance is preserved.
  const candidates: Candidate[] = [];
  const canvases = (file.document.children ?? []).filter(
    (c) => c.type === "CANVAS",
  );
  for (const canvas of canvases) {
    for (const child of canvas.children ?? []) {
      collectGenerableNodes(child, { id: canvas.id, name: canvas.name }, candidates);
    }
  }
  const capped = candidates.slice(0, 24);

  // 3. Names first, then source — never the other way around.
  const names = finalizeNames(capped);
  const components: GeneratedComponent[] = capped.map((cand, i) =>
    generateComponent(cand.node, names[i], {
      pageId: cand.pageId,
      pageName: cand.pageName,
    }),
  );

  // 4. If the file lacks common kinds, add clearly-labeled synthesized
  //    examples derived from the file's own tokens. These carry
  //    origin: "synthesized" and belong to no Figma page — the UI must
  //    present them as demonstrations, never as extracted components.
  const missingKinds: ComponentKind[] = ["Button", "Card", "Input", "Badge"];
  const haveKinds = new Set(components.map((c) => c.kind));
  const usedNames = new Set(components.map((c) => c.name));
  for (const kind of missingKinds) {
    if (!haveKinds.has(kind)) {
      const placeholder = synthesizePlaceholderComponents(kind, tokens, usedNames);
      if (placeholder) {
        components.push(placeholder);
        usedNames.add(placeholder.name);
      }
    }
  }

  // 5. Layer tree.
  const layerTree = buildLayerTree(file.document);

  // 6. Pages — each page lists only its own components.
  const pages = buildPages(file, components);

  // 7. Accessibility audit.
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
