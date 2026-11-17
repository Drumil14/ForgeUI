# ForgeUI Architecture

ForgeUI is an npm-workspaces monorepo with four framework-free packages and one
Next.js app. The guiding constraint everywhere: **one representation, consumed
twice is better than two representations kept in sync** — the preview executes
the generated code, the exporters and the CLI share one file-set builder, and
the verify matcher and the web report viewer share one violation model.

```
forgeui/
├─ packages/
│  ├─ core/       @forgeui/core      Figma types + client, URL parse, token model,
│  │                                 perceptual color math.  ./browser = no fs/net client.
│  ├─ generate/   @forgeui/generate  classify → Design IR → TSX generation → a11y
│  │                                 heuristics → export file set
│  ├─ verify/     @forgeui/verify    extract (Playwright) → match (deterministic) →
│  │                                 report + fix suggestions.  ./browser = no Playwright.
│  └─ cli/        @forgeui/cli       forgeui generate · forgeui verify
├─ apps/web/                         Next.js 15 workspace + verification workbench
└─ fixtures/                         committed Figma fixture, drifted demo page, tokens
```

---

## 1. `@forgeui/core`

The shared vocabulary for "what does this design system look like."

- `figma/types.ts` — the subset of the Figma REST schema ForgeUI consumes.
- `figma/client.ts` — `FigmaClient` interface with two implementations:
  - `HttpFigmaClient`: REST client with typed errors (`auth` / `not_found` /
    `rate_limit` / `network`), a 30s abort timeout, and `getImageUrls()` for
    the Images API (PNG for bitmaps, SVG for vectors).
  - `FixtureFigmaClient`: reads committed JSON — the seam that makes the whole
    toolchain testable and demoable with zero credentials.
- `tokens/` — `DesignTokens` model, `extractTokens()` (walks the node tree,
  ranks and names colors/type/spacing/radii/shadows), and color math including
  sRGB → OKLab conversion used by verify's perceptual color matching.
- **`@forgeui/core/browser`** re-exports everything except the client, so
  browser bundles never see `node:fs`.

## 2. `@forgeui/generate`

```
FigmaNode ──classifyComponentDetailed──► { kind, via: name|structure }
    │
    ├──buildIR──► IRNode (hierarchy, auto-layout, spacing, typography,
    │             fills, radius, text, componentId, source node identity)
    │
    └──generateComponent(finalName)──► GeneratedComponent { source, classes,
                  props, origin, sourceNodeId, pageId/pageName, ir }
```

Decisions that matter:

- **Names are finalized before source generation.** The parser sanitizes and
  de-duplicates all component names first, then bakes the final name into the
  TSX (function, props interface, displayName). Filename, barrel export, and
  metadata can never disagree — this was a real bug class (a `Button2` whose
  source still exported `Button`).
- **Provenance is first-class.** `origin` is `"extracted"` (designer-named
  layer), `"inferred"` (structural heuristics), or `"synthesized"` (a
  demonstration example built from the file's own tokens when a common kind is
  missing). Synthesized examples carry no `sourceNodeId`/`pageId`, are never
  listed on a Figma page, are grouped separately in the UI, and are disclosed
  in the export README. Pages list only components whose source node lives on
  that canvas.
- **The Design IR** is the shared intermediate representation. Canonical kinds
  (Button, Input, Card, Navbar, Hero, Footer, Badge) use accessible templates
  whose root classes derive from the node; Containers/Sections emit markup
  recursively from the IR — real hierarchy, semantic heading levels chosen by
  font size, labeled image placeholders — instead of a placeholder `<div>`.
- **The parser reports what it cannot translate**: `ParsedDesign.stats`
  counts nodes by type and lists unsupported features (gradients, image
  fills, blurs, inner shadows, slices) with counts; `ParsedDesign.assets`
  carries exportable bitmap/vector nodes for the Images API.
- `exportLibraryFiles()` is the **single source of truth for exports**:
  `components/<Name>.tsx`, `components/index.ts`, `tokens.css`, `tokens.json`,
  `tailwind.config.ts`, `README.md`. The web ZIP (jszip) and the CLI's on-disk
  output both consume it.

## 3. The sandboxed preview (apps/web)

The preview renders the **generated source itself** — not a lookalike:

```
GeneratedComponent.source (TSX)
   │  sucrase: typescript + jsx + imports → CommonJS     (parent, in-browser)
   ▼
postMessage {code, props, themeCss}
   ▼
<iframe sandbox="allow-scripts" srcDoc>        ← opaque origin: no cookies,
   runtime.js (committed esbuild bundle):        storage, or parent DOM access
   React 19 + ReactDOM + @tailwindcss/browser + axe-core
   - require() shim resolves ONLY react/react-dom
   - renders through an error boundary, reports height
   - compiles Tailwind utilities at runtime (incl. bg-[#hex] arbitrary values)
   - theme maps the semantic class vocabulary; accent comes from the
     imported design's own primary token
   - runs axe-core (WCAG A/AA + best-practice) on the rendered DOM and
     posts findings back
```

`scripts/build-preview-runtime.mjs` builds the runtime in `prebuild`; the
bundle is also committed so dev works without a build step. The Props tab
edits enum/boolean/string props live; overrides re-render the sandbox.
Preview/export consistency is enforced by tests that transpile, evaluate, and
`renderToStaticMarkup` every generated component through the same transform,
plus a strict-mode `tsc` compile of the full export in a clean temp project.

## 4. `@forgeui/verify`

```
URL ──extract (Playwright)──► ComputedElement[] + screenshot ┐
                                                             ├─► matchPage ──► Violation[]
DesignTokens (core) ──buildScales──► spacing/type/radius/palette scales ┘        │
                                                                                 ▼
                     report.json (summary, budget verdict, artifacts) · report.html (standalone)
                     suggestFix(violation) → deterministic CSS + Tailwind correction
```

- The extractor records computed styles, text, effective (ancestor-resolved)
  backgrounds, and bounding boxes. It holds **no matching logic**, so the
  matcher is unit-testable against committed element fixtures.
- The matcher is deterministic and LLM-free: off-scale spacing/radius
  (tolerance-aware, auto-centering margins excluded), type-scale drift, rogue
  colors by OKLab ΔE against the palette, and WCAG AA contrast with the
  large-text exception. Same inputs, same report — always.
- `report.json` embeds `artifacts` (screenshot data URL + page dimensions) so
  a single portable file drives the web viewer's overlays.
- **`@forgeui/verify/browser`** exports types + matcher + report + suggestions
  without importing the extract module, so the web bundle never pulls
  Playwright.

### Why there is no hosted scanner

A server endpoint that fetches arbitrary URLs is an SSRF primitive — it can be
aimed at internal networks, cloud metadata services, and redirect chains from
the host's network position. Doing this safely needs egress isolation, DNS
pinning, and per-scan sandboxing that this deployment does not control, so the
product decision is: **scans run via the CLI on machines the user controls;
the web app renders reports** (drag-and-drop a `report.json`, parsed locally,
or the committed demo fixture, which is labeled as pre-generated). CI
integration uses `--budget` for exit-code gating.

## 5. `apps/web`

- **Workspace**: left explorer (project / pages / layers / assets /
  components / tokens), center sandboxed canvas (viewports, zoom), right
  inspector (code, classes, a11y, live props, export). Panels resize via ARIA
  separator dividers (pointer + arrow keys, persisted); `1/2/3`, `+/−/0`,
  `j/k` keyboard shortcuts; stacked tabs under 1024px.
- **Accessibility reporting is tiered**: axe-core rendered-DOM findings
  (strongest), static heuristics (early warning), manual checklist — with an
  explicit "not WCAG certification" statement.
- **Demo honesty**: the built-in sample is the committed fixture run through
  the real parser at module load (it cannot drift from the engine), and the
  workspace banner says so. The `/verify` demo report is a real engine run
  over the committed, deliberately-drifted demo page, labeled as a fixture.
- **Import reliability**: AbortController with user-visible cancel, 45s
  timeout, request sequencing so a stale response can never overwrite a newer
  import, and one retry for transient failures (network / 429 / 5xx).
- `/api/import` is the only server surface: validates the URL, fetches with
  the server-side key, parses, best-effort resolves asset URLs, and returns
  plain data.

## 6. Testing strategy

Everything runs from committed fixtures — no Figma token, no network:

| Layer | What locks it |
| --- | --- |
| Token extraction + color math | unit tests (core) |
| Parser behaviour | golden snapshot + regression suites (naming-before-codegen, page provenance, synthesized labeling) |
| Generated code validity | transpile + evaluate + render every component (the preview's exact pipeline) **and** strict `tsc` on the full export |
| Matcher | 20 unit tests over committed `ComputedElement[]` fixtures |
| Fix suggestions / report | unit tests |
| CLI | end-to-end spawn tests, including a live Playwright verify of the demo page and budget exit codes |
| Extraction | live Playwright over `fixtures/demo/index.html`, including a determinism test (two extractions must be identical) |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, the full suite, the
production build, and a dogfooded verify budget gate.
