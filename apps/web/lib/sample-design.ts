import type { ParsedDesign } from "@/types";
import { parseFigmaFile } from "@/lib/parser";
import type { FigmaFileResponse } from "@forgeui/core/browser";
import sampleFigmaFile from "../../../fixtures/figma/sample-marketing.json";

/**
 * The built-in sample design: the committed Figma fixture
 * (fixtures/figma/sample-marketing.json) run through the REAL parse pipeline.
 *
 * This is deliberately not hand-authored data — the demo workspace shows
 * exactly what `parseFigmaFile` produces (tokens, components, provenance,
 * accessibility heuristics), so the demo can never drift from the engine.
 * The same fixture drives the CLI tests and the published /demo verify report.
 */
export const SAMPLE_FILE_KEY = "sample-marketing";

export const sampleDesign: ParsedDesign = parseFigmaFile(
  sampleFigmaFile as unknown as FigmaFileResponse,
  SAMPLE_FILE_KEY,
);
