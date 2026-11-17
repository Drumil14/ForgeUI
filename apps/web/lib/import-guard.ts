/**
 * Authorization gate for live Figma imports.
 *
 * `/api/import` fetches a Figma file with the deployer's server-side
 * FIGMA_API_KEY. Without a gate, any anonymous visitor could make the server
 * read ANY file that key can access (including the deployer's private files,
 * if a file key is known) or burn the key's rate quota. This gate is
 * secure-by-default: live import is DISABLED unless the deployer explicitly
 * opts in, and even then the recommended mode is a per-file allowlist.
 *
 * Modes (evaluated in order):
 *   1. Allowlist — FIGMA_ALLOWED_FILE_KEYS is a comma-separated list of file
 *      keys. Only those keys may be imported. (Recommended for public demos:
 *      whitelist only the files you intend to showcase.)
 *   2. Open — FIGMA_IMPORT_PUBLIC="true" allows importing any file key the
 *      token can reach. Only for trusted/private deployments; still rate-limited.
 *   3. Disabled (default) — no live import. The sample workspace is unaffected
 *      because it loads a committed fixture client-side, never this route.
 */

export type ImportAccess =
  | { allowed: true; mode: "allowlist" | "open" }
  | { allowed: false; reason: "disabled" | "not-allowlisted" };

export interface ImportGuardEnv {
  /** FIGMA_ALLOWED_FILE_KEYS — comma-separated file keys. */
  allowedFileKeys?: string;
  /** FIGMA_IMPORT_PUBLIC — "true" to allow any file key. */
  publicImport?: string;
}

export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function checkImportAccess(
  fileKey: string,
  env: ImportGuardEnv,
): ImportAccess {
  const allowlist = parseAllowlist(env.allowedFileKeys);

  if (allowlist.length > 0) {
    return allowlist.includes(fileKey)
      ? { allowed: true, mode: "allowlist" }
      : { allowed: false, reason: "not-allowlisted" };
  }

  if ((env.publicImport ?? "").trim().toLowerCase() === "true") {
    return { allowed: true, mode: "open" };
  }

  return { allowed: false, reason: "disabled" };
}
