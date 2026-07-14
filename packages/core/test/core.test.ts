import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  parseFigmaUrl,
  isValidFigmaUrl,
  extractTokens,
  contrastRatio,
  oklabHexDistance,
  parseCssColor,
  FixtureFigmaClient,
  type FigmaFileResponse,
} from "@forgeui/core";

const file = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL("../../../fixtures/figma/sample-marketing.json", import.meta.url),
    ),
    "utf8",
  ),
) as FigmaFileResponse;

describe("parseFigmaUrl", () => {
  it("accepts /file/, /design/, /proto/ and bare keys", () => {
    expect(parseFigmaUrl("https://www.figma.com/file/AbC123XyZ/My-File")?.fileKey).toBe("AbC123XyZ");
    expect(parseFigmaUrl("https://figma.com/design/KEY12345/x")?.fileKey).toBe("KEY12345");
    expect(parseFigmaUrl("AbCdEf123456")?.fileKey).toBe("AbCdEf123456");
  });
  it("rejects non-figma URLs and garbage", () => {
    expect(parseFigmaUrl("https://example.com/file/x/y")).toBeNull();
    expect(parseFigmaUrl("not a url")).toBeNull();
    expect(isValidFigmaUrl("https://www.figma.com/file/AbC123XyZ/My-File")).toBe(true);
  });
});

describe("extractTokens", () => {
  it("pulls colors, type, spacing and radii out of the raw tree", () => {
    const tokens = extractTokens(file.document);
    expect(tokens.colors.some((c) => c.hex === "#e84e27")).toBe(true);
    expect(tokens.typography.some((t) => t.fontSize === 60)).toBe(true);
    expect(tokens.spacing.some((s) => s.value === 16)).toBe(true);
    expect(tokens.radii.some((r) => r.value === 8)).toBe(true);
  });
});

describe("color math", () => {
  it("contrastRatio matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
  it("oklab distance is ~0 for identical colors and larger for different ones", () => {
    expect(oklabHexDistance("#e84e27", "#e84e27")).toBeCloseTo(0, 6);
    expect(oklabHexDistance("#e84e27", "#2563eb")).toBeGreaterThan(0.2);
  });
  it("parseCssColor handles rgb, rgba and transparent", () => {
    expect(parseCssColor("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseCssColor("rgba(0, 0, 0, 0.5)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseCssColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });
});

describe("FixtureFigmaClient", () => {
  it("serves a committed fixture with no network or credentials", async () => {
    const dir = fileURLToPath(new URL("../../../fixtures/figma", import.meta.url));
    const client = new FixtureFigmaClient({ dir });
    const loaded = await client.getFile("sample-marketing");
    expect(loaded.name).toBe("Acme Marketing Site");
  });
});
