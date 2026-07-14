/**
 * @forgeui/generate — Figma → React + Tailwind generation.
 *
 * Consumes @forgeui/core's token model and Figma types; emits GeneratedComponent
 * source, an accessibility report, and export artifacts.
 */

export * from "./types.js";
export * from "./tailwind-map.js";
export { classifyComponent } from "./parser/classify-component.js";
export { buildLayerTree } from "./parser/build-layer-tree.js";
export {
  synthesizePlaceholderComponents,
  resetPlaceholderCounter,
} from "./parser/placeholder.js";
export { parseFigmaFile } from "./parser/index.js";
export { buildTailwindClasses } from "./generator/build-classes.js";
export {
  generateComponent,
  resetIdCounter,
} from "./generator/generate-component.js";
export { analyzeAccessibility } from "./analyzer/accessibility.js";
export {
  tokensToCss,
  tokensToTailwindTheme,
  tokensToJson,
} from "./exporter/tokens.js";
export { exportLibrary, exportComponentFile } from "./exporter/library.js";
