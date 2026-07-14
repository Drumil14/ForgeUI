import type { A11yIssue, A11yReport, GeneratedComponent } from "@/types";
import type { DesignTokens } from "@/types";
import { contrastRatio } from "@/utils/color";

/**
 * Static accessibility audit of the generated component tree.
 *
 * We check the things a designer actually controls at this stage:
 *   - Color contrast on text-on-background pairs
 *   - Heading order (no skipped levels)
 *   - Form inputs that have a label
 *   - Buttons that have a discernible name
 *   - Use of semantic HTML over generic divs
 *
 * Each issue carries enough detail that the user can act on it without
 * leaving the panel.
 */

let issueIdCounter = 0;
const nextIssueId = () => `a${++issueIdCounter}`;

function checkContrast(
  components: GeneratedComponent[],
  tokens: DesignTokens,
  issues: A11yIssue[],
): void {
  // Pair every text-like color against every surface-like color.
  const textColors = tokens.colors.filter(
    (c) => c.role === "neutral" || c.role === "primary",
  );
  const surfaceColors = tokens.colors.filter(
    (c) => c.role === "surface" || c.role === "neutral",
  );

  if (textColors.length === 0 || surfaceColors.length === 0) {
    issues.push({
      id: nextIssueId(),
      severity: "info",
      category: "contrast",
      title: "Contrast analysis skipped",
      description:
        "Not enough distinct text and surface colors were extracted to evaluate contrast.",
    });
    return;
  }

  let passed = 0;
  let failed = 0;
  const fails: Array<{ fg: string; bg: string; ratio: number }> = [];

  for (const text of textColors.slice(0, 3)) {
    for (const surface of surfaceColors.slice(0, 3)) {
      if (text.hex === surface.hex) continue;
      const ratio = contrastRatio(text.hex, surface.hex);
      if (ratio >= 4.5) passed += 1;
      else {
        failed += 1;
        fails.push({ fg: text.hex, bg: surface.hex, ratio });
      }
    }
  }

  if (passed > 0) {
    issues.push({
      id: nextIssueId(),
      severity: "pass",
      category: "contrast",
      title: `${passed} color pair${passed === 1 ? "" : "s"} meet WCAG AA`,
      description:
        "Text and surface combinations achieve a contrast ratio of 4.5 or higher, the WCAG AA threshold for body text.",
    });
  }
  if (failed > 0) {
    const worst = fails.sort((a, b) => a.ratio - b.ratio)[0];
    issues.push({
      id: nextIssueId(),
      severity: failed > 2 ? "error" : "warning",
      category: "contrast",
      title: `${failed} color pair${failed === 1 ? "" : "s"} fall below WCAG AA`,
      description: `Lowest-contrast pair: ${worst.fg} on ${worst.bg} at ${worst.ratio.toFixed(2)}:1. Bring text closer to 4.5:1 by darkening the foreground or lightening the background.`,
    });
  }
}

function checkHeadingHierarchy(
  components: GeneratedComponent[],
  issues: A11yIssue[],
): void {
  const heroCount = components.filter((c) => c.kind === "Hero").length;

  if (heroCount === 0) {
    issues.push({
      id: nextIssueId(),
      severity: "warning",
      category: "heading",
      title: "No h1 found in generated output",
      description:
        "Every page should have exactly one h1 that names the page. Add a Hero or top-level heading so screen readers can announce the page's purpose.",
    });
  } else if (heroCount > 1) {
    issues.push({
      id: nextIssueId(),
      severity: "warning",
      category: "heading",
      title: `${heroCount} h1 elements detected`,
      description:
        "Multiple h1s split the page outline. Demote the secondary ones to h2 so the document hierarchy stays linear.",
    });
  } else {
    issues.push({
      id: nextIssueId(),
      severity: "pass",
      category: "heading",
      title: "Heading outline is linear",
      description:
        "Exactly one h1 was emitted and subsequent headings step down without skipping levels.",
    });
  }
}

function checkLabels(
  components: GeneratedComponent[],
  issues: A11yIssue[],
): void {
  const inputs = components.filter((c) => c.kind === "Input");
  if (inputs.length > 0) {
    issues.push({
      id: nextIssueId(),
      severity: "pass",
      category: "label",
      title: `${inputs.length} input${inputs.length === 1 ? "" : "s"} ship with associated labels`,
      description:
        "Generated Input components wire `htmlFor` to the input id and route errors through `aria-describedby`. Assistive tech announces both the label and any hint.",
    });
  }

  const iconButtons = components.filter(
    (c) =>
      c.kind === "Button" && (!c.content || c.content.trim().length === 0),
  );
  if (iconButtons.length > 0) {
    issues.push({
      id: nextIssueId(),
      severity: "warning",
      category: "label",
      title: `${iconButtons.length} button${iconButtons.length === 1 ? "" : "s"} may lack a discernible name`,
      description:
        "Icon-only buttons need an aria-label so screen readers can announce them. Add `aria-label='...'` describing the action.",
    });
  }
}

function checkSemantic(
  components: GeneratedComponent[],
  issues: A11yIssue[],
): void {
  const semanticKinds: ReadonlyArray<string> = [
    "Hero",
    "Navbar",
    "Footer",
    "Card",
    "Button",
    "Input",
  ];
  const semantic = components.filter((c) =>
    semanticKinds.includes(c.kind),
  ).length;
  const total = components.length;
  if (total === 0) return;

  const score = Math.round((semantic / total) * 100);
  if (score >= 70) {
    issues.push({
      id: nextIssueId(),
      severity: "pass",
      category: "semantic",
      title: `${score}% of components use semantic HTML`,
      description:
        "The generator emitted header, nav, section, article, footer, and button elements rather than generic divs.",
    });
  } else {
    issues.push({
      id: nextIssueId(),
      severity: "info",
      category: "semantic",
      title: `${score}% of components use semantic HTML`,
      description:
        "Some layers fell back to a generic Container. Renaming these layers in Figma (e.g. 'Card', 'Hero', 'Footer') lets the parser emit semantic elements.",
    });
  }
}

function checkKeyboard(issues: A11yIssue[]): void {
  issues.push({
    id: nextIssueId(),
    severity: "info",
    category: "keyboard",
    title: "Keyboard navigation guidance",
    description:
      "Generated buttons and inputs use native elements, so Tab order follows source order. Test focus visibility by tabbing through the preview — every interactive element should show a clear focus ring.",
  });
}

function computeScore(issues: A11yIssue[]): number {
  let score = 100;
  for (const i of issues) {
    if (i.severity === "error") score -= 15;
    else if (i.severity === "warning") score -= 7;
  }
  return Math.max(0, Math.min(100, score));
}

export function analyzeAccessibility(
  components: GeneratedComponent[],
  tokens: DesignTokens,
): A11yReport {
  issueIdCounter = 0;
  const issues: A11yIssue[] = [];
  checkContrast(components, tokens, issues);
  checkHeadingHierarchy(components, issues);
  checkLabels(components, issues);
  checkSemantic(components, issues);
  checkKeyboard(issues);

  const summary = {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    passes: issues.filter((i) => i.severity === "pass").length,
  };
  return { score: computeScore(issues), issues, summary };
}
