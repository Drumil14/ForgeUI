interface Step {
  number: string;
  title: string;
  description: string;
  code?: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Paste your Figma URL",
    description:
      "Drop in any file URL. ForgeUI extracts the file key, validates the format, and hands it off to the Figma REST API.",
    code: "https://figma.com/design/abc123/My-Design",
  },
  {
    number: "02",
    title: "Parse the tree",
    description:
      "Walks every Frame, Group, and Text node. Classifies components by name and structure. Builds a flat layer tree you can navigate.",
    code: 'parseFigmaFile(file) → ParsedDesign',
  },
  {
    number: "03",
    title: "Extract tokens",
    description:
      "Colors get named on a 50–950 scale. Spacing snaps to the closest Tailwind step. Typography, radii, and shadows ranked by frequency.",
    code: "DesignTokens { colors, typography, spacing }",
  },
  {
    number: "04",
    title: "Generate components",
    description:
      "Production-grade TSX with semantic markup, accessible props, and Tailwind utilities. Missing primitives are intelligently synthesized.",
    code: "<Button variant=\"primary\" size=\"md\" />",
  },
  {
    number: "05",
    title: "Audit accessibility",
    description:
      "Contrast ratios checked against WCAG AA. Heading hierarchy validated. Missing labels flagged. Every issue is explained, not just listed.",
    code: "A11yReport { score: 94, issues: [...] }",
  },
  {
    number: "06",
    title: "Export and ship",
    description:
      "Copy a single component, download the whole library, or grab just the tokens. Drop it into Next.js, Remix, Astro — anywhere React goes.",
    code: "downloadLibrary(design) → forgeui.tsx",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-border bg-bg-subtle">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow text-fg-subtle">How it works</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Six steps from a paste to a pull request.
          </h2>
          <p className="mt-4 text-pretty text-fg-muted">
            No black box. Every transformation is inspectable, every output
            editable, every token traceable back to its source node.
          </p>
        </div>

        <ol className="space-y-px overflow-hidden rounded-lg border border-border bg-border">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="grid grid-cols-1 gap-6 bg-bg p-6 sm:grid-cols-[80px_1fr_320px] sm:items-center sm:gap-8 sm:p-8"
            >
              <div className="font-display text-4xl font-semibold text-fg-subtle">
                {step.number}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-semibold text-fg">
                  {step.title}
                </h3>
                <p className="text-sm text-fg-muted">{step.description}</p>
              </div>
              {step.code && (
                <div className="rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-xs text-fg-muted">
                  {step.code}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
