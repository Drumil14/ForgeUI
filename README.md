# ForgeUI

**A design-to-code toolchain for generating React components from Figma and verifying implementations against design tokens.**

ForgeUI connects design systems and frontend implementation through two workflows:

```text
Figma → React + Tailwind generation
```

and:

```text
Figma design tokens
        +
Rendered website
        ↓
Design-system verification
```

The project is implemented as a TypeScript monorepo containing a reusable core package, generation engine, verification engine, CLI, and Next.js web application.

---

## Live Demo

https://forge-ui-theta.vercel.app

---

## What ForgeUI Does

ForgeUI provides two primary workflows.

### Generate

```text
Figma file
    ↓
Design-token extraction
    ↓
Component classification
    ↓
React + Tailwind source generation
    ↓
Accessibility analysis
    ↓
Generated component library
```

### Verify

```text
Figma design tokens
          +
Live rendered webpage
          ↓
Computed DOM styles
          ↓
Deterministic matching
          ↓
Design-system violations
          ↓
JSON + HTML report
```

The verification path is deterministic and does not depend on an LLM.

---

# Figma Integration

ForgeUI includes a real integration with the **Figma REST API**.

The shared core defines a `FigmaClient` interface with two implementations:

```text
HttpFigmaClient
FixtureFigmaClient
```

### HttpFigmaClient

`HttpFigmaClient` requests files from:

```text
https://api.figma.com/v1/files/:fileKey
```

using a Figma personal access token.

The integration handles:

* Authentication failures
* Missing files
* Rate limiting
* Network failures
* Unexpected HTTP errors

The API token is used server-side or CLI-side and is not intentionally exposed to the browser.

### FixtureFigmaClient

Tests and offline workflows can use committed Figma JSON fixtures instead of making network requests.

This keeps the core generation and verification logic testable without:

* Network access
* Real credentials
* A Figma API token

---

# Web Import Flow

The Next.js application provides a server-side import route.

```text
Figma URL
    ↓
POST /api/import
    ↓
Parse file key
    ↓
Figma REST API
    ↓
Figma JSON
    ↓
Parser
    ↓
Parsed design
    ↓
Workspace UI
```

Invalid URLs and API errors are returned as structured responses.

---

# Design Token Extraction

ForgeUI parses Figma documents and derives design-system information including:

* Colors
* Typography
* Spacing
* Border radii
* Shadows

These tokens form the shared source of truth used by both generation and verification.

The token logic lives inside the framework-independent `@forgeui/core` package.

---

# Component Generation

The generation pipeline identifies supported design patterns and produces React source.

Examples of component categories handled by the parser include:

* Buttons
* Cards
* Inputs
* Badges
* Navigation
* Hero sections
* Footers

ForgeUI generates React + Tailwind source and also performs heuristic accessibility analysis.

The project does **not claim that every generated component is automatically accessible or production-ready**. Accessibility findings are generated as an additional analysis step.

---

# Verify Engine

The `verify` workflow compares an implemented webpage against design tokens extracted from Figma.

## Browser extraction

When Playwright is available, ForgeUI can render a webpage and inspect computed styles.

For each relevant element, it can capture information including:

* Text color
* Background color
* Font size
* Font weight
* Line height
* Padding
* Margin
* Gap
* Border radius
* Element bounds
* CSS selector information

The extractor outputs plain structured data so the matching engine can be tested independently from the browser.

---

## Deterministic matching

The matcher compares rendered values against token scales.

ForgeUI can identify issues such as:

### Off-scale spacing

Example:

```text
Design scale:

4
8
12
16
24

Rendered:

18px
```

ForgeUI can identify that value as being outside the expected spacing scale.

### Off-scale radius

Rendered border radii are compared against radii extracted from the Figma design.

### Off-scale typography

Font sizes can be compared against the typography scale extracted from Figma.

### Rogue colors

ForgeUI does not rely only on exact hexadecimal equality.

It includes perceptual color comparison using **OKLab**, allowing colors to be evaluated based on perceptual distance.

### Contrast

ForgeUI checks text/background contrast and can report WCAG contrast violations.

Large and normal text are handled using different contrast requirements.

---

# Reports

The verification process can produce:

```text
report.json
report.html
```

### JSON report

The JSON output contains machine-readable information including:

* Violations
* Severity
* Element selectors
* Summary information
* Elements checked
* Configuration
* CI budget status

### HTML report

The HTML report is self-contained and can include:

* Screenshot of the checked page
* Highlighted violation overlays
* Violation list
* Severity filtering
* Design-token drift information

The report can be opened without running a dedicated report server.

---

# CI Budget

ForgeUI supports configurable violation budgets.

For example:

```bash
forgeui verify <url> --file <file-key> --budget 0
```

If the number of relevant violations exceeds the configured budget, the CLI can return a non-zero exit code.

This allows verification to participate in CI workflows.

---

# CLI

ForgeUI exposes a command-line interface.

```text
forgeui
├── generate
└── verify
```

## Generate

Example:

```bash
forgeui generate <figma-file>
```

The generate workflow can write artifacts including:

```text
component-library.tsx
tokens.json
components/
```

### Verify

Example:

```bash
forgeui verify <url> --file <figma-file-key>
```

Verification supports options for areas such as:

* Output directory
* Violation budget
* Ignored selectors
* Matching tolerance
* Token input

---

# Monorepo Architecture

ForgeUI uses npm workspaces and TypeScript project references.

```text
ForgeUI/
│
├── apps/
│   └── web/
│       └── Next.js workspace
│
├── packages/
│   │
│   ├── core/
│   │   ├── Figma API types
│   │   ├── Figma clients
│   │   ├── URL parsing
│   │   ├── token extraction
│   │   └── color math
│   │
│   ├── generate/
│   │   ├── parser
│   │   ├── generator
│   │   ├── analyzer
│   │   └── exporter
│   │
│   ├── verify/
│   │   ├── extraction
│   │   ├── matching
│   │   └── reporting
│   │
│   └── cli/
│       └── command-line interface
│
└── fixtures/
    ├── figma/
    └── demo/
```

---

# Package Responsibilities

## `@forgeui/core`

Shared framework-independent logic including:

* Figma types
* Figma REST client
* Fixture Figma client
* File-key parsing
* Design-token models
* Token extraction
* Color utilities
* Perceptual color comparison
* Contrast utilities

## `@forgeui/generate`

Handles:

```text
Figma representation
        ↓
Parsing
        ↓
Component generation
        ↓
Accessibility analysis
        ↓
Export
```

## `@forgeui/verify`

Handles:

```text
Rendered UI
    ↓
Computed style extraction
    ↓
Token comparison
    ↓
Violations
    ↓
Reports
```

Playwright is an optional dependency used when live-page extraction is required.

## `@forgeui/cli`

Connects the packages through the `forgeui` command.

It exposes:

```text
generate
verify
```

## `apps/web`

A Next.js 15 + React 19 web interface for importing and inspecting Figma designs.

---

# Testing

ForgeUI uses **Vitest** across its package architecture.

The repository includes:

* Core unit tests
* Generation tests
* Verification tests
* Fixture-based integration tests
* Golden snapshot tests
* CLI end-to-end tests

### Fixture-based testing

The Figma API layer can be replaced with `FixtureFigmaClient`, allowing tests to use committed JSON files rather than external network calls.

### Deterministic verification tests

The verify engine uses committed computed-element fixtures to confirm that known violations are detected consistently.

Tests cover behavior including:

* Spacing violations
* Radius violations
* Color violations
* Contrast failures
* Ignore rules
* Matching tolerances
* CI budgets
* Severity ordering
* Edge cases

### CLI tests

End-to-end CLI tests verify behavior such as:

```text
forgeui --help

forgeui generate ...

forgeui verify ...
```

The tests also confirm generated files and CLI exit codes.

---

# Tech Stack

* TypeScript
* Node.js
* npm Workspaces
* TypeScript Project References
* Next.js 15
* React 19
* Tailwind CSS
* Figma REST API
* Playwright
* Vitest
* OKLab perceptual color math

---

# Running Locally

Requirements:

```text
Node.js 20+
npm
```

Install dependencies:

```bash
npm install
```

Build the packages and web application:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

Run the web application:

```bash
npm run web
```

Run the CLI locally:

```bash
npm run forgeui -- --help
```

---

# Using Real Figma Data

Set:

```env
FIGMA_API_KEY=
```

When real credentials are supplied, ForgeUI can use its HTTP Figma client to retrieve a Figma file through the REST API.

Tests do not require this credential because fixture clients are available.

---

# Available Scripts

```bash
npm run build
npm run build:packages
npm test
npm run test:watch
npm run typecheck
npm run clean
npm run web
npm run forgeui -- <command>
```

---

# What ForgeUI Does Not Currently Include

To keep descriptions of the project accurate:

* No LLM-powered generation
* No OpenAI or Anthropic API integration
* No database
* No PostgreSQL
* No Prisma
* No GraphQL
* No NestJS
* No TypeORM
* No Nx
* No Python backend

The design verification engine is intentionally deterministic and LLM-free.

---

# Project Goal

ForgeUI explores the gap between a design system and its actual implementation.

Instead of stopping at Figma-to-code generation, the project also checks whether a rendered frontend still follows the original design tokens.

That makes ForgeUI both a design-to-code experiment and a developer-tooling project around design-system consistency.
