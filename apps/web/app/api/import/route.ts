import { NextRequest, NextResponse } from "next/server";
import { HttpFigmaClient } from "@forgeui/core";
import { FigmaApiError } from "@/services/figma";
import { parseFigmaUrl } from "@/utils/figma-url";
import { parseFigmaFile } from "@/lib/parser";

/**
 * POST /api/import
 * Body: { url: string }
 * Returns: ParsedDesign | { error: { message, kind } }
 *
 * Server-side only — the FIGMA_API_KEY never reaches the client.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Request body must be JSON.", kind: "bad_request" } },
      { status: 400 },
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json(
      {
        error: {
          message: "Provide a Figma file URL.",
          kind: "bad_request",
        },
      },
      { status: 400 },
    );
  }

  const parsed = parseFigmaUrl(url);
  if (!parsed) {
    return NextResponse.json(
      {
        error: {
          message:
            "That URL doesn't look like a Figma file link. Open the file in Figma and use Share → Copy link.",
          kind: "invalid_url",
        },
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.FIGMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          message:
            "FIGMA_API_KEY is not configured. Add it to .env.local to enable live imports. The workspace will still load with sample data.",
          kind: "auth",
        },
      },
      { status: 500 },
    );
  }

  try {
    const client = new HttpFigmaClient(apiKey);
    const file = await client.getFile(parsed.fileKey);
    const design = parseFigmaFile(file, parsed.fileKey);

    // Best-effort asset export via the Figma Images API: bitmaps as PNG,
    // vectors as SVG. Failures never sink the import — assets just stay
    // URL-less and the panel explains why. The API key stays server-side;
    // the returned CDN URLs are short-lived, unauthenticated renders.
    try {
      const images = design.assets.filter((a) => a.kind === "image");
      const vectors = design.assets.filter((a) => a.kind === "vector");
      const [pngUrls, svgUrls] = await Promise.all([
        client.getImageUrls(parsed.fileKey, images.map((a) => a.nodeId), "png"),
        client.getImageUrls(parsed.fileKey, vectors.map((a) => a.nodeId), "svg"),
      ]);
      for (const asset of design.assets) {
        const url =
          asset.kind === "image" ? pngUrls[asset.nodeId] : svgUrls[asset.nodeId];
        if (url) asset.url = url;
      }
    } catch {
      // Asset rendering is optional; the import result is complete without it.
    }

    return NextResponse.json(design);
  } catch (err) {
    if (err instanceof FigmaApiError) {
      const status =
        err.kind === "auth"
          ? 401
          : err.kind === "not_found"
            ? 404
            : err.kind === "rate_limit"
              ? 429
              : 500;
      return NextResponse.json(
        { error: { message: err.message, kind: err.kind } },
        { status },
      );
    }
    return NextResponse.json(
      {
        error: {
          message: "Something went wrong on the server.",
          kind: "unknown",
        },
      },
      { status: 500 },
    );
  }
}
