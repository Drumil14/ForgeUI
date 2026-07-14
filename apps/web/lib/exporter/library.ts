/**
 * Barrel: library/component exporters moved to @forgeui/generate. `downloadBlob`
 * is browser-only (it touches the DOM), so it stays in the app layer.
 */
export { exportLibrary, exportComponentFile } from "@forgeui/generate";

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
