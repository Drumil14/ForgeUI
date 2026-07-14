import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseFigmaFile } from "@forgeui/generate";
import type { FigmaFileResponse } from "@forgeui/core";

const fixturePath = fileURLToPath(
  new URL("../../../fixtures/figma/sample-marketing.json", import.meta.url),
);
const file = JSON.parse(readFileSync(fixturePath, "utf8")) as FigmaFileResponse;

describe("parseFigmaFile — regression over the sample marketing fixture", () => {
  it("is deterministic: two parses produce identical output", () => {
    const a = parseFigmaFile(file, "sample-marketing");
    const b = parseFigmaFile(file, "sample-marketing");
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("preserves top-level file metadata", () => {
    const design = parseFigmaFile(file, "sample-marketing");
    expect(design.fileName).toBe("Acme Marketing Site");
    expect(design.fileKey).toBe("sample-marketing");
    expect(design.lastModified).toBe("2025-08-14T10:32:00Z");
  });

  it("extracts the brand palette, type scale, spacing and radii", () => {
    const { tokens } = parseFigmaFile(file, "sample-marketing");
    const hexes = tokens.colors.map((c) => c.hex);
    // Brand vermillion + ink neutrals.
    expect(hexes).toContain("#e84e27");
    expect(hexes).toContain("#1c1917");

    const sizes = tokens.typography.map((t) => t.fontSize).sort((a, b) => a - b);
    expect(sizes).toContain(60); // display
    expect(sizes).toContain(16); // body
    expect(sizes).toContain(12); // caption

    const spacing = tokens.spacing.map((s) => s.value);
    for (const step of [8, 16, 24, 64]) expect(spacing).toContain(step);

    const radii = tokens.radii.map((r) => r.value);
    expect(radii).toContain(8);
    expect(radii).toContain(12);
  });

  it("promotes the expected component kinds", () => {
    const design = parseFigmaFile(file, "sample-marketing");
    const kinds = new Set(design.components.map((c) => c.kind));
    for (const kind of ["Navbar", "Hero", "Button", "Card", "Input", "Badge", "Footer"] as const) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it("emits copy-pasteable TSX and an accessibility report", () => {
    const design = parseFigmaFile(file, "sample-marketing");
    const button = design.components.find((c) => c.kind === "Button");
    expect(button?.source).toContain("export function");
    expect(button?.source).toContain("focus-visible:outline");
    expect(design.accessibility.score).toBeGreaterThan(0);
    expect(design.accessibility.summary).toHaveProperty("passes");
  });

  it("matches the committed golden snapshot (locks current behaviour)", () => {
    const design = parseFigmaFile(file, "sample-marketing");
    // Normalize to the structural shape we care about (kinds + token names),
    // independent of the verbose generated source strings.
    const shape = {
      fileName: design.fileName,
      colorNames: design.tokens.colors.map((c) => `${c.name}:${c.hex}`),
      spacing: design.tokens.spacing.map((s) => s.value),
      radii: design.tokens.radii.map((r) => `${r.name}:${r.value}`),
      typography: design.tokens.typography.map((t) => `${t.name}:${t.fontSize}/${t.fontWeight}`),
      components: design.components.map((c) => ({ name: c.name, kind: c.kind })),
      pages: design.pages.map((p) => p.name),
      a11ySummary: design.accessibility.summary,
    };
    expect(shape).toMatchSnapshot();
  });
});
