/**
 * Barrel: the Figma REST client moved to @forgeui/core (`HttpFigmaClient`).
 * The app's route handler calls `fetchFigmaFile(fileKey, apiKey)`, so we keep
 * that thin function shape here on top of the class-based client.
 */
import { HttpFigmaClient } from "@forgeui/core";
import type { FigmaFileResponse } from "@forgeui/core";

export { FigmaApiError } from "@forgeui/core";

export async function fetchFigmaFile(
  fileKey: string,
  apiKey: string,
): Promise<FigmaFileResponse> {
  return new HttpFigmaClient(apiKey).getFile(fileKey);
}
