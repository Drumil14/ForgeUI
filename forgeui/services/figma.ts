import type { FigmaFileResponse } from "@/types/figma";

/**
 * Thin wrapper over the Figma REST API. Lives server-side only — we never
 * expose the personal access token to the browser.
 */

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "auth"
      | "not_found"
      | "rate_limit"
      | "network"
      | "unknown",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "FigmaApiError";
  }
}

export async function fetchFigmaFile(
  fileKey: string,
  apiKey: string,
): Promise<FigmaFileResponse> {
  if (!apiKey) {
    throw new FigmaApiError(
      "FIGMA_API_KEY is not set. Add it to .env.local to enable live imports.",
      "auth",
    );
  }

  let res: Response;
  try {
    res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": apiKey },
      // Files don't change moment-to-moment; cache briefly for snappier reloads.
      next: { revalidate: 60 },
    });
  } catch (err) {
    throw new FigmaApiError(
      "Could not reach api.figma.com. Check your network connection.",
      "network",
    );
  }

  if (res.status === 403 || res.status === 401) {
    throw new FigmaApiError(
      "Figma rejected the API key. Generate a personal access token at figma.com/developers/api and update FIGMA_API_KEY.",
      "auth",
      res.status,
    );
  }
  if (res.status === 404) {
    throw new FigmaApiError(
      "Figma could not find that file. Confirm the URL and that your token has access.",
      "not_found",
      res.status,
    );
  }
  if (res.status === 429) {
    throw new FigmaApiError(
      "Figma rate-limited the request. Wait a moment and try again.",
      "rate_limit",
      res.status,
    );
  }
  if (!res.ok) {
    throw new FigmaApiError(
      `Figma returned HTTP ${res.status}.`,
      "unknown",
      res.status,
    );
  }

  return (await res.json()) as FigmaFileResponse;
}
