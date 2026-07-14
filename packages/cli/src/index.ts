import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  parseFigmaUrl,
  resolveFigmaClient,
  extractTokens,
  type FigmaFileResponse,
  type DesignTokens,
} from "@forgeui/core";
import {
  parseFigmaFile,
  exportLibrary,
  tokensToCss,
  tokensToTailwindTheme,
  tokensToJson,
} from "@forgeui/generate";
import {
  verify,
  exitCodeFor,
  type ExtractResult,
  type VerifyConfig,
} from "@forgeui/verify";
import { color, symbols, severitySymbol, Spinner, table } from "./ui.js";

// --------------------------------------------------------------------------
// Arg parsing
// --------------------------------------------------------------------------

interface Parsed {
  _: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): Parsed {
  const _: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else {
      _.push(a);
    }
  }
  return { _, flags };
}

function flagStr(flags: Parsed["flags"], key: string): string | undefined {
  const v = flags[key];
  return typeof v === "string" ? v : undefined;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// Shared: load a Figma file from a path, or a URL/key via a client
// --------------------------------------------------------------------------

async function loadFigmaFile(
  source: string,
  fixturesDir: string,
): Promise<{ file: FigmaFileResponse; fileKey: string; via: string }> {
  if (await fileExists(source)) {
    const raw = await readFile(source, "utf8");
    const file = JSON.parse(raw) as FigmaFileResponse;
    return { file, fileKey: file.name || source, via: `local file ${color.gray(source)}` };
  }
  const parsed = parseFigmaUrl(source);
  const fileKey = parsed?.fileKey ?? source;
  const { client, source: kind } = resolveFigmaClient({
    apiKey: process.env.FIGMA_API_KEY,
    fixtureDir: fixturesDir,
  });
  const file = await client.getFile(fileKey);
  return {
    file,
    fileKey,
    via: kind === "http" ? "Figma API" : `fixture ${color.gray(fixturesDir + "/" + fileKey + ".json")}`,
  };
}

// --------------------------------------------------------------------------
// generate
// --------------------------------------------------------------------------

async function cmdGenerate(p: Parsed): Promise<number> {
  const source = p._[0];
  if (!source) {
    console.error(`${symbols.cross} ${color.bold("forgeui generate")} needs a Figma file.\n`);
    console.error(usageGenerate());
    return 2;
  }
  const outDir = resolve(flagStr(p.flags, "out") ?? "forgeui-output");
  const fixturesDir = resolve(flagStr(p.flags, "fixtures") ?? "fixtures/figma");

  console.log(color.bold("\n  ForgeUI · generate\n"));
  const spin = new Spinner().start("Loading Figma file…");
  let file: FigmaFileResponse;
  let fileKey: string;
  let via: string;
  try {
    ({ file, fileKey, via } = await loadFigmaFile(source, fixturesDir));
  } catch (err) {
    spin.fail(`Could not load Figma file: ${(err as Error).message}`);
    return 1;
  }
  spin.succeed(`Loaded ${color.bold(file.name)} ${color.gray("via " + via)}`);

  const spin2 = new Spinner().start("Parsing tokens & generating components…");
  const design = parseFigmaFile(file, fileKey);
  spin2.succeed(
    `Generated ${color.bold(String(design.components.length))} components, ` +
      `${color.bold(String(design.tokens.colors.length))} colors, ` +
      `${color.bold(String(design.tokens.spacing.length))} spacing steps`,
  );

  const spin3 = new Spinner().start(`Writing output to ${color.gray(outDir)}…`);
  await mkdir(join(outDir, "components"), { recursive: true });
  await writeFile(join(outDir, "component-library.tsx"), exportLibrary(design));
  await writeFile(join(outDir, "tokens.css"), tokensToCss(design.tokens));
  await writeFile(join(outDir, "tailwind.config.ts"), tokensToTailwindTheme(design.tokens));
  await writeFile(join(outDir, "tokens.json"), tokensToJson(design.tokens));
  for (const c of design.components) {
    await writeFile(join(outDir, "components", `${c.name}.tsx`), c.source);
  }
  spin3.succeed(`Wrote ${color.bold(String(design.components.length + 4))} files to ${color.gray(outDir)}`);

  // Summary table: components by kind.
  const byKind = new Map<string, number>();
  for (const c of design.components) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);
  console.log("\n" + color.bold("  Components"));
  console.log(
    table(
      ["Kind", "Count"],
      Array.from(byKind.entries()).map(([k, n]) => [k, String(n)]),
    ),
  );
  const a = design.accessibility;
  console.log(
    `\n  ${color.bold("A11y score")} ${color.cyan(String(a.score) + "/100")} ` +
      `${color.gray("·")} ${a.summary.passes} passes ${color.gray("·")} ${a.summary.warnings} warnings ${color.gray("·")} ${a.summary.errors} errors\n`,
  );
  return 0;
}

// --------------------------------------------------------------------------
// verify
// --------------------------------------------------------------------------

async function loadTokens(p: Parsed, fixturesDir: string): Promise<{ tokens: DesignTokens; fileKey: string }> {
  const tokensPath = flagStr(p.flags, "tokens");
  if (tokensPath) {
    const raw = JSON.parse(await readFile(resolve(tokensPath), "utf8"));
    if (raw && Array.isArray(raw.colors)) {
      return { tokens: raw as DesignTokens, fileKey: flagStr(p.flags, "file") ?? "tokens" };
    }
    if (raw && raw.document) {
      return { tokens: extractTokens((raw as FigmaFileResponse).document), fileKey: flagStr(p.flags, "file") ?? raw.name };
    }
    throw new Error(`--tokens file ${tokensPath} is neither a DesignTokens nor a Figma file.`);
  }
  const fileFlag = flagStr(p.flags, "file");
  if (!fileFlag) throw new Error("verify needs --file <figma-file-key> (or --tokens <path>).");
  const { file, fileKey } = await loadFigmaFile(fileFlag, fixturesDir);
  return { tokens: extractTokens(file.document), fileKey };
}

async function cmdVerify(p: Parsed): Promise<number> {
  const url = p._[0];
  if (!url) {
    console.error(`${symbols.cross} ${color.bold("forgeui verify")} needs a URL.\n`);
    console.error(usageVerify());
    return 2;
  }
  const fixturesDir = resolve(flagStr(p.flags, "fixtures") ?? "fixtures/figma");
  const outDir = resolve(flagStr(p.flags, "out") ?? "forgeui-verify");
  const budget = Number(flagStr(p.flags, "budget") ?? 0);
  const ignore = (flagStr(p.flags, "ignore") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const config: Partial<VerifyConfig> = {
    budget: Number.isFinite(budget) ? budget : 0,
    ignore,
  };
  if (flagStr(p.flags, "tolerance")) config.tolerancePx = Number(flagStr(p.flags, "tolerance"));
  if (flagStr(p.flags, "color-delta")) config.colorDeltaThreshold = Number(flagStr(p.flags, "color-delta"));
  if (flagStr(p.flags, "contrast")) config.contrastMin = Number(flagStr(p.flags, "contrast"));

  console.log(color.bold("\n  ForgeUI · verify\n"));

  const spin = new Spinner().start("Loading design tokens…");
  let tokens: DesignTokens;
  let fileKey: string;
  try {
    ({ tokens, fileKey } = await loadTokens(p, fixturesDir));
  } catch (err) {
    spin.fail((err as Error).message);
    return 1;
  }
  spin.succeed(
    `Loaded tokens ${color.gray(`(${tokens.colors.length} colors, ${tokens.spacing.length} spacing, ${tokens.typography.length} type)`)}`,
  );

  // Extraction: live Playwright, or an injected fixture for deterministic runs.
  let extraction: ExtractResult | undefined;
  const elementsPath = flagStr(p.flags, "elements");
  if (elementsPath) {
    const raw = JSON.parse(await readFile(resolve(elementsPath), "utf8"));
    extraction = {
      elements: raw.elements,
      pageWidth: raw.pageWidth ?? 1280,
      pageHeight: raw.pageHeight ?? 800,
      viewport: raw.viewport ?? { width: 1280, height: 800 },
      screenshotDataUrl: raw.screenshotDataUrl ?? null,
    };
    console.log(`${symbols.info} Using injected extraction ${color.gray(`(${extraction.elements.length} elements)`)}`);
  }

  const spin2 = new Spinner().start(extraction ? "Matching against tokens…" : `Rendering ${color.gray(url)} with Playwright…`);
  let result;
  try {
    result = await verify({ url, fileKey, tokens, config, extraction });
  } catch (err) {
    spin2.fail(`Verification failed: ${(err as Error).message}`);
    return 1;
  }
  const { report, html } = result;
  spin2.succeed(
    `Checked ${color.bold(String(report.summary.elementsChecked))} elements — ` +
      `${color.bold(String(report.summary.total))} violations`,
  );

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "report.json"), JSON.stringify(report, null, 2));
  await writeFile(join(outDir, "report.html"), html);
  console.log(`  ${symbols.arrow} ${color.gray(join(outDir, "report.json"))}`);
  console.log(`  ${symbols.arrow} ${color.gray(join(outDir, "report.html"))}\n`);

  // Summary table by category.
  const labels: Record<string, string> = {
    spacing: "Spacing", radius: "Radius", "font-size": "Type scale", color: "Color", contrast: "Contrast",
  };
  const rows = Object.entries(report.summary.byType)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => [labels[t] ?? t, String(n)]);
  if (rows.length) {
    console.log(color.bold("  Violations by category"));
    console.log(table(["Category", "Count"], rows));
    console.log("");
  }

  // Top violations preview.
  const preview = report.violations.slice(0, 8);
  for (const v of preview) {
    console.log(`  ${severitySymbol(v.severity)} ${color.gray(v.selector)}\n    ${v.message}`);
  }
  if (report.violations.length > preview.length) {
    console.log(color.gray(`  … and ${report.violations.length - preview.length} more (see report.html)`));
  }

  const s = report.summary;
  const verdict = s.overBudget
    ? `${symbols.cross} ${color.red(`FAIL — ${s.errors + s.warnings} error+warning violations exceed budget of ${report.config.budget}`)}`
    : `${symbols.tick} ${color.green(`PASS — within budget of ${report.config.budget}`)}`;
  console.log(
    `\n  ${color.red(String(s.errors) + " errors")} ${color.gray("·")} ` +
      `${color.yellow(String(s.warnings) + " warnings")} ${color.gray("·")} ` +
      `${color.blue(String(s.infos) + " info")}`,
  );
  console.log(`  ${verdict}\n`);

  return exitCodeFor(report);
}

// --------------------------------------------------------------------------
// Help + dispatch
// --------------------------------------------------------------------------

function usageGenerate(): string {
  return [
    color.bold("forgeui generate <figma-file>"),
    "  Turn a Figma file into React + Tailwind components and token files.",
    "",
    "  <figma-file>        Path to a Figma JSON, a Figma URL, or a bare file key.",
    "  --out <dir>         Output directory (default: forgeui-output)",
    "  --fixtures <dir>    Fixture dir for offline file keys (default: fixtures/figma)",
    "",
    "  With FIGMA_API_KEY set, URLs/keys are fetched live; otherwise fixtures are used.",
  ].join("\n");
}

function usageVerify(): string {
  return [
    color.bold("forgeui verify <url> --file <figma-file-key>"),
    "  Diff a live page against the Figma design tokens.",
    "",
    "  <url>               The page to check (http(s):// or file://).",
    "  --file <key>        Figma file key (or path) providing the tokens.",
    "  --tokens <path>     Use a DesignTokens/Figma JSON directly instead of --file.",
    "  --budget <n>        Max error+warning violations before exit code 1 (default 0).",
    "  --ignore <sel,...>  Comma-separated selectors/substrings to skip.",
    "  --tolerance <px>    Ignore spacing/radius diffs under this many px (default 1).",
    "  --out <dir>         Output directory (default: forgeui-verify)",
    "",
    "  Writes report.json (CI) and report.html (visual).",
  ].join("\n");
}

function usage(): string {
  return [
    color.bold("\n  ForgeUI — design-to-code toolchain\n"),
    "  Usage: forgeui <command> [options]\n",
    "  Commands:",
    `    ${color.cyan("generate")}  <figma-file>                 Figma → React + Tailwind`,
    `    ${color.cyan("verify")}    <url> --file <figma-key>     Check a page against its tokens`,
    "",
    "  Run `forgeui <command> --help` for details.\n",
  ].join("\n");
}

export async function main(argv: string[]): Promise<number> {
  const cmd = argv[0];
  const rest = parseArgs(argv.slice(1));

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(usage());
    return 0;
  }
  if (cmd === "--version" || cmd === "-v") {
    console.log("forgeui 0.2.0");
    return 0;
  }
  if (cmd === "generate") {
    if (rest.flags.help) {
      console.log(usageGenerate());
      return 0;
    }
    return cmdGenerate(rest);
  }
  if (cmd === "verify") {
    if (rest.flags.help) {
      console.log(usageVerify());
      return 0;
    }
    return cmdVerify(rest);
  }
  console.error(`${symbols.cross} Unknown command: ${color.bold(cmd)}`);
  console.log(usage());
  return 2;
}
