import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extractTokens, type FigmaFileResponse, type DesignTokens } from "@forgeui/core";
import {
  matchPage,
  nearestStep,
  offScale,
  buildScales,
  buildReport,
  exitCodeFor,
  type ComputedElement,
} from "@forgeui/verify";
import { hexToRgb } from "@forgeui/core";

const root = new URL("../../../", import.meta.url);
const figma = JSON.parse(
  readFileSync(fileURLToPath(new URL("fixtures/figma/sample-marketing.json", root)), "utf8"),
) as FigmaFileResponse;
const tokens: DesignTokens = extractTokens(figma.document);

const pageFixture = JSON.parse(
  readFileSync(fileURLToPath(new URL("packages/verify/test/fixtures/computed-page.json", root)), "utf8"),
) as { elements: ComputedElement[] };

// A minimal element factory for focused unit tests.
function el(
  overrides: Omit<Partial<ComputedElement>, "styles"> & {
    selector: string;
    styles?: Partial<ComputedElement["styles"]>;
  },
): ComputedElement {
  const { styles: styleOverrides, ...rest } = overrides;
  return {
    selector: overrides.selector,
    tag: "div",
    text: "",
    rendersText: false,
    box: { x: 0, y: 0, width: 100, height: 40 },
    ...rest,
    styles: {
      color: "rgb(28, 25, 23)",
      backgroundColor: "rgba(0,0,0,0)",
      effectiveBackground: "rgb(255,255,255)",
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 24,
      paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
      gap: null,
      borderTopLeftRadius: 0, borderTopRightRadius: 0,
      borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
      ...styleOverrides,
    },
  };
}

describe("scale helpers", () => {
  const scale = [
    { name: "s1", value: 4 },
    { name: "s2", value: 8 },
    { name: "s3", value: 12 },
    { name: "s4", value: 16 },
  ];
  it("nearestStep finds the closest step and handles empty scales", () => {
    expect(nearestStep(13, scale)?.value).toBe(12);
    expect(nearestStep(2, scale)?.value).toBe(4);
    expect(nearestStep(100, scale)?.value).toBe(16);
    expect(nearestStep(5, [])).toBeNull();
  });
  it("offScale respects tolerance", () => {
    expect(offScale(16, scale, 1)).toBeNull(); // exact
    expect(offScale(15, scale, 1)).toBeNull(); // within 1px of 16
    expect(offScale(18, scale, 1)?.value).toBe(16); // 2px off
    expect(offScale(10, scale, 1)?.value).toBe(8); // nearest below
  });
  it("buildScales derives spacing/type/radius/palette from tokens", () => {
    const scales = buildScales(tokens, hexToRgb);
    expect(scales.spacing.map((s) => s.value)).toContain(16);
    expect(scales.fontSize.map((s) => s.value)).toContain(60);
    expect(scales.palette.length).toBeGreaterThan(0);
    expect(scales.maxRadius).toBeGreaterThanOrEqual(12);
  });
});

describe("matchPage — integration over the known-violation fixture", () => {
  const violations = matchPage(pageFixture.elements, tokens, {});

  it("finds exactly the intended violations and nothing else", () => {
    const found = violations
      .map((v) => `${v.type}:${v.property}@${v.selector}`)
      .sort();
    expect(found).toEqual(
      [
        "spacing:padding-left@main > section.hero > button.cta",
        "radius:border-top-left-radius@main > section.features > div.badge",
        "contrast:color@footer > p.lowcontrast",
        "color:color@main > section.promo > span.rogue",
        "color:background-color@main > section.promo",
        "spacing:gap@main > section.features > div.row",
      ].sort(),
    );
  });

  it("does not flag the on-token clean elements", () => {
    const flagged = new Set(violations.map((v) => v.selector));
    expect(flagged.has("header > nav.navbar")).toBe(false);
    expect(flagged.has("main > section.hero > h1.headline")).toBe(false);
  });

  it("is deterministic across runs", () => {
    const again = matchPage(pageFixture.elements, tokens, {});
    expect(JSON.stringify(again)).toEqual(JSON.stringify(violations));
  });

  it("summarizes severities and computes the CI budget verdict", () => {
    const report = buildReport({
      url: "http://localhost/demo",
      fileKey: "sample-marketing",
      viewport: { width: 1280, height: 800 },
      config: { ...(matchConfig()), budget: 0 },
      elementsChecked: pageFixture.elements.length,
      violations,
    });
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(4);
    expect(report.summary.infos).toBe(1);
    expect(report.summary.total).toBe(6);
    expect(report.summary.overBudget).toBe(true);
    expect(exitCodeFor(report)).toBe(1);

    // With a generous budget, the same violations pass CI.
    const lenient = buildReport({
      url: "http://localhost/demo",
      fileKey: "sample-marketing",
      viewport: { width: 1280, height: 800 },
      config: { ...(matchConfig()), budget: 10 },
      elementsChecked: pageFixture.elements.length,
      violations,
    });
    expect(exitCodeFor(lenient)).toBe(0);
  });

  it("report violations are sorted most-severe first", () => {
    const report = buildReport({
      url: "x", fileKey: "y", viewport: { width: 1, height: 1 },
      config: matchConfig(), elementsChecked: 8, violations,
    });
    expect(report.violations[0].severity).toBe("error");
  });
});

describe("matchPage — edge cases", () => {
  it("ignores 0, sub-tolerance, and negative spacing", () => {
    const v = matchPage(
      [el({ selector: "x", styles: { paddingLeft: 0, paddingRight: 0.5, marginTop: -5, marginBottom: 0 } as any })],
      tokens,
      {},
    );
    expect(v.filter((x) => x.type === "spacing")).toHaveLength(0);
  });

  it("skips transparent text/background colors", () => {
    const v = matchPage(
      [el({ selector: "x", rendersText: true, text: "hi", styles: { color: "rgba(0,0,0,0)", backgroundColor: "rgba(0,0,0,0)" } as any })],
      tokens,
      {},
    );
    expect(v.filter((x) => x.type === "color")).toHaveLength(0);
  });

  it("treats a null gap (auto) as no violation", () => {
    const v = matchPage([el({ selector: "x", styles: { gap: null } as any })], tokens, {});
    expect(v.filter((x) => x.property === "gap")).toHaveLength(0);
  });

  it("honors the ignore list", () => {
    const withIgnore = matchPage(pageFixture.elements, tokens, { ignore: ["section.promo"] });
    expect(withIgnore.some((x) => x.selector.includes("section.promo"))).toBe(false);
  });

  it("recognizes pill/full radii as on-scale", () => {
    const v = matchPage([el({ selector: "pill", styles: { borderTopLeftRadius: 9999, borderTopRightRadius: 9999, borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999 } as any })], tokens, {});
    expect(v.filter((x) => x.type === "radius")).toHaveLength(0);
  });

  it("produces no violations for an empty page", () => {
    expect(matchPage([], tokens, {})).toHaveLength(0);
  });
});

// Helper: the default config shape used by buildReport in these tests.
function matchConfig() {
  return {
    tolerancePx: 1,
    colorDeltaThreshold: 0.05,
    contrastMin: 4.5,
    ignore: [],
    ignoreIframes: true,
    budget: 0,
    severity: {},
  };
}
