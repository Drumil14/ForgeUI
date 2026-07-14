import { describe, it, expect, beforeAll } from "vitest";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const bin = join(repoRoot, "packages", "cli", "bin", "forgeui.mjs");
const elementsFixture = join(repoRoot, "packages", "verify", "test", "fixtures", "computed-page.json");
const demoHtml = pathToFileURL(join(repoRoot, "fixtures", "demo", "index.html")).href;

let hasBrowser = false;

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [bin, ...args], {
      cwd: repoRoot,
      env: { ...process.env, NO_COLOR: "1" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

async function tmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "forgeui-e2e-"));
}

beforeAll(async () => {
  // The bin imports dist/*, which the root `pretest` builds. Sanity-check it exists.
  if (!existsSync(join(repoRoot, "packages", "cli", "dist", "index.js"))) {
    throw new Error("CLI dist not built — run `npm run build:packages` (npm test does this via pretest).");
  }
  try {
    const { chromium } = await import("playwright");
    hasBrowser = existsSync(chromium.executablePath());
  } catch {
    hasBrowser = false;
  }
});

describe("forgeui CLI — end to end", () => {
  it("prints help and exits 0", async () => {
    const { code, stdout } = await runCli(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("generate");
    expect(stdout).toContain("verify");
  });

  it("generate writes a component library and token files", async () => {
    const out = await tmp();
    try {
      const { code, stdout } = await runCli([
        "generate",
        join(repoRoot, "fixtures", "figma", "sample-marketing.json"),
        "--out", out,
      ]);
      expect(code).toBe(0);
      expect(stdout).toContain("components");
      await stat(join(out, "component-library.tsx"));
      await stat(join(out, "tokens.json"));
      await stat(join(out, "components", "Button.tsx"));
      const lib = await readFile(join(out, "component-library.tsx"), "utf8");
      expect(lib).toContain("export function");
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it("verify (injected extraction) fails the budget with exit code 1", async () => {
    const out = await tmp();
    try {
      const { code, stdout } = await runCli([
        "verify", "http://localhost/demo",
        "--file", "sample-marketing",
        "--elements", elementsFixture,
        "--out", out,
        "--budget", "0",
      ]);
      expect(code).toBe(1);
      expect(stdout).toContain("FAIL");
      const report = JSON.parse(await readFile(join(out, "report.json"), "utf8"));
      expect(report.summary.total).toBe(6);
      expect(report.summary.overBudget).toBe(true);
      const html = await readFile(join(out, "report.html"), "utf8");
      expect(html.startsWith("<!doctype html>")).toBe(true);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it("verify passes with a generous budget (exit code 0)", async () => {
    const out = await tmp();
    try {
      const { code, stdout } = await runCli([
        "verify", "http://localhost/demo",
        "--file", "sample-marketing",
        "--elements", elementsFixture,
        "--out", out,
        "--budget", "10",
      ]);
      expect(code).toBe(0);
      expect(stdout).toContain("PASS");
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it("verify --ignore filters out matching selectors", async () => {
    const out = await tmp();
    try {
      await runCli([
        "verify", "http://localhost/demo",
        "--file", "sample-marketing",
        "--elements", elementsFixture,
        "--out", out,
        "--budget", "10",
        "--ignore", "section.promo",
      ]);
      const report = JSON.parse(await readFile(join(out, "report.json"), "utf8"));
      expect(report.violations.some((v: { selector: string }) => v.selector.includes("section.promo"))).toBe(false);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it("exits 2 on an unknown command", async () => {
    const { code } = await runCli(["frobnicate"]);
    expect(code).toBe(2);
  });

  it("verify (live Playwright) renders the demo page and writes a report", async () => {
    if (!hasBrowser) {
      // No Chromium in this environment — the injected-extraction tests above
      // already cover the CLI wiring deterministically.
      return;
    }
    const out = await tmp();
    try {
      const { code, stdout } = await runCli([
        "verify", demoHtml,
        "--file", "sample-marketing",
        "--out", out,
        "--budget", "0",
      ]);
      expect(code).toBe(1); // demo has real contrast + drift violations
      expect(stdout).toContain("Checked");
      const report = JSON.parse(await readFile(join(out, "report.json"), "utf8"));
      expect(report.summary.elementsChecked).toBeGreaterThan(10);
      expect(report.violations.some((v: { type: string }) => v.type === "contrast")).toBe(true);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  }, 60_000);
});
