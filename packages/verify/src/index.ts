/**
 * @forgeui/verify — diff a live rendered page against Figma design tokens.
 *
 * Pipeline: extract (Playwright) → match (deterministic, LLM-free) → report
 * (report.json for CI + report.html for humans).
 */

export * from "./types.js";
export { matchPage } from "./match/index.js";
export { buildScales, nearestStep, offScale } from "./match/scales.js";
export { extractPage, type ExtractOptions, type ExtractResult } from "./extract/index.js";
export { buildReport, exitCodeFor } from "./report/report.js";
export { renderHtml, type HtmlReportInput } from "./report/html.js";
export { verify, type VerifyOptions, type VerifyResult } from "./verify.js";
