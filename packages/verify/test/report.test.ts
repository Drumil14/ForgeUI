import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extractTokens, type FigmaFileResponse } from "@forgeui/core";
import { matchPage, buildReport, renderHtml, type ComputedElement } from "@forgeui/verify";

const root = new URL("../../../", import.meta.url);
const figma = JSON.parse(
  readFileSync(fileURLToPath(new URL("fixtures/figma/sample-marketing.json", root)), "utf8"),
) as FigmaFileResponse;
const tokens = extractTokens(figma.document);
const page = JSON.parse(
  readFileSync(fileURLToPath(new URL("packages/verify/test/fixtures/computed-page.json", root)), "utf8"),
) as { elements: ComputedElement[]; pageWidth: number; pageHeight: number; viewport: { width: number; height: number } };

function makeReport(budget = 0) {
  const violations = matchPage(page.elements, tokens, { budget });
  return buildReport({
    url: "http://localhost/demo",
    fileKey: "sample-marketing",
    viewport: page.viewport,
    config: { tolerancePx: 1, colorDeltaThreshold: 0.05, contrastMin: 4.5, ignore: [], ignoreIframes: true, budget, severity: {} },
    elementsChecked: page.elements.length,
    violations,
  });
}

describe("renderHtml", () => {
  it("produces a self-contained HTML document embedding the report data", () => {
    const report = makeReport();
    const html = renderHtml({ report, screenshotDataUrl: null, pageWidth: page.pageWidth, pageHeight: page.pageHeight });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('id="stage"');
    expect(html).toContain('id="report-data"');
    // The embedded JSON must round-trip to the same violations.
    const m = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
    expect(m).not.toBeNull();
    const parsed = JSON.parse(m![1].replace(/\\u003c/g, "<"));
    expect(parsed.report.violations.length).toBe(report.violations.length);
    expect(parsed.pageWidth).toBe(page.pageWidth);
  });

  it("escapes the screenshot flag and renders a placeholder when absent", () => {
    const html = renderHtml({ report: makeReport(), screenshotDataUrl: null, pageWidth: 100, pageHeight: 100 });
    expect(html).toContain("placeholder");
  });

  it("embeds a screenshot data URL when provided", () => {
    const dataUrl = "data:image/png;base64,AAAA";
    const html = renderHtml({ report: makeReport(), screenshotDataUrl: dataUrl, pageWidth: 100, pageHeight: 100 });
    expect(html).toContain(dataUrl);
  });

  it("does not allow a </script> in data to break out of the script tag", () => {
    const report = makeReport();
    // Inject a hostile selector to ensure escaping holds.
    report.violations[0].selector = '</script><img src=x>';
    const html = renderHtml({ report, screenshotDataUrl: null, pageWidth: 100, pageHeight: 100 });
    expect(html).not.toContain("</script><img");
  });
});
