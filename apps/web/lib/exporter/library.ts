/**
 * Barrel: library/component exporters moved to @forgeui/generate. The
 * browser-only pieces (blob download, ZIP assembly) stay in the app layer.
 */
import type { ExportFile } from "@forgeui/generate";

export {
  exportLibrary,
  exportLibraryFiles,
  exportComponentFile,
  type ExportFile,
} from "@forgeui/generate";

export function downloadBlob(filename: string, content: string | Blob, mime: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Bundle the exported files into a real ZIP and download it. JSZip is loaded
 * lazily so it never lands in the initial bundle.
 */
export async function downloadZip(
  filename: string,
  files: ExportFile[],
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) zip.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(filename, blob, "application/zip");
}
