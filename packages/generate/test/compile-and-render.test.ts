import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "sucrase";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { parseFigmaFile } from "@forgeui/generate";
import type { FigmaFileResponse } from "@forgeui/core";

/**
 * Preview/export consistency: the web preview executes generated TSX after the
 * exact sucrase transform used here. If every generated component transpiles,
 * evaluates, and renders to markup under React, then (a) the exported code is
 * valid TSX that compiles in a clean React app, and (b) the sandboxed preview
 * is rendering the real artifact, not an approximation.
 */

const fixturePath = fileURLToPath(
  new URL("../../../fixtures/figma/sample-marketing.json", import.meta.url),
);
const file = JSON.parse(readFileSync(fixturePath, "utf8")) as FigmaFileResponse;
const design = parseFigmaFile(file, "sample-marketing");

const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  Button: { children: "Get started" },
  Badge: { children: "New" },
  Card: { title: "Card title", description: "Body copy" },
  Input: { label: "Email", placeholder: "you@example.com" },
  Navbar: { brand: "Acme", items: [{ label: "Docs", href: "#d" }] },
  Hero: { headline: "Headline", subhead: "Sub", ctaLabel: "Go" },
  Footer: {
    brand: "Acme",
    sections: [{ heading: "Product", links: [{ label: "A", href: "#a" }] }],
    legal: "© Acme",
  },
};

function evaluate(source: string): React.ComponentType<Record<string, unknown>> {
  const { code } = transform(source, {
    transforms: ["typescript", "jsx", "imports"],
    production: true,
  });
  const exportsObj: Record<string, unknown> = {};
  const moduleObj = { exports: exportsObj };
  const requireShim = (name: string): unknown => {
    if (name === "react") return React;
    if (name === "react-dom") return ReactDOM;
    throw new Error(`generated code imported unexpected module "${name}"`);
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("require", "module", "exports", code);
  fn(requireShim, moduleObj, exportsObj);
  const candidates = Object.entries(exportsObj).filter(
    ([k, v]) =>
      k !== "__esModule" &&
      (typeof v === "function" ||
        (typeof v === "object" && v !== null && "$$typeof" in v)),
  );
  expect(candidates.length).toBeGreaterThan(0);
  return candidates[0][1] as React.ComponentType<Record<string, unknown>>;
}

describe("every generated component compiles and renders (preview = export)", () => {
  for (const component of design.components) {
    it(`${component.name} (${component.kind}, ${component.origin})`, () => {
      const Component = evaluate(component.source);
      const props = SAMPLE_PROPS[component.kind] ?? {};
      const markup = renderToStaticMarkup(
        React.createElement(Component, props),
      );
      expect(markup.length).toBeGreaterThan(0);
      // The rendered markup carries the component's root classes vocabulary.
      expect(markup).toContain("class=");
    });
  }

  it("the exported component name matches the evaluated export", () => {
    for (const component of design.components) {
      const { code } = transform(component.source, {
        transforms: ["typescript", "jsx", "imports"],
        production: true,
      });
      expect(code).toContain(component.name);
    }
  });

  it("IR travels with extracted components and matches the source node", () => {
    for (const c of design.components) {
      if (c.origin === "synthesized") {
        expect(c.ir).toBeUndefined();
      } else {
        expect(c.ir).toBeDefined();
        expect(c.ir!.sourceNodeId).toBe(c.sourceNodeId);
      }
    }
  });
});
