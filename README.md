# ForgeUI

**A design-to-code engineering workspace: import Figma designs, extract tokens, generate accessible React + Tailwind components, preview the real generated code in a sandbox, and verify that shipped implementations still match the design system.**

Live app: [forge-ui-theta.vercel.app](https://forge-ui-theta.vercel.app) · Demo verify report: [/demo](https://forge-ui-theta.vercel.app/demo) · Verification workbench: [/verify](https://forge-ui-theta.vercel.app/verify)

---

## What it does

```
Figma file ──► tokens + Design IR ──► generated TSX ──► sandboxed preview ──► ZIP / CLI export
                     │
                     └──► verify engine: live page ⟷ tokens ──► violations + fixes ──► report.json / report.html / web viewer
```

1. **Import** a Figma file (server-side API key) or explore the committed sample fixture.
2. **Extract tokens** — colors (named on a 50–950 scale), typography, spacing, radii, shadows — plus per-component provenance: which Figma page and node each component came from, and whether it was *extracted* (named layer), *inferred* (structural heuristics), or *synthesized* (a labeled demonstration example built from your tokens).
3. **Generate** React + TypeScript + Tailwind components. Canonical kinds (Button, Input, Card, Navbar, Hero, Footer, Badge) use accessible templates; generic sections are generated from a **Design IR** that mirrors the node hierarchy and auto-layout.
4. **Preview the actual generated code.** The source is transpiled (sucrase) and executed in an `allow-scripts`-only sandboxed iframe with React 19 and a runtime Tailwind compiler — there is no second "preview implementation" that could drift from the export. Props are editable live; viewports and zoom are keyboard-driven.
5. **Audit accessibility** in three honestly-labeled tiers: axe-core on the real rendered DOM (strongest), static design heuristics (early warning), and a manual-verification checklist. The score is a development aid, not WCAG certification.
6. **Verify implementations**: `forgeui verify <url>` renders a page in headless Chromium and deterministically matches every element's computed styles against the design tokens — off-scale spacing/radii, rogue colors (perceptual OKLab distance), type-scale drift, and WCAG AA contrast failures — then writes `report.json` (CI, budget → exit code) and `report.html` (standalone visual report). The web app's `/verify` page renders any report interactively with screenshot overlays and copyable CSS/Tailwind fixes.

## Monorepo layout

| Package | Purpose |
| --- | --- |
| `packages/core` | Figma REST client (HTTP + fixture), URL parsing, token model + extraction, perceptual color math. `@forgeui/core/browser` is the browser-safe surface. |
| `packages/generate` | Classifier → Design IR → component generator → accessibility heuristics → export file set (components, barrel, tokens.css/json, tailwind.config.ts, README). |
| `packages/verify` | Playwright extraction → deterministic matcher → report builders + fix suggestions. `@forgeui/verify/browser` ships without Playwright. |
| `packages/cli` | `forgeui generate` and `forgeui verify`. |
| `apps/web` | Next.js 15 workspace: explorer / sandboxed canvas / inspector, verification workbench, landing page. |
| `fixtures/` | Committed Figma fixture, drifted demo page, and token fixtures that power the demo and the entire test suite. |

## Quick start

```bash
npm install                 # Node 20+
npm test                    # 75 tests, no credentials needed (Playwright uses the committed demo page)
npm run web                 # Next.js dev server → http://localhost:3000
```

The workspace loads the committed sample fixture (parsed by the real engine) without any configuration.

### Importing your own Figma files

The Figma personal access token is **server-side only** — it is never sent to the browser or logged, and visitors to a hosted deployment cannot supply their own token.

```bash
cp apps/web/.env.example apps/web/.env.local   # set FIGMA_API_KEY
npm run web
```

Or skip the app entirely:

```bash
FIGMA_API_KEY=... npx forgeui generate https://figma.com/design/<key>/My-File --out my-library
```

### CLI

```bash
forgeui generate <figma-file> [--out dir] [--fixtures dir]
forgeui verify   <url> --file <figma-key> [--tokens path] [--viewport desktop|tablet|mobile|WxH]
                       [--budget n] [--ignore sel,...] [--tolerance px] [--out dir]
```

`<figma-file>` can be a URL, a bare file key, or a path to Figma JSON. Without `FIGMA_API_KEY`, keys resolve against local fixtures — the whole toolchain runs offline.

### Verification in CI

`--budget N` makes `forgeui verify` exit 1 when the error+warning count exceeds N:

```yaml
- run: npx playwright install --with-deps chromium
- run: npx forgeui verify https://staging.example.com \
         --tokens design-tokens.json --budget 0 --out verify-report
- uses: actions/upload-artifact@v4
  if: failure()
  with: { name: verify-report, path: verify-report }
```

This repository's own CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) dogfoods the gate against the committed demo page.

## Security model

- **Figma credentials** live only in server/CLI environments; the browser receives parsed results and short-lived CDN asset URLs.
- **Generated-code preview** executes in an iframe sandboxed to `allow-scripts` only (opaque origin — no cookies, storage, or parent-DOM access), with a module shim that resolves nothing but React. No `eval` in the app context, no CDN dependency.
- **No hosted URL scanner.** A server that fetches arbitrary URLs is an SSRF primitive (internal networks, cloud metadata, redirect chains). Verification deliberately runs via the CLI on machines you control; the web app only *renders* reports. The `/verify` page documents this decision.

## Testing

```bash
npm run typecheck   # strict TS across all packages
npm run lint        # eslint (web app)
npm test            # vitest: 75 tests
```

Coverage includes: token extraction, classifier + parser regressions (naming finalized before codegen, page provenance, synthesized labeling), golden parse snapshot, export file-set consistency, **strict-mode `tsc` compilation of the exported library in a clean project**, **transpile-evaluate-render of every generated component through the exact preview pipeline**, the deterministic matcher, fix suggestions, report builders, CLI end-to-end (including a live Playwright verify of the demo page), and extraction determinism. Nothing requires a Figma token.

## Known limitations

- Generation targets common marketing/UI compositions; complex constraint layouts, rotation, masks, and multi-fill paints are simplified. Unsupported features (gradients, image fills, blurs, inner shadows, slices) are **counted and reported** in the workspace rather than silently dropped.
- Component variants are captured as `componentId` references in the IR but not yet expanded into typed variant unions.
- The verify engine checks token conformance and contrast — it is not pixel-diffing, and it does not claim full layout verification.
- axe-core automates roughly a third of WCAG; the manual checklist in the A11y tab is part of the product, not a disclaimer.
- Live asset previews (Figma Images API) require a server API key; fixture imports list assets without renders.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design: package boundaries, the Design IR, the sandboxed preview protocol, and the verify pipeline.

## License

No license has been granted yet — all rights reserved until a license is chosen. (Open an issue if you need one sooner.)
