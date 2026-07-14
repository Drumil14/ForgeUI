import type { FigmaFileResponse } from "./types.js";

/**
 * The Figma layer sits behind this interface so every consumer — generate,
 * verify, the web app, and the whole test suite — can run against fixture data
 * with no network and no credentials. Real credentials plug in at exactly one
 * place: swap `FixtureFigmaClient` for `HttpFigmaClient`.
 */
export interface FigmaClient {
  getFile(fileKey: string): Promise<FigmaFileResponse>;
}

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

/**
 * Thin wrapper over the Figma REST API. The personal access token is only ever
 * used here, server-side / CLI-side — it never reaches a browser bundle.
 */
export class HttpFigmaClient implements FigmaClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.figma.com",
  ) {}

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    if (!this.apiKey) {
      throw new FigmaApiError(
        "FIGMA_API_KEY is not set. Add it to your environment to enable live imports.",
        "auth",
      );
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/v1/files/${fileKey}`, {
        headers: { "X-Figma-Token": this.apiKey },
      });
    } catch {
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
        "Figma could not find that file. Confirm the file key and that your token has access.",
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
}

/**
 * Reads a Figma file response from a local JSON file (or an in-memory map).
 * This is the seam that makes the entire toolchain testable without a token.
 */
export class FixtureFigmaClient implements FigmaClient {
  private readonly byKey: Map<string, FigmaFileResponse>;
  private readonly filesDir?: string;

  constructor(opts: {
    /** Pre-loaded responses keyed by file key. */
    files?: Record<string, FigmaFileResponse>;
    /** A directory where `<fileKey>.json` files live, loaded on demand. */
    dir?: string;
  } = {}) {
    this.byKey = new Map(Object.entries(opts.files ?? {}));
    this.filesDir = opts.dir;
  }

  async getFile(fileKey: string): Promise<FigmaFileResponse> {
    const inMemory = this.byKey.get(fileKey);
    if (inMemory) return inMemory;

    if (this.filesDir) {
      const path = `${this.filesDir}/${fileKey}.json`;
      try {
        // Lazy so this module carries no static node: import — it can be pulled
        // into a browser bundle (via the barrel) without breaking webpack.
        const { readFile } = await import("node:fs/promises");
        const raw = await readFile(path, "utf8");
        const parsed = JSON.parse(raw) as FigmaFileResponse;
        this.byKey.set(fileKey, parsed);
        return parsed;
      } catch {
        throw new FigmaApiError(
          `No fixture found for file key "${fileKey}" in ${this.filesDir}.`,
          "not_found",
        );
      }
    }

    throw new FigmaApiError(
      `No fixture registered for file key "${fileKey}".`,
      "not_found",
    );
  }
}

/**
 * Resolve a client from the environment: an HTTP client when FIGMA_API_KEY is
 * present, otherwise a fixture client bound to `fixtureDir`.
 */
export function resolveFigmaClient(opts: {
  apiKey?: string;
  fixtureDir?: string;
  fixtures?: Record<string, FigmaFileResponse>;
}): { client: FigmaClient; source: "http" | "fixture" } {
  if (opts.apiKey) {
    return { client: new HttpFigmaClient(opts.apiKey), source: "http" };
  }
  return {
    client: new FixtureFigmaClient({ dir: opts.fixtureDir, files: opts.fixtures }),
    source: "fixture",
  };
}
