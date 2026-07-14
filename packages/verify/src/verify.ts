import type { DesignTokens, FigmaClient } from "@forgeui/core";
import { extractTokens } from "@forgeui/core";
import type { VerifyConfig, VerifyReport } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { matchPage } from "./match/index.js";
import { extractPage, type ExtractResult } from "./extract/index.js";
import { buildReport } from "./report/report.js";
import { renderHtml } from "./report/html.js";

export interface VerifyOptions {
  url: string;
  fileKey: string;
  /** Provide tokens directly (skips any Figma call). */
  tokens?: DesignTokens;
  /** Or provide a client + fileKey to load and extract tokens from Figma. */
  client?: FigmaClient;
  config?: Partial<VerifyConfig>;
  /**
   * Inject a pre-computed extraction (used by tests to run the full pipeline
   * without a browser). When omitted, Playwright extracts the live page.
   */
  extraction?: ExtractResult;
}

export interface VerifyResult {
  report: VerifyReport;
  html: string;
}

async function resolveTokens(opts: VerifyOptions): Promise<DesignTokens> {
  if (opts.tokens) return opts.tokens;
  if (opts.client) {
    const file = await opts.client.getFile(opts.fileKey);
    return extractTokens(file.document);
  }
  throw new Error(
    "verify() needs either `tokens` or a `client` to load the Figma design tokens.",
  );
}

/**
 * The full verify pipeline: load tokens → extract the live page → match →
 * build both report artifacts. Deterministic given the same page + tokens.
 */
export async function verify(opts: VerifyOptions): Promise<VerifyResult> {
  const config: VerifyConfig = { ...DEFAULT_CONFIG, ...opts.config, severity: { ...opts.config?.severity } };
  const tokens = await resolveTokens(opts);

  const extraction =
    opts.extraction ??
    (await extractPage(opts.url, {
      ignore: config.ignore,
      ignoreIframes: config.ignoreIframes,
    }));

  const violations = matchPage(extraction.elements, tokens, config);

  const report = buildReport({
    url: opts.url,
    fileKey: opts.fileKey,
    viewport: extraction.viewport,
    config,
    elementsChecked: extraction.elements.length,
    violations,
  });

  const html = renderHtml({
    report,
    screenshotDataUrl: extraction.screenshotDataUrl,
    pageWidth: extraction.pageWidth,
    pageHeight: extraction.pageHeight,
  });

  return { report, html };
}
