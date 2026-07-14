import type { ComputedElement } from "../types.js";

export interface ExtractOptions {
  viewport?: { width: number; height: number };
  ignore?: string[];
  ignoreIframes?: boolean;
  /** waitUntil strategy for navigation. */
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
  /** Capture a full-page screenshot for the HTML report. */
  screenshot?: boolean;
}

export interface ExtractResult {
  elements: ComputedElement[];
  pageWidth: number;
  pageHeight: number;
  viewport: { width: number; height: number };
  /** data: URL of the full-page screenshot, or null when disabled/unavailable. */
  screenshotDataUrl: string | null;
}

/**
 * The function below is serialized and executed inside the browser page, so it
 * must be self-contained (no imports, no outer-scope references except its args).
 * It walks the rendered DOM and records the computed styles verify cares about.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function collectFromDom(opts: { ignore: string[]; ignoreIframes: boolean }): {
  elements: ComputedElement[];
  pageWidth: number;
  pageHeight: number;
} {
  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "META", "LINK", "HEAD", "TITLE", "NOSCRIPT", "BR", "HR",
  ]);

  function px(v: string): number {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  function selectorFor(el: Element): string {
    const parts: string[] = [];
    let node: Element | null = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 6 && node.tagName !== "BODY" && node.tagName !== "HTML") {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += "#" + node.id;
        parts.unshift(part);
        break;
      }
      const cls = (node.getAttribute("class") || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
      if (cls.length) part += "." + cls.join(".");
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(
          (c) => c.tagName === node!.tagName,
        );
        if (sameTag.length > 1) {
          part += ":nth-of-type(" + (sameTag.indexOf(node) + 1) + ")";
        }
      }
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  }

  function rendersDirectText(el: Element): { rendersText: boolean; text: string } {
    let text = "";
    let found = false;
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) {
        const t = (child.textContent || "").trim();
        if (t.length > 0) {
          found = true;
          text += (text ? " " : "") + t;
        }
      }
    }
    return { rendersText: found, text: text.slice(0, 120) };
  }

  function effectiveBackground(el: Element): string {
    let node: Element | null = el;
    while (node && node.nodeType === 1) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map((x) => parseFloat(x));
        const a = parts.length >= 4 ? parts[3] : 1;
        if (a > 0.02) return bg;
      }
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  }

  const out: ComputedElement[] = [];
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const all = document.body ? document.body.querySelectorAll("*") : [];

  for (const el of Array.from(all)) {
    if (SKIP_TAGS.has(el.tagName)) continue;
    if (opts.ignoreIframes && (el.tagName === "IFRAME" || el.closest("iframe"))) continue;
    const selector = selectorFor(el);
    if (opts.ignore.some((pat) => pat && (selector.includes(pat) || (el as any).matches?.(pat)))) continue;

    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const { rendersText, text } = rendersDirectText(el);
    const gapRaw = cs.gap && cs.gap !== "normal" ? px(cs.columnGap || cs.gap) : NaN;

    out.push({
      selector,
      tag: el.tagName.toLowerCase(),
      text,
      rendersText,
      box: {
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
      },
      styles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        effectiveBackground: effectiveBackground(el),
        fontSize: px(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
        lineHeight: cs.lineHeight === "normal" ? null : px(cs.lineHeight),
        paddingTop: px(cs.paddingTop),
        paddingRight: px(cs.paddingRight),
        paddingBottom: px(cs.paddingBottom),
        paddingLeft: px(cs.paddingLeft),
        marginTop: px(cs.marginTop),
        marginRight: px(cs.marginRight),
        marginBottom: px(cs.marginBottom),
        marginLeft: px(cs.marginLeft),
        gap: Number.isFinite(gapRaw) ? gapRaw : null,
        borderTopLeftRadius: px(cs.borderTopLeftRadius),
        borderTopRightRadius: px(cs.borderTopRightRadius),
        borderBottomLeftRadius: px(cs.borderBottomLeftRadius),
        borderBottomRightRadius: px(cs.borderBottomRightRadius),
      },
    });
  }

  const doc = document.documentElement;
  return {
    elements: out,
    pageWidth: Math.max(doc.scrollWidth, doc.clientWidth),
    pageHeight: Math.max(doc.scrollHeight, doc.clientHeight),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Load a URL in a headless browser, walk the rendered DOM, and return the
 * computed elements plus an optional full-page screenshot. Playwright is
 * imported lazily so the rest of verify (the matcher, the report) never needs a
 * browser installed.
 */
export async function extractPage(
  url: string,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const viewport = options.viewport ?? { width: 1280, height: 800 };
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Playwright is not installed. Run `npm i -D playwright && npx playwright install chromium` to enable live extraction.",
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: options.waitUntil ?? "networkidle" });

    const collected = (await page.evaluate(collectFromDom as any, {
      ignore: options.ignore ?? [],
      ignoreIframes: options.ignoreIframes ?? true,
    })) as { elements: ComputedElement[]; pageWidth: number; pageHeight: number };

    let screenshotDataUrl: string | null = null;
    if (options.screenshot !== false) {
      const buf = await page.screenshot({ fullPage: true, type: "png" });
      screenshotDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    }

    return {
      elements: collected.elements,
      pageWidth: collected.pageWidth,
      pageHeight: collected.pageHeight,
      viewport,
      screenshotDataUrl,
    };
  } finally {
    await browser.close();
  }
}
