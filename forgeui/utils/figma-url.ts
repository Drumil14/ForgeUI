/**
 * Parse a Figma file URL into its file key.
 *
 * Accepts the URL shapes Figma actually serves:
 *   https://www.figma.com/file/{key}/{name}
 *   https://www.figma.com/design/{key}/{name}
 *   https://www.figma.com/proto/{key}/{name}
 *   {key}            — bare 22-char key, useful when pasting from "Copy link"
 */
export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
  fileName?: string;
}

const FILE_KEY_RE = /^[a-zA-Z0-9]{8,40}$/;

export function parseFigmaUrl(input: string): ParsedFigmaUrl | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Bare key
  if (FILE_KEY_RE.test(trimmed) && !trimmed.includes("/")) {
    return { fileKey: trimmed };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!url.hostname.endsWith("figma.com")) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  // Expected: ["file" | "design" | "proto", "{key}", "{name}"]
  const kindIdx = parts.findIndex((p) =>
    ["file", "design", "proto"].includes(p),
  );
  if (kindIdx === -1 || kindIdx + 1 >= parts.length) return null;

  const fileKey = parts[kindIdx + 1];
  if (!FILE_KEY_RE.test(fileKey)) return null;

  const fileName = parts[kindIdx + 2]
    ? decodeURIComponent(parts[kindIdx + 2]).replace(/-/g, " ")
    : undefined;

  const nodeId = url.searchParams.get("node-id") ?? undefined;

  return { fileKey, nodeId, fileName };
}

export function isValidFigmaUrl(input: string): boolean {
  return parseFigmaUrl(input) !== null;
}
