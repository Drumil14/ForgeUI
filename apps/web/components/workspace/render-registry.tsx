"use client";

import type { GeneratedComponent } from "@/types";

/**
 * Live render registry.
 *
 * The generator produces TSX source strings that can be copied into a real
 * project. For the preview, we don't eval that source — that would be unsafe
 * and unstable. Instead, we render representative components keyed by `kind`
 * using the parsed metadata (classes, content, etc.) so users see something
 * faithful to what they'd actually get if they pasted the generated code into
 * their own app.
 */

interface RendererProps {
  component: GeneratedComponent;
}

function asContent(c: GeneratedComponent, fallback: string) {
  return c.content?.trim() || fallback;
}

function renderButton({ component }: RendererProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {asContent(component, "Get started")}
    </button>
  );
}

function renderCard({ component }: RendererProps) {
  const lines = (component.content ?? "").split("\n").filter(Boolean);
  const title = lines[0] ?? component.name;
  const body =
    lines.slice(1).join(" ") ||
    "Cards are reusable containers for related content. This preview renders the title and supporting copy ForgeUI extracted from your design.";
  return (
    <article className="w-full max-w-sm rounded-lg border border-border bg-bg-elevated p-5 shadow-sm">
      <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
      <div className="mt-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Learn more →
        </button>
      </div>
    </article>
  );
}

function renderNavbar({ component }: RendererProps) {
  const links = ["Product", "Pricing", "Docs", "Blog"];
  return (
    <nav
      aria-label="Preview navigation"
      className="flex w-full max-w-3xl items-center justify-between rounded-md border border-border bg-bg-elevated px-4 py-2.5"
    >
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-accent" aria-hidden="true" />
        <span className="font-display text-sm font-semibold text-fg">
          {asContent(component, "Acme")}
        </span>
      </div>
      <ul className="flex items-center gap-1">
        {links.map((l) => (
          <li key={l}>
            <a
              href="#"
              className="rounded px-2.5 py-1 text-xs text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              {l}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded-md bg-fg px-3 py-1.5 text-xs font-medium text-bg"
      >
        Sign in
      </button>
    </nav>
  );
}

function renderHero({ component }: RendererProps) {
  const lines = (component.content ?? "").split("\n").filter(Boolean);
  const title = lines[0] ?? "Build the system your designers already drew.";
  const subtitle =
    lines[1] ?? "A hero section generated from your Figma file. Headings, supporting copy, and primary actions, ready to ship.";
  return (
    <section className="w-full max-w-2xl py-12 text-center">
      <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-fg-muted">
        {subtitle}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg"
        >
          Primary action
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-4 py-2 text-sm text-fg-muted"
        >
          Secondary
        </button>
      </div>
    </section>
  );
}

function renderInput({ component }: RendererProps) {
  return (
    <div className="w-full max-w-sm space-y-1.5">
      <label
        htmlFor={`preview-input-${component.id}`}
        className="block text-xs font-medium text-fg"
      >
        {asContent(component, "Email address")}
      </label>
      <input
        id={`preview-input-${component.id}`}
        type="email"
        placeholder="you@example.com"
        className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent"
      />
      <p className="text-[11px] text-fg-subtle">
        We'll never share your email with anyone else.
      </p>
    </div>
  );
}

function renderBadge({ component }: RendererProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
      {asContent(component, "Active")}
    </span>
  );
}

function renderFooter({ component }: RendererProps) {
  return (
    <footer className="w-full max-w-3xl rounded-md border border-border bg-bg-elevated p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-accent" aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-fg">
              {asContent(component, "Acme")}
            </span>
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            © {new Date().getFullYear()} Acme, Inc.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
          {["Product", "Pricing", "Docs", "Blog", "Contact", "Privacy"].map((l) => (
            <a
              key={l}
              href="#"
              className="text-fg-muted transition-colors hover:text-fg"
            >
              {l}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function renderGeneric({ component }: RendererProps) {
  return (
    <div className="w-full max-w-md rounded-lg border border-dashed border-border bg-bg-elevated p-6">
      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {component.kind}
      </p>
      <h3 className="mt-2 font-display text-base font-semibold text-fg">
        {component.name}
      </h3>
      <p className="mt-1 text-sm text-fg-muted">
        {component.content?.trim() ||
          "Generic component preview. Inspect the source on the right for the full implementation."}
      </p>
    </div>
  );
}

const RENDERERS: Record<string, (p: RendererProps) => JSX.Element> = {
  Button: renderButton,
  Card: renderCard,
  Navbar: renderNavbar,
  Hero: renderHero,
  Input: renderInput,
  Badge: renderBadge,
  Footer: renderFooter,
};

export function RenderComponent({ component }: RendererProps) {
  const fn = RENDERERS[component.kind] ?? renderGeneric;
  return fn({ component });
}
