# ForgeUI

> Figma → production-ready React + Tailwind, with an accessibility audit included.

ForgeUI is a portfolio-grade Next.js 15 app that turns Figma files into accessible
React components and Tailwind design tokens. Paste a Figma file URL, get back:

- A parsed component library (Buttons, Cards, Navbars, Heroes, Inputs, Badges, Footers)
- Extracted design tokens — colors, typography, spacing, radii, shadows
- A live preview with desktop/tablet/mobile viewports and zoom
- An inspector with the generated source, Tailwind classes, props, and a11y report
- Exports for individual components, token files, or the full library

This is a frontend engineering showcase — no database, no auth, nothing to host.
The whole app runs locally with one environment variable.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Add your Figma personal access token
cp .env.example .env.local
# then edit .env.local and set FIGMA_API_KEY

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page,
or [/workspace](http://localhost:3000/workspace) to jump straight into the app.

Without a token, the workspace still loads with a built-in sample design so
you can explore every panel.

### Getting a Figma API key

1. Open Figma, click your avatar → **Settings**.
2. Scroll to **Personal access tokens**, click **Create new token**.
3. Give it any name; only the default read scope is needed.
4. Copy the token into `.env.local`.

The token is only ever used server-side via `/api/import`. It never reaches the browser.

---

## Stack

- **Next.js 15** (App Router, RSC, route handlers)
- **React 19**
- **TypeScript** in strict mode
- **Tailwind CSS** with CSS-variable-driven theming
- No external UI library, no animation library, no state library — just React Context.

## Project structure

```
app/
  api/import/        — Figma fetch + parse route handler
  workspace/         — The three-pane app shell
  page.tsx           — Marketing landing page
  layout.tsx         — Root layout, fonts, no-flash theme script
  globals.css        — Design tokens, light + dark, base styles

components/
  ui/                — Primitives: Button, Tabs, CodeBlock, Badge, ThemeToggle, etc.
  landing/           — Marketing sections
  workspace/         — Sidebar, Preview, Inspector + all their sub-panels

hooks/
  use-theme.ts       — Light/dark mode, persists to localStorage
  use-design.tsx     — Workspace state context (selected component, viewport, zoom, sidebar tab)
  use-figma-import.ts — POSTs to /api/import, handles loading/error/success
  use-copy.ts        — Copy-to-clipboard with timed reset

lib/
  parser/            — Figma tree → ParsedDesign
  generator/         — ParsedDesign → React + Tailwind source
  analyzer/          — Accessibility audit
  exporter/          — Tokens / library serialization
  sample-design.ts   — Built-in fallback design

services/figma.ts    — Figma REST client with typed errors
types/               — Shared TS types
utils/               — Color, URL, Tailwind-mapping helpers
```

## What it actually does

1. **Validates the URL.** Accepts `/file/`, `/design/`, `/proto/`, or a bare file key.
2. **Fetches the file** through a server route (so the token stays server-side).
3. **Parses the node tree.** Walks Frames, Groups, Auto Layout, Text, Images.
4. **Classifies components** by name and structural shape into a typed `ComponentKind`.
5. **Extracts tokens.** Colors get Tailwind-style 50–950 names. Spacing snaps to
   the closest Tailwind step. Typography, radii, and shadows ranked by frequency.
6. **Generates TSX** with semantic HTML, accessible props, and Tailwind utilities.
7. **Synthesizes placeholders.** If the Figma file is missing a Button, Card,
   Input, or Badge, ForgeUI builds one using the file's own extracted tokens, so
   the demo never feels broken.
8. **Audits accessibility** — contrast (WCAG AA), heading hierarchy, missing
   labels, keyboard navigation, semantic HTML usage. Every issue explains itself.
9. **Renders a live preview** of the selected component, with desktop / tablet /
   mobile viewports and zoom controls.
10. **Exports** — copy a single component, download just the tokens, or grab
    the entire library as one concatenated file.

## Notes & limitations

- The live preview renders a representative, hand-built version per `ComponentKind`,
  not a runtime eval of the generated source string. This keeps the preview safe
  and consistent while the export still delivers the real, copy-pasteable TSX.
- The accessibility analyzer uses heuristics, not a full DOM evaluation. It's
  intentionally biased toward warnings users can act on, not exhaustive WCAG coverage.
- Asset extraction (icons, images) surfaces what the parser detected but doesn't
  download bitmaps from Figma — that would require the `/images` endpoint and
  is out of scope for this build.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Serve production build
npm run type-check   # Run tsc --noEmit
```

## License

Portfolio project. Not affiliated with Figma.
