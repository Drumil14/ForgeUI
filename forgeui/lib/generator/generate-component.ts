import type { FigmaNode } from "@/types/figma";
import type { ComponentKind, ComponentProp, GeneratedComponent } from "@/types";
import { classifyComponent } from "../parser/classify-component";
import { buildTailwindClasses } from "./build-classes";

/**
 * Generate ready-to-paste TSX source from a Figma node.
 *
 * The generator produces one of a handful of canonical component shapes
 * (Button, Card, Input, Hero…). For nodes that don't match any template, it
 * falls back to a generic Container that mirrors the layout. Either way, the
 * output uses semantic HTML and Tailwind classes a designer would recognize.
 */

let idCounter = 0;
const nextId = () => `c${++idCounter}`;

interface GenerateOptions {
  maxDepth?: number;
  depth?: number;
}

const PROPS_BY_KIND: Record<ComponentKind, ComponentProp[]> = {
  Button: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "ghost"',
      defaultValue: '"primary"',
      description: "Visual treatment",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "Button size",
    },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Button label",
    },
    {
      name: "onClick",
      type: "() => void",
      description: "Click handler",
    },
  ],
  Card: [
    { name: "title", type: "string", description: "Card heading" },
    { name: "description", type: "string", description: "Body copy" },
    {
      name: "children",
      type: "React.ReactNode",
      description: "Card body content",
    },
  ],
  Navbar: [
    {
      name: "items",
      type: "Array<{ label: string; href: string }>",
      description: "Navigation links",
    },
  ],
  Hero: [
    { name: "headline", type: "string", description: "Primary message" },
    { name: "subhead", type: "string", description: "Supporting copy" },
    { name: "ctaLabel", type: "string", description: "Call-to-action label" },
  ],
  Footer: [
    {
      name: "sections",
      type: "Array<{ heading: string; links: Array<{ label: string; href: string }> }>",
      description: "Footer link groups",
    },
  ],
  Input: [
    { name: "label", type: "string", description: "Field label" },
    { name: "placeholder", type: "string", description: "Placeholder text" },
    {
      name: "type",
      type: '"text" | "email" | "password"',
      defaultValue: '"text"',
      description: "Input type",
    },
  ],
  Badge: [
    { name: "children", type: "React.ReactNode", description: "Badge label" },
    {
      name: "tone",
      type: '"neutral" | "success" | "warning" | "danger"',
      defaultValue: '"neutral"',
      description: "Color treatment",
    },
  ],
  Container: [
    {
      name: "children",
      type: "React.ReactNode",
      description: "Container contents",
    },
  ],
  Section: [
    {
      name: "children",
      type: "React.ReactNode",
      description: "Section contents",
    },
  ],
  Text: [{ name: "children", type: "React.ReactNode", description: "Text" }],
  Image: [
    { name: "src", type: "string", description: "Image source" },
    { name: "alt", type: "string", description: "Alt text" },
  ],
  Icon: [{ name: "label", type: "string", description: "ARIA label" }],
};

function findFirstText(node: FigmaNode): string | undefined {
  if (node.type === "TEXT" && node.characters) return node.characters;
  if (!node.children) return undefined;
  for (const c of node.children) {
    const t = findFirstText(c);
    if (t) return t;
  }
  return undefined;
}

function generateButton(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const label = findFirstText(node) ?? "Button";
  const source = `import * as React from "react";

interface ${name}Props {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const variants = {
  primary: "${classes} hover:opacity-90 active:opacity-80",
  secondary: "bg-transparent border border-current text-current hover:bg-current/5",
  ghost: "bg-transparent text-current hover:bg-current/10",
};

export function ${name}({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
}: ${name}Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={\`inline-flex items-center justify-center font-medium rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 \${sizes[size]} \${variants[variant]}\`}
    >
      {children}
    </button>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Button",
    source,
    classes,
    props: PROPS_BY_KIND.Button,
    content: label,
  };
}

function generateCard(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const title = findFirstText(node) ?? "Card title";
  const source = `import * as React from "react";

interface ${name}Props {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function ${name}({ title, description, children }: ${name}Props) {
  return (
    <article className="${classes} border border-border bg-bg-elevated p-6 rounded-xl">
      {title && (
        <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-fg-muted leading-relaxed">{description}</p>
      )}
      {children}
    </article>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Card",
    source,
    classes,
    props: PROPS_BY_KIND.Card,
    content: title,
  };
}

function generateInput(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const source = `import * as React from "react";

interface ${name}Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const ${name} = React.forwardRef<HTMLInputElement, ${name}Props>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? React.useId();
    const describedBy = error ? \`\${inputId}-error\` : hint ? \`\${inputId}-hint\` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={\`px-3 py-2 text-sm bg-bg-elevated border border-border rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 placeholder:text-fg-subtle \${className}\`}
          {...props}
        />
        {error && (
          <p id={\`\${inputId}-error\`} className="text-xs text-danger">{error}</p>
        )}
        {!error && hint && (
          <p id={\`\${inputId}-hint\`} className="text-xs text-fg-muted">{hint}</p>
        )}
      </div>
    );
  }
);
${name}.displayName = "${name}";
`;
  return {
    id: nextId(),
    name,
    kind: "Input",
    source,
    classes,
    props: PROPS_BY_KIND.Input,
  };
}

function generateBadge(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const label = findFirstText(node) ?? "Badge";
  const source = `import * as React from "react";

interface ${name}Props {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const tones = {
  neutral: "bg-bg-subtle text-fg-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function ${name}({ children, tone = "neutral" }: ${name}Props) {
  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${tones[tone]}\`}>
      {children}
    </span>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Badge",
    source,
    classes,
    props: PROPS_BY_KIND.Badge,
    content: label,
  };
}

function generateNavbar(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const source = `import * as React from "react";

interface NavItem {
  label: string;
  href: string;
}

interface ${name}Props {
  brand?: React.ReactNode;
  items: NavItem[];
  action?: React.ReactNode;
}

export function ${name}({ brand, items, action }: ${name}Props) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6"
      >
        <div className="flex items-center gap-2">{brand}</div>
        <ul className="hidden md:flex items-center gap-8">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-fg-muted hover:text-fg transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div>{action}</div>
      </nav>
    </header>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Navbar",
    source,
    classes,
    props: PROPS_BY_KIND.Navbar,
  };
}

function generateHero(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const headline = findFirstText(node) ?? "Bring your designs to life";
  const source = `import * as React from "react";

interface ${name}Props {
  headline: string;
  subhead?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function ${name}({ headline, subhead, ctaLabel, onCta }: ${name}Props) {
  return (
    <section className="relative w-full px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {headline}
        </h1>
        {subhead && (
          <p className="mt-6 text-pretty text-lg text-fg-muted leading-relaxed">
            {subhead}
          </p>
        )}
        {ctaLabel && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-11 items-center px-6 rounded-md bg-accent text-accent-fg text-sm font-medium hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Hero",
    source,
    classes,
    props: PROPS_BY_KIND.Hero,
    content: headline,
  };
}

function generateFooter(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const source = `import * as React from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  heading: string;
  links: FooterLink[];
}

interface ${name}Props {
  brand?: React.ReactNode;
  sections: FooterSection[];
  legal?: React.ReactNode;
}

export function ${name}({ brand, sections, legal }: ${name}Props) {
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">{brand}</div>
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-semibold text-fg">{section.heading}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-fg-muted hover:text-fg transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {legal && (
          <div className="mt-12 border-t border-border pt-6 text-xs text-fg-subtle">
            {legal}
          </div>
        )}
      </div>
    </footer>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Footer",
    source,
    classes,
    props: PROPS_BY_KIND.Footer,
  };
}

function generateContainer(node: FigmaNode, name: string): GeneratedComponent {
  const classes = buildTailwindClasses(node);
  const text = findFirstText(node);
  const source = `import * as React from "react";

interface ${name}Props {
  children?: React.ReactNode;
}

export function ${name}({ children }: ${name}Props) {
  return (
    <div className="${classes}">
      ${text ? `<span>${text}</span>` : "{children}"}
    </div>
  );
}
`;
  return {
    id: nextId(),
    name,
    kind: "Container",
    source,
    classes,
    props: PROPS_BY_KIND.Container,
    content: text,
  };
}

const GENERATORS: Record<
  ComponentKind,
  (node: FigmaNode, name: string) => GeneratedComponent
> = {
  Button: generateButton,
  Card: generateCard,
  Input: generateInput,
  Badge: generateBadge,
  Navbar: generateNavbar,
  Hero: generateHero,
  Footer: generateFooter,
  Container: generateContainer,
  Section: generateContainer,
  Text: generateContainer,
  Image: generateContainer,
  Icon: generateContainer,
};

function sanitizeName(name: string, kind: ComponentKind): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return cleaned || kind;
}

export function generateComponent(
  node: FigmaNode,
  opts: GenerateOptions = {},
): GeneratedComponent {
  const kind = classifyComponent(node);
  const name = sanitizeName(node.name, kind);
  const gen = GENERATORS[kind] ?? generateContainer;
  return gen(node, name);
}

export function resetIdCounter(): void {
  idCounter = 0;
}
