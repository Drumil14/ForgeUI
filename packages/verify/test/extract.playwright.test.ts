import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractTokens, type FigmaFileResponse } from "@forgeui/core";
import { extractPage, matchPage, buildReport, exitCodeFor } from "@forgeui/verify";

// Detect a usable Chromium so a fresh clone without browsers still stays green.
let hasBrowser = false;
try {
  const { chromium } = await import("playwright");
  hasBrowser = existsSync(chromium.executablePath());
} catch {
  hasBrowser = false;
}

const root = new URL("../../../", import.meta.url);
const figma = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync(fileURLToPath(new URL("fixtures/figma/sample-marketing.json", root)), "utf8"),
  ),
) as FigmaFileResponse;
const tokens = extractTokens(figma.document);
const demoUrl = pathToFileURL(
  fileURLToPath(new URL("fixtures/demo/index.html", root)),
).href;

describe.skipIf(!hasBrowser)("extractPage + match — live Playwright over the demo page", () => {
  it("extracts computed styles and finds the demo's known drifts", async () => {
    const extraction = await extractPage(demoUrl, { screenshot: false });
    expect(extraction.elements.length).toBeGreaterThan(10);
    expect(extraction.pageWidth).toBeGreaterThan(0);

    const violations = matchPage(extraction.elements, tokens, {});
    const sig = violations.map((v) => `${v.type}:${v.property}`);

    // The demo's intentional drifts:
    expect(violations.some((v) => v.type === "radius")).toBe(true); // .card.off radius 10
    expect(violations.some((v) => v.type === "font-size")).toBe(true); // .off h3 22px
    expect(
      violations.some((v) => v.type === "color" && v.property === "background-color"),
    ).toBe(true); // promo #7b2ff7
    expect(violations.some((v) => v.type === "contrast")).toBe(true); // low-contrast text
    expect(sig.some((s) => s.startsWith("spacing:padding"))).toBe(true); // .off padding 18
  }, 60_000);

  it("is deterministic across two extractions of the same page", async () => {
    const a = matchPage((await extractPage(demoUrl, { screenshot: false })).elements, tokens, {});
    const b = matchPage((await extractPage(demoUrl, { screenshot: false })).elements, tokens, {});
    const norm = (vs: typeof a) => vs.map((v) => `${v.type}:${v.property}:${v.selector}`).sort();
    expect(norm(a)).toEqual(norm(b));
  }, 60_000);

  it("captures a screenshot data URL for the report", async () => {
    const extraction = await extractPage(demoUrl, { screenshot: true });
    expect(extraction.screenshotDataUrl).toMatch(/^data:image\/png;base64,/);
  }, 60_000);

  it("over-budget runs exit non-zero", async () => {
    const extraction = await extractPage(demoUrl, { screenshot: false });
    const violations = matchPage(extraction.elements, tokens, { budget: 0 });
    const report = buildReport({
      url: demoUrl, fileKey: "sample-marketing", viewport: extraction.viewport,
      config: { tolerancePx: 1, colorDeltaThreshold: 0.05, contrastMin: 4.5, ignore: [], ignoreIframes: true, budget: 0, severity: {} },
      elementsChecked: extraction.elements.length, violations,
    });
    expect(exitCodeFor(report)).toBe(1);
  }, 60_000);
});
