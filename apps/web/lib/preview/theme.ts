import type { DesignTokens } from "@/types";

/**
 * Build the text/tailwindcss stylesheet for the preview iframe.
 *
 * Generated components use a small semantic vocabulary (bg, fg, border,
 * accent, …) plus arbitrary values extracted from the design (bg-[#e84e27]).
 * The semantic names are mapped here so canonical templates render, and the
 * accent is taken from the imported design's own primary color so the preview
 * visually belongs to the design system being previewed.
 */
export function buildPreviewThemeCss(tokens: DesignTokens | null): string {
  const accent =
    tokens?.colors.find((c) => c.role === "primary" || c.role === "accent")
      ?.hex ?? "#e84e27";

  return `@import "tailwindcss";
@theme {
  --color-bg: #fcfcfb;
  --color-bg-elevated: #ffffff;
  --color-bg-subtle: #f6f6f4;
  --color-fg: #111111;
  --color-fg-muted: #5b5b58;
  --color-fg-subtle: #8a8a86;
  --color-border: #e5e5e2;
  --color-border-strong: #d1d1cd;
  --color-accent: ${accent};
  --color-accent-fg: #ffffff;
  --color-success: #16804c;
  --color-warning: #b26e10;
  --color-danger: #c42424;
}`;
}
