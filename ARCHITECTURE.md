# ForgeUI Architecture

This document describes ForgeUI's architecture: first the **original** single-app
design (as explored in Phase 0), then the **target monorepo** the codebase is
being refactored into so a new `verify` engine can share the same Figma/token core.

---

## 1. Original architecture (pre-refactor)

ForgeUI started life as a single **Next.js 15 (App Router)** application living in
`forgeui/`. It turns a Figma file URL into an accessible React + Tailwind component
library, entirely client-visible but with the Figma token kept server-side.

### Data flow

```
Figma URL
   │  (browser)
   ▼
POST /api/import  ──────────────────────────────► app/api/import/route.ts
   │  1. parseFigmaUrl(url)            utils/figma-url.ts   → { fileKey }
   │  2. fetchFigmaFile(fileKey, key)  services/figma.ts    → FigmaFileResponse (raw REST JSON)
   │  3. parseFigmaFile(file, key)     lib/parser/index.ts  → ParsedDesign
   ▼
ParsedDesign (JSON) ───────────────────────────► workspace UI (hooks/use-design, components/workspace/*)
```

`parseFigmaFile` is the heart of the pipeline. It runs six deterministic steps:

1. **`extractTokens(document)`** — `lib/parser/extract-tokens.ts`. Walks the whole
   node tree accumulating colors (from `fills`), typography (from `TEXT` `style`),
   spacing (auto-layout padding + `itemSpacing`), radii (`cornerRadius`), and
   shadows (`effects`). Counts usage, ranks, and names each token (Tailwind-flavoured
   50–950 color scale, semantic type roles, etc.). Output: `DesignTokens`.
2. **`collectGenerableNodes` + `generateComponent`** — promotes "interesting"
   descendants (Button/Card/Input/Badge/Navbar/Footer/Hero) into their own
   `GeneratedComponent`. Names are sanitized and de-duplicated.
3. **`synthesizePlaceholderComponents`** — `lib/parser/placeholder.ts`. If the file
   lacks a Button/Card/Input/Badge, a realistic placeholder is synthesized from the
   file's *own* extracted tokens so the workspace is never empty.
4. **`buildLayerTree`** — `lib/parser/build-layer-tree.ts`. Depth/breadth-capped
   tree for the Layers panel.
5. **`buildPages`** — maps Figma canvases to page records.
6. **`analyzeAccessibility`** — `lib/analyzer/accessibility.ts`. Heuristic WCAG-ish
   audit (contrast, heading order, labels, semantic HTML, keyboard) over the
   generated components + tokens.

### Where the reusable logic lives

| Concern | Files | Reusable by `verify`? |
| --- | --- | --- |
| Figma REST client + typed errors | `services/figma.ts` | **Yes** |
| Figma URL/file-key parsing | `utils/figma-url.ts` | **Yes** |
| Raw Figma API types | `types/figma.ts` | **Yes** |
| Token extraction | `lib/parser/extract-tokens.ts` | **Yes** (verify needs the token *model*) |
| Color math (hex/rgba, luminance, contrast, classify) | `utils/color.ts` | **Yes** |
| Token/design types | `types/index.ts` (partly) | **Yes** (token half) |
| Tailwind px-snapping maps | `utils/tailwind-map.ts` | generate-only |
| Component classification + generation | `lib/parser/classify-*`, `lib/generator/*` | generate-only |
| Accessibility analyzer | `lib/analyzer/accessibility.ts` | generate-only |
| Exporters | `lib/exporter/*` | generate-only |
| Web workspace UI | `app/**`, `components/**`, `hooks/**` | app-only |

**Conclusion of Phase 0:** the Figma/token logic is *not* deeply tangled into React —
it is already a set of pure functions operating on plain data (`FigmaFileResponse` →
`DesignTokens`). The only coupling is the `@/` path alias and the fact that it all
lives inside the Next.js app. It is a clean candidate for extraction into a shared,
framework-free package.

---

## 2. Target architecture (monorepo)

The project becomes an **npm-workspaces monorepo**. The Figma client + token model
move into a framework-free `@forgeui/core`; generation stays in `@forgeui/generate`;
the new `@forgeui/verify` and a shared `@forgeui/cli` are added; the Next.js app
becomes `apps/web` and consumes the packages.

```
forgeui/                       ← monorepo root
├─ package.json                ← workspaces + root scripts (test, build)
├─ tsconfig.base.json
├─ vitest.config.ts
├─ packages/
│  ├─ core/        @forgeui/core     Figma types, client (HTTP + fixture), URL parse,
│  │                                 token model + extraction, perceptual color math
│  ├─ generate/    @forgeui/generate parser → generator → analyzer → exporter (uses core)
│  ├─ verify/      @forgeui/verify   extract (Playwright) · match (deterministic) · report
│  └─ cli/         @forgeui/cli      `forgeui generate` + `forgeui verify` (bin: forgeui)
└─ apps/
   └─ web/         the existing Next.js workspace, now importing the packages
```

### `@forgeui/core` (shared)

The single source of truth for "what does this Figma file's design system look like."

- `figma/types.ts` — raw Figma REST types (from `types/figma.ts`).
- `figma/url.ts` — `parseFigmaUrl` (from `utils/figma-url.ts`).
- `figma/client.ts` — a `FigmaClient` **interface** with two implementations:
  - `HttpFigmaClient` — the real REST client (from `services/figma.ts`).
  - `FixtureFigmaClient` — reads a local JSON file, so **everything is testable
    without a Figma API token**. This is the seam where real credentials plug in.
- `tokens/types.ts` — `DesignTokens`, `ColorToken`, `SpacingToken`, … (token half of
  the old `types/index.ts`).
- `tokens/extract.ts` — `extractTokens` (from `lib/parser/extract-tokens.ts`).
- `tokens/color.ts` — hex/rgba/luminance/**contrast** helpers plus new **perceptual
  color** functions (sRGB → OKLab, `oklabDistance`) used by verify to detect rogue
  colors in a perceptually-uniform space rather than raw hex.

### `@forgeui/generate`

Everything that turns a parsed Figma file into React source, unchanged in behaviour:
parser (`classify`, `build-layer-tree`, `placeholder`, `index`), generator
(`build-classes`, `generate-component`, `tailwind-map`), analyzer, exporters, and the
`GeneratedComponent`/`ParsedDesign` types. It depends on `@forgeui/core`. A **golden
snapshot test** over the built-in sample Figma fixture proves the refactor is
behaviour-preserving.

### `@forgeui/verify` (new — see below)

### `@forgeui/cli`

A thin command layer exposing both flows behind one `forgeui` binary:

```
forgeui generate <figma-file> [--file-key] [--out]
forgeui verify   <url> --file <figma-file-key> [--budget N] [--ignore <selectors>]
```

### `apps/web`

The existing Next.js app. `@/*` still resolves to the app root; the app's former
`lib/`, `types/`, `utils/`, `services/` become thin barrels that re-export from the
packages (plus app-only UI types). No user-facing behaviour changes.

---

## 3. The `verify` engine (Phase 2)

`forgeui verify` diffs a **live rendered web page** against the **Figma design tokens**
and reports where the implementation drifted from the design system.

```
URL ──► extract/ (Playwright) ──► ComputedElement[]  ┐
                                                      ├─► match/ ──► Violation[] ──► report/
figma-file-key ──► @forgeui/core extractTokens ──► DesignTokens ┘                    ├─ report.json (CI, exit code)
                                                                                     └─ report.html (visual)
```

- **`extract/`** — Playwright loads the URL, walks the rendered DOM, and records per
  element: `color`, `background`, `font-size`, `font-weight`, `line-height`,
  `padding`, `margin`, `gap`, `border-radius`, a CSS selector path, and the bounding
  box. Pure data out — no matching logic here, so the matcher is testable against
  hand-authored fixtures without a browser.
- **`match/`** — a **deterministic, LLM-free** engine. Loads tokens via
  `@forgeui/core`, builds scales (spacing, type, radii, palette), and for each
  computed value finds the nearest token. It flags:
  - **off-scale spacing/radius** — e.g. 13px where the scale is 4/8/12/16.
  - **rogue color** — not within a perceptual-distance threshold of any palette color
    (compared in **OKLab**, not raw hex).
  - **off-scale font-size** — not in the type scale.
  - **WCAG AA contrast failures** between text and its resolved background.
  - Thresholds are configurable (ignore sub-1px diffs, ignore selectors/iframes).
- **`report/`** — `report.json` (machine-readable, severity levels, CI budget → exit
  code 1 when violations exceed budget) and `report.html` (screenshot with clickable
  violation overlays, sidebar grouped by type, severity filter).

### Testability / credentials

Nothing in the test suite requires a Figma token or network:
- The Figma layer is mocked behind `FigmaClient`; tests use `FixtureFigmaClient` with
  committed fixture JSON.
- The matcher runs on committed `ComputedElement[]` fixtures (deterministic).
- **To use real Figma data:** set `FIGMA_API_KEY` and pass a real `--file` key; the
  CLI swaps `FixtureFigmaClient` for `HttpFigmaClient`. This is the only place real
  credentials are needed.
