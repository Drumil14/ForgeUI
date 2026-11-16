/**
 * @forgeui/verify/browser — the browser-safe subset.
 *
 * Everything here is pure data + pure functions: the types, the deterministic
 * matcher, report assembly, and fix suggestions. The extract module (which
 * lazily imports Playwright) is deliberately NOT exported, so bundlers can
 * ship this to the web report viewer without dragging a browser driver along.
 */

export * from "./types.js";
export { matchPage } from "./match/index.js";
export { buildScales, nearestStep, offScale } from "./match/scales.js";
export { buildReport, exitCodeFor } from "./report/report.js";
export { suggestFix, type FixSuggestion } from "./report/suggest.js";
