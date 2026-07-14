import type { DesignTokens } from "@forgeui/core/browser";

/**
 * Convert the extracted design tokens into the artifact formats engineers
 * actually consume: CSS custom properties and a Tailwind theme object.
 */

export function tokensToCss(tokens: DesignTokens): string {
  const lines: string[] = [":root {"];
  lines.push("  /* Colors */");
  for (const c of tokens.colors) {
    lines.push(`  --color-${c.name}: ${c.hex};`);
  }
  if (tokens.spacing.length) {
    lines.push("\n  /* Spacing */");
    for (const s of tokens.spacing) {
      lines.push(`  --space-${s.value}: ${s.value}px;`);
    }
  }
  if (tokens.radii.length) {
    lines.push("\n  /* Radii */");
    for (const r of tokens.radii) {
      lines.push(`  --${r.name}: ${r.value}px;`);
    }
  }
  if (tokens.shadows.length) {
    lines.push("\n  /* Shadows */");
    for (const s of tokens.shadows) {
      lines.push(`  --${s.name}: ${s.value};`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

export function tokensToTailwindTheme(tokens: DesignTokens): string {
  const colors: Record<string, string> = {};
  for (const c of tokens.colors) colors[c.name] = c.hex;

  const fontSize: Record<string, string> = {};
  const fontWeight: Record<string, number> = {};
  for (const t of tokens.typography) {
    fontSize[t.name] = `${t.fontSize}px`;
    fontWeight[t.name] = t.fontWeight;
  }

  const spacing: Record<string, string> = {};
  for (const s of tokens.spacing) spacing[s.value.toString()] = `${s.value}px`;

  const borderRadius: Record<string, string> = {};
  for (const r of tokens.radii) {
    borderRadius[r.name.replace("radius-", "")] = `${r.value}px`;
  }

  const boxShadow: Record<string, string> = {};
  for (const s of tokens.shadows) {
    boxShadow[s.name.replace("shadow-", "")] = s.value;
  }

  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6).replace(/\n/g, "\n      ")},
      fontSize: ${JSON.stringify(fontSize, null, 6).replace(/\n/g, "\n      ")},
      fontWeight: ${JSON.stringify(fontWeight, null, 6).replace(/\n/g, "\n      ")},
      spacing: ${JSON.stringify(spacing, null, 6).replace(/\n/g, "\n      ")},
      borderRadius: ${JSON.stringify(borderRadius, null, 6).replace(/\n/g, "\n      ")},
      boxShadow: ${JSON.stringify(boxShadow, null, 6).replace(/\n/g, "\n      ")},
    },
  },
  plugins: [],
};

export default config;
`;
}

export function tokensToJson(tokens: DesignTokens): string {
  return JSON.stringify(tokens, null, 2);
}
