import { describe, it, expect } from "vitest";
import { parseFigmaFile, exportLibraryFiles } from "@forgeui/generate";
import type { FigmaFileResponse, FigmaNode } from "@forgeui/core";

/**
 * Phase 1 regressions:
 *  1. Component names are finalized BEFORE source generation — a de-duplicated
 *     name must appear in the TSX (function, props interface), the filename,
 *     and the barrel, never just in metadata.
 *  2. Components are associated with the Figma page they actually came from.
 *  3. Synthesized examples are labeled and never attributed to a page.
 *  4. exportLibraryFiles emits separate, consistent files.
 */

function textNode(id: string, chars: string): FigmaNode {
  return {
    id,
    name: "Label",
    type: "TEXT",
    characters: chars,
    style: { fontFamily: "Inter", fontSize: 14, fontWeight: 500 },
  } as unknown as FigmaNode;
}

function buttonNode(id: string, name: string): FigmaNode {
  return {
    id,
    name,
    type: "FRAME",
    layoutMode: "HORIZONTAL",
    absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
    cornerRadius: 8,
    fills: [
      { type: "SOLID", color: { r: 0.9, g: 0.3, b: 0.15, a: 1 }, opacity: 1 },
    ],
    children: [textNode(`${id}-t`, "Click me")],
  } as unknown as FigmaNode;
}

function makeFile(): FigmaFileResponse {
  return {
    name: "Dup Test",
    lastModified: "2026-01-01T00:00:00Z",
    document: {
      id: "0:0",
      name: "Document",
      type: "DOCUMENT",
      children: [
        {
          id: "page-1",
          name: "Home",
          type: "CANVAS",
          children: [buttonNode("1:1", "Button"), buttonNode("1:2", "Button")],
        },
        {
          id: "page-2",
          name: "Pricing",
          type: "CANVAS",
          children: [buttonNode("2:1", "Button")],
        },
      ],
    },
  } as unknown as FigmaFileResponse;
}

describe("component naming is finalized before source generation", () => {
  const design = parseFigmaFile(makeFile(), "dup-test");
  const buttons = design.components.filter((c) => c.origin !== "synthesized");

  it("de-duplicates names with numeric suffixes", () => {
    expect(buttons.map((b) => b.name)).toEqual(["Button", "Button2", "Button3"]);
  });

  it("bakes the final (suffixed) name into the TSX source", () => {
    for (const b of buttons) {
      expect(b.source).toContain(`export function ${b.name}(`);
      expect(b.source).toContain(`interface ${b.name}Props`);
      // The un-suffixed name must not leak into a suffixed component's export.
      if (b.name !== "Button") {
        expect(b.source).not.toContain("export function Button(");
      }
    }
  });
});

describe("page provenance", () => {
  const design = parseFigmaFile(makeFile(), "dup-test");

  it("records the source node and page on each extracted component", () => {
    const home = design.components.filter((c) => c.pageId === "page-1");
    const pricing = design.components.filter((c) => c.pageId === "page-2");
    expect(home.map((c) => c.sourceNodeId)).toEqual(["1:1", "1:2"]);
    expect(pricing.map((c) => c.sourceNodeId)).toEqual(["2:1"]);
  });

  it("each page lists only its own components", () => {
    const byId = new Map(design.components.map((c) => [c.id, c]));
    for (const page of design.pages) {
      for (const cid of page.componentIds) {
        expect(byId.get(cid)?.pageId).toBe(page.id);
      }
    }
    const home = design.pages.find((p) => p.id === "page-1")!;
    const pricing = design.pages.find((p) => p.id === "page-2")!;
    expect(home.componentIds).toHaveLength(2);
    expect(pricing.componentIds).toHaveLength(1);
  });
});

describe("synthesized examples are labeled, never attributed to Figma", () => {
  const design = parseFigmaFile(makeFile(), "dup-test");
  const synthesized = design.components.filter(
    (c) => c.origin === "synthesized",
  );

  it("fills in missing kinds as origin: synthesized", () => {
    // The file only has Buttons, so Card/Input/Badge examples are synthesized.
    expect(synthesized.map((c) => c.kind).sort()).toEqual([
      "Badge",
      "Card",
      "Input",
    ]);
    for (const c of synthesized) {
      expect(c.sourceNodeId).toBeUndefined();
      expect(c.pageId).toBeUndefined();
    }
  });

  it("never lists a synthesized example on a Figma page", () => {
    const pageIds = new Set(design.pages.flatMap((p) => p.componentIds));
    for (const c of synthesized) {
      expect(pageIds.has(c.id)).toBe(false);
    }
  });

  it("renames an example when an extracted component owns the name", () => {
    // A file whose Card is structurally classified but NAMED "Card".
    const file = makeFile();
    (file.document.children![0].children as FigmaNode[]).push({
      id: "1:9",
      name: "Card",
      type: "FRAME",
      cornerRadius: 12,
      absoluteBoundingBox: { x: 0, y: 200, width: 320, height: 200 },
      children: [textNode("1:9-t", "A card"), textNode("1:9-u", "Body")],
    } as unknown as FigmaNode);
    const d = parseFigmaFile(file, "dup-test-2");
    const names = d.components.map((c) => c.name);
    // No duplicate names anywhere, including examples.
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("exportLibraryFiles", () => {
  const design = parseFigmaFile(makeFile(), "dup-test");
  const files = exportLibraryFiles(design);
  const paths = files.map((f) => f.path);

  it("emits one .tsx per component plus barrel, tokens, and README", () => {
    for (const c of design.components) {
      expect(paths).toContain(`components/${c.name}.tsx`);
    }
    expect(paths).toContain("components/index.ts");
    expect(paths).toContain("tokens.css");
    expect(paths).toContain("tokens.json");
    expect(paths).toContain("tailwind.config.ts");
    expect(paths).toContain("README.md");
    expect(new Set(paths).size).toBe(paths.length); // no duplicate paths
  });

  it("barrel re-exports every component by its final name", () => {
    const index = files.find((f) => f.path === "components/index.ts")!;
    for (const c of design.components) {
      expect(index.content).toContain(
        `export { ${c.name} } from "./${c.name}";`,
      );
    }
  });

  it("component file content exports the matching identifier", () => {
    for (const c of design.components) {
      const f = files.find((x) => x.path === `components/${c.name}.tsx`)!;
      expect(f.content).toMatch(
        new RegExp(`export (function|const) ${c.name}\\b`),
      );
    }
  });

  it("README discloses synthesized examples", () => {
    const readme = files.find((f) => f.path === "README.md")!;
    expect(readme.content).toContain("synthesized example");
  });
});
