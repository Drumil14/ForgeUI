# ForgeUI

**A design-to-code toolchain: generate React from Figma, then verify the deployed UI against the same design tokens.**

ForgeUI turns a Figma file into an accessible React + Tailwind component library, and then closes the loop — its `verify` engine diffs a *live rendered page* against the *Figma design tokens* and reports wherever the implementation drifted from the design system. Generation and verification share one framework-free core, so both flows agree on exactly what the design system is.

🔗 **Live demo:** [forge-ui-theta.vercel.app](https://forge-ui-theta.vercel.app) · verify report at [`/demo`](https://forge-ui-theta.vercel.app/demo)

---

## Why it exists

Most Figma-to-code tools stop at generation. ForgeUI treats the token model as the source of truth on *both* sides of the pipeline:

- **`generate`** — Figma file → React + Tailwind components, with a heuristic accessibility audit.
- **`verify`** — a **deterministic, LLM-free** design-QA engine. It loads the same tokens, walks a live page's rendered DOM with Playwright, and flags off-scale spacing, rogue colors (compared perceptually in OKLab, not raw hex), off-scale type, and WCAG AA contrast failures. Output is CI-friendly JSON (with an exit-code budget) and a visual HTML overlay report.

Keeping the matcher deterministic means results are reproducible and the critical path stays credible — no model in the loop deciding what counts as a violation.

---

## Monorepo layout

npm workspaces, TypeScript project references, Vitest. Node ≥ 20.

```
ForgeUI/
├─ packages/
│  ├─ core/       @forgeui/core      Figma types + client, URL parsing, token model
│  │                                 + extraction, perceptual color math (OKLab, WCAG contrast)
│  ├─ generate/   @forgeui/generate  parser → generator → analyzer → exporter
│  ├─ verify/     @forgeui/verify    extract (Playwright) · match (deterministic) · report
│  └─ cli/        @forgeui/cli       the `forgeui` binary (generate + verify)
├─ apps/
│  └─ web/        Next.js 15 (App Router) + React 19 workspace UI
└─ fixtures/      sample Figma file, tokens, and demo page for offline runs
```

`@forgeui/core` is the single source of truth for "what does this file's design system look like." `generate` and `verify` both depend on it; neither the web app nor the token logic is coupled to a framework. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full data-flow breakdown and the Phase 0 → monorepo refactor rationale.

---

## Quick start

```bash
git clone https://github.com/Drumil14/ForgeUI.git
cd ForgeUI
npm install
npm run build      # builds packages, then the web app
npm test           # unit + integration + e2e (Vitest)
```

Run the web workspace:

```bash
npm run web        # next dev  →  http://localhost:3000
```

---

## CLI

The `forgeui` binary exposes both flows. Run any command with `--help` for details.

```bash
forgeui <command> [options]

  generate  <figma-file>              Figma → React + Tailwind
  verify    <url> --file <figma-key>  Check a page against its tokens
```

### `forgeui generate`

```bash
forgeui generate <figma-file> [options]

  --out <dir>         Output directory (default: forgeui-output)
  --fixtures <dir>    Fixture dir for offline file keys (default: fixtures/figma)
```

### `forgeui verify`

```bash
forgeui verify <url> --file <figma-file-key> [options]

  --file <key>        Figma file key (or path) providing the tokens.
  --tokens <path>     Use a DesignTokens/Figma JSON directly instead of --file.
  --budget <n>        Max error+warning violations before exit code 1 (default 0).
  --ignore <sel,...>  Comma-separated selectors/substrings to skip.
  --tolerance <px>    Ignore spacing/radius diffs under this many px (default 1).
  --out <dir>         Output directory (default: forgeui-verify)
```

`verify` writes two artifacts to the output directory:

- **`report.json`** — machine-readable, with severity levels and a CI budget. Exceeding the budget exits `1`, so it drops straight into a pipeline.
- **`report.html`** — a page screenshot with clickable violation overlays and a sidebar grouped by violation type.

Try it offline against the committed fixtures — no Figma token or network required:

```bash
npm run forgeui -- verify https://forge-ui-theta.vercel.app \
  --tokens fixtures/tokens/forgeui-web.json
```

---

## How `verify` works

```
URL ───────────► extract/ (Playwright) ──► ComputedElement[] ┐
                                                             ├─► match/ ──► Violation[] ──► report/
figma-file-key ─► @forgeui/core extractTokens ─► DesignTokens ┘              ├─ report.json (CI, exit code)
                                                                             └─ report.html (visual)
```

- **`extract/`** — Playwright renders the URL and records, per element: color, background, font size/weight, line-height, padding, margin, gap, border-radius, a CSS selector path, and the bounding box. It emits pure data — no matching logic — so the matcher is testable against hand-authored fixtures without a browser.
- **`match/`** — builds scales (spacing, type, radii, palette) from the tokens and finds the nearest token for each computed value. It flags off-scale spacing/radius, rogue colors (perceptual OKLab distance beyond a threshold), off-scale font sizes, and WCAG AA contrast failures. Thresholds are configurable.
- **`report/`** — renders the JSON and HTML outputs described above.

---

## Testing & credentials

The suite runs entirely offline — no Figma token, no network:

- The Figma layer sits behind a `FigmaClient` interface. Tests use `FixtureFigmaClient`, which reads committed fixture JSON; `HttpFigmaClient` is the real REST implementation.
- The matcher runs against committed `ComputedElement[]` fixtures, so it's deterministic.
- `generate` is guarded by a **golden snapshot** over the built-in sample Figma file, proving refactors stay behaviour-preserving.

To run against **real Figma data**, set `FIGMA_API_KEY` and pass a real `--file` key — the CLI swaps `FixtureFigmaClient` for `HttpFigmaClient`. That's the only place real credentials are needed. Playwright is an optional dependency, pulled in only when you actually extract from a live page.

---

## Tech stack

TypeScript · npm workspaces · Vitest · Next.js 15 (App Router) · React 19 · Tailwind · Playwright · OKLab perceptual color

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run build` | Build all packages, then the web app |
| `npm run build:packages` | Build the four `@forgeui/*` packages |
| `npm test` | Run the full Vitest suite (builds packages first) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | Type-check via project references |
| `npm run web` | Start the Next.js dev server |
| `npm run forgeui -- <cmd>` | Run the CLI locally |
