import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconCode } from "@/components/ui/icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background grid */}
      <div
        aria-hidden="true"
        className="bg-grid absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs">
            <span className="eyebrow text-accent">v1.0</span>
            <span className="text-fg-muted">
              Figma to production-ready React, in seconds
            </span>
          </div>
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Ship the design system your team already drew.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-fg-muted sm:text-lg">
            ForgeUI turns Figma files into accessible React components and
            Tailwind design tokens. Inspect every class, audit every contrast
            ratio, export the whole library.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/workspace">
              <Button
                size="lg"
                iconRight={<IconArrowRight className="h-4 w-4" />}
              >
                Open the workspace
              </Button>
            </Link>
            <Link href="#how">
              <Button
                variant="secondary"
                size="lg"
                iconLeft={<IconCode className="h-4 w-4" />}
              >
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-fg-subtle">
            No signup. No database. Bring your Figma personal access token.
          </p>
        </div>

        {/* Floating product mock */}
        <div className="relative mt-16 sm:mt-20">
          <div className="absolute inset-x-0 -top-8 mx-auto h-32 max-w-3xl rounded-full bg-accent/10 blur-3xl" />
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bg-subtle" />
          <span className="h-2.5 w-2.5 rounded-full bg-bg-subtle" />
          <span className="h-2.5 w-2.5 rounded-full bg-bg-subtle" />
        </div>
        <div className="font-mono text-[10px] text-fg-subtle">
          forgeui.dev / workspace
        </div>
        <div className="w-12" />
      </div>

      {/* Three column layout */}
      <div className="grid grid-cols-[180px_1fr_240px] divide-x divide-border">
        {/* Sidebar */}
        <div className="space-y-1 p-3 text-[11px]">
          <div className="eyebrow mb-2 text-fg-subtle">Project</div>
          {["Pages", "Layers", "Assets", "Components", "Tokens"].map((label, i) => (
            <div
              key={label}
              className={
                i === 3
                  ? "rounded px-2 py-1.5 bg-bg-subtle text-fg"
                  : "rounded px-2 py-1.5 text-fg-muted"
              }
            >
              {label}
            </div>
          ))}
        </div>

        {/* Center preview */}
        <div className="flex min-h-[320px] flex-col bg-bg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[10px] text-fg-subtle">
            <div className="font-mono">Preview · Desktop</div>
            <div className="font-mono">100%</div>
          </div>
          <div className="bg-dots flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-sm rounded-lg border border-border bg-bg-elevated p-5 shadow-sm">
              <div className="eyebrow mb-2 text-accent">Featured</div>
              <h3 className="text-sm font-semibold text-fg">
                Linear-grade primitives
              </h3>
              <p className="mt-1.5 text-xs text-fg-muted">
                Buttons, cards, inputs, navbars — every component is
                semantic, responsive, and a11y-checked out of the box.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-fg px-3 py-1.5 text-xs font-medium text-bg"
                >
                  Get started
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-fg-muted"
                >
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-3 p-3 text-[11px]">
          <div className="eyebrow text-fg-subtle">Tailwind</div>
          <div className="space-y-1 font-mono text-[10px] leading-relaxed text-fg-muted">
            <div><span className="text-accent">flex</span> items-center gap-2</div>
            <div><span className="text-accent">rounded-md</span> bg-fg</div>
            <div>px-3 py-1.5 text-xs</div>
            <div><span className="text-accent">font-medium</span> text-bg</div>
          </div>
          <div className="eyebrow pt-2 text-fg-subtle">A11y score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold text-fg">94</span>
            <span className="text-[10px] text-success">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
