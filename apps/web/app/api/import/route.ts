import { NextRequest, NextResponse } from "next/server";
import { FigmaApiError, fetchFigmaFile } from "@/services/figma";
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
    const file = await fetchFigmaFile(parsed.fileKey, apiKey);
    const design = parseFigmaFile(file, parsed.fileKey);
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
