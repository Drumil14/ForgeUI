"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { VerifyReport } from "@forgeui/verify/browser";
import { ReportViewer } from "./report-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/utils/cn";

/**
 * The verification workbench.
 *
 * ForgeUI deliberately does NOT run hosted scans of arbitrary URLs: a shared
 * scanner that fetches any URL from our servers is an SSRF primitive (internal
 * network probing, cloud metadata endpoints, redirect tricks) and safe hosting
 * requires network isolation we don't control on this deployment. Instead,
 * verification runs locally via the CLI — where your page and your network
 * belong to you — and this page renders the resulting report interactively.
 */

type Source =
  | { kind: "none" }
  | { kind: "demo"; report: VerifyReport }
  | { kind: "upload"; report: VerifyReport; filename: string };

function isVerifyReport(x: unknown): x is VerifyReport {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.url === "string" &&
    Array.isArray(r.violations) &&
    typeof r.summary === "object" &&
    r.summary !== null
  );
}

const CLI_SNIPPET = `npx playwright install chromium
forgeui verify https://your-site.example \\
  --file <figma-file-key> --viewport desktop --budget 0 \\
  --out verify-report`;

export function VerifyWorkbench() {
  const [source, setSource] = useState<Source>({ kind: "none" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();

  const readFile = useCallback(async (file: File) => {
    setLoadError(null);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isVerifyReport(parsed)) {
        setLoadError(
          "That file isn't a ForgeUI verify report — expected the report.json written by `forgeui verify`.",
        );
        return;
      }
      setSource({ kind: "upload", report: parsed, filename: file.name });
    } catch {
      setLoadError("Could not parse that file as JSON.");
    }
  }, []);

  const loadDemo = useCallback(async () => {
    setLoadError(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/demo-report.json");
      if (!res.ok) throw new Error(String(res.status));
      const parsed: unknown = await res.json();
      if (!isVerifyReport(parsed)) throw new Error("bad shape");
      setSource({ kind: "demo", report: parsed });
    } catch {
      setLoadError("The demo report could not be loaded.");
    } finally {
      setDemoLoading(false);
    }
  }, []);

  const report =
    source.kind === "demo" || source.kind === "upload" ? source.report : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="eyebrow text-accent">Design verification</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">
          Check an implementation against its design tokens
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
          The <code className="font-mono text-[12px]">forgeui verify</code>{" "}
          engine renders a page in headless Chromium, walks every element&apos;s
          computed styles, and deterministically matches them against the Figma
          file&apos;s extracted tokens — off-scale spacing, rogue colors
          (compared perceptually in OKLab), type-scale drift, radius drift, and
          WCAG AA contrast failures. No AI, no screenshots-diffing heuristics:
          the same page and tokens always produce the same report.
        </p>
      </header>

      {!report && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Load a report */}
          <section
            aria-label="Load a verification report"
            className="space-y-4"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void readFile(f);
              }}
              className={cn(
                "grid min-h-[180px] cursor-pointer place-items-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-border bg-bg-elevated hover:border-border-strong",
              )}
            >
              <div>
                <p className="text-sm font-medium text-fg">
                  Drop a <span className="font-mono">report.json</span> here
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  …or click to browse. The report is parsed locally in your
                  browser — nothing is uploaded.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Choose a verify report JSON file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {loadError && (
              <p role="alert" className="text-xs text-danger">
                {loadError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => void loadDemo()} disabled={demoLoading}>
                {demoLoading ? "Loading…" : "Open the demo report"}
              </Button>
              <Link
                href="/demo"
                className="text-xs text-fg-muted underline-offset-2 hover:text-fg hover:underline"
              >
                or view the standalone HTML report →
              </Link>
            </div>
            <p className="text-[11px] leading-relaxed text-fg-subtle">
              The demo report is a real, pre-generated run of the engine over
              the repository&apos;s committed demo page — a marketing page with
              deliberately drifted spacing, colors, type sizes, radii, and two
              contrast failures — matched against the sample Figma fixture&apos;s
              tokens. It is labeled as a fixture because it was generated at
              build time, not by a live scan from this site.
            </p>
          </section>

          {/* How to run + security rationale */}
          <section aria-label="Run verification locally" className="space-y-4">
            <div className="rounded-lg border border-border bg-bg-elevated p-5">
              <p className="eyebrow text-fg-subtle">Run it on your site</p>
              <pre className="scrollbar-thin mt-3 overflow-auto rounded-md bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-fg">
                {CLI_SNIPPET}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void copy(CLI_SNIPPET.replace(/ \\\n {2}/g, " "))}
                >
                  {copied ? "Copied" : "Copy command"}
                </Button>
                <span className="text-[11px] text-fg-subtle">
                  then drop the generated{" "}
                  <span className="font-mono">report.json</span> here
                </span>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-fg-muted">
                <li>
                  <span className="font-mono text-[11px] text-fg">--budget N</span>{" "}
                  — exit code 1 when error+warning count exceeds N: wire it into
                  CI to block regressions.
                </li>
                <li>
                  <span className="font-mono text-[11px] text-fg">
                    --viewport desktop|tablet|mobile
                  </span>{" "}
                  — run the scan at each breakpoint.
                </li>
                <li>
                  <span className="font-mono text-[11px] text-fg">--tokens</span>{" "}
                  — use exported tokens JSON instead of a live Figma fetch.
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-bg-elevated p-5">
              <div className="flex items-center gap-2">
                <p className="eyebrow text-fg-subtle">
                  Why scans run locally, not here
                </p>
                <Badge tone="neutral">security</Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                A hosted &ldquo;scan any URL&rdquo; endpoint is a server-side
                request forgery primitive: it can be pointed at internal
                networks, cloud metadata services, or redirect chains, from our
                infrastructure. Doing that safely requires dedicated egress
                isolation, DNS pinning, and per-scan sandboxing that this
                deployment doesn&apos;t have — so instead of shipping an unsafe
                scanner, verification runs with the CLI on your machine or CI,
                and this page renders the resulting report. Your pages and your
                network stay yours.
              </p>
            </div>
          </section>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {source.kind === "demo" ? (
              <Badge tone="accent" title="Pre-generated at build time by running the real engine on the committed demo fixture — not a live scan">
                Demo fixture — real engine output
              </Badge>
            ) : (
              <Badge tone="neutral">
                {source.kind === "upload" ? source.filename : ""}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSource({ kind: "none" })}
            >
              ← Load a different report
            </Button>
          </div>
          <ReportViewer report={report} />
        </div>
      )}
    </main>
  );
}
