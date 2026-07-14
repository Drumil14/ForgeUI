import type { ParsedDesign } from "@/types";

/**
 * A handcrafted "import result" that demonstrates the full workspace without
 * requiring a Figma API key. The shape is identical to what the real parser
 * produces, so every panel renders correctly against it.
 *
 * This is the file the workspace falls back to so the demo is never empty.
 */

export const sampleDesign: ParsedDesign = {
  fileName: "Acme Marketing Site — v3",
  fileKey: "AbCdEf1234567890",
  lastModified: "2025-08-14T10:32:00Z",
  tokens: {
    colors: [
      {
        name: "primary-600",
        hex: "#e84e27",
        rgba: "rgba(232, 78, 39, 1)",
        usage: 18,
        role: "primary",
      },
      {
        name: "primary-700",
        hex: "#c43d1c",
        rgba: "rgba(196, 61, 28, 1)",
        usage: 6,
        role: "primary",
      },
      {
        name: "secondary-500",
        hex: "#2563eb",
        rgba: "rgba(37, 99, 235, 1)",
        usage: 9,
        role: "secondary",
      },
      {
        name: "surface-50",
        hex: "#fafaf9",
        rgba: "rgba(250, 250, 249, 1)",
        usage: 24,
        role: "surface",
      },
      {
        name: "surface-100",
        hex: "#f5f5f4",
        rgba: "rgba(245, 245, 244, 1)",
        usage: 11,
        role: "surface",
      },
      {
        name: "neutral-200",
        hex: "#e7e5e4",
        rgba: "rgba(231, 229, 228, 1)",
        usage: 22,
        role: "neutral",
      },
      {
        name: "neutral-500",
        hex: "#78716c",
        rgba: "rgba(120, 113, 108, 1)",
        usage: 17,
        role: "neutral",
      },
      {
        name: "neutral-800",
        hex: "#292524",
        rgba: "rgba(41, 37, 36, 1)",
        usage: 28,
        role: "neutral",
      },
      {
        name: "neutral-900",
        hex: "#1c1917",
        rgba: "rgba(28, 25, 23, 1)",
        usage: 32,
        role: "neutral",
      },
    ],
    typography: [
      {
        name: "display",
        fontFamily: "Inter",
        fontSize: 60,
        fontWeight: 600,
        lineHeight: 64,
        usage: 1,
      },
      {
        name: "h1",
        fontFamily: "Inter",
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 44,
        usage: 4,
      },
      {
        name: "h2",
        fontFamily: "Inter",
        fontSize: 28,
        fontWeight: 600,
        lineHeight: 34,
        usage: 6,
      },
      {
        name: "h3",
        fontFamily: "Inter",
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 28,
        usage: 12,
      },
      {
        name: "body",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 26,
        usage: 38,
      },
      {
        name: "body-2",
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 22,
        usage: 21,
      },
      {
        name: "caption",
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 16,
        usage: 14,
      },
    ],
    spacing: [
      { name: "spacing-4", value: 4, usage: 18 },
      { name: "spacing-8", value: 8, usage: 26 },
      { name: "spacing-12", value: 12, usage: 14 },
      { name: "spacing-16", value: 16, usage: 32 },
      { name: "spacing-24", value: 24, usage: 19 },
      { name: "spacing-32", value: 32, usage: 11 },
      { name: "spacing-48", value: 48, usage: 7 },
      { name: "spacing-64", value: 64, usage: 4 },
      { name: "spacing-96", value: 96, usage: 3 },
    ],
    radii: [
      { name: "radius-none", value: 0 },
      { name: "radius-sm", value: 4 },
      { name: "radius-md", value: 8 },
      { name: "radius-lg", value: 12 },
      { name: "radius-xl", value: 16 },
      { name: "radius-full", value: 9999 },
    ],
    shadows: [
      { name: "shadow-sm", value: "0px 1px 2px 0px rgba(0,0,0,0.05)" },
      { name: "shadow-md", value: "0px 4px 6px -1px rgba(0,0,0,0.10)" },
      { name: "shadow-lg", value: "0px 10px 15px -3px rgba(0,0,0,0.10)" },
      { name: "shadow-xl", value: "0px 20px 25px -5px rgba(0,0,0,0.10)" },
    ],
  },
  components: [
    {
      id: "c1",
      name: "PrimaryButton",
      kind: "Button",
      classes:
        "bg-[#e84e27] text-white px-4 py-2 rounded-md text-sm font-medium",
      content: "Get started",
      props: [
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
      source: `import * as React from "react";

interface ButtonProps {
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
  primary: "bg-[#e84e27] text-white hover:opacity-90 active:opacity-80",
  secondary: "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
  ghost: "text-neutral-900 hover:bg-neutral-100",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
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
`,
    },
    {
      id: "c2",
      name: "FeatureCard",
      kind: "Card",
      classes: "border border-neutral-200 bg-white p-6 rounded-xl",
      content: "Lightning-fast imports",
      props: [
        { name: "title", type: "string", description: "Card heading" },
        { name: "description", type: "string", description: "Body copy" },
        { name: "icon", type: "React.ReactNode", description: "Leading icon" },
      ],
      source: `import * as React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <article className="border border-neutral-200 bg-white p-6 rounded-xl hover:border-neutral-300 transition-colors">
      {icon && (
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{description}</p>
    </article>
  );
}
`,
    },
    {
      id: "c3",
      name: "MarketingNavbar",
      kind: "Navbar",
      classes:
        "sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur",
      props: [
        {
          name: "brand",
          type: "React.ReactNode",
          description: "Logo or wordmark",
        },
        {
          name: "items",
          type: "Array<{ label: string; href: string }>",
          description: "Navigation links",
        },
        {
          name: "action",
          type: "React.ReactNode",
          description: "Right-aligned CTA",
        },
      ],
      source: `import * as React from "react";

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  brand?: React.ReactNode;
  items: NavItem[];
  action?: React.ReactNode;
}

export function Navbar({ brand, items, action }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
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
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
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
`,
    },
    {
      id: "c4",
      name: "MarketingHero",
      kind: "Hero",
      classes: "w-full px-6 py-24 lg:py-32",
      content: "Ship interfaces faster",
      props: [
        {
          name: "headline",
          type: "string",
          description: "Primary message",
        },
        {
          name: "subhead",
          type: "string",
          description: "Supporting copy",
        },
        {
          name: "ctaLabel",
          type: "string",
          description: "Call-to-action label",
        },
      ],
      source: `import * as React from "react";

interface HeroProps {
  headline: string;
  subhead?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function Hero({ headline, subhead, ctaLabel, onCta }: HeroProps) {
  return (
    <section className="relative w-full px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          {headline}
        </h1>
        {subhead && (
          <p className="mt-6 text-pretty text-lg text-neutral-500 leading-relaxed">
            {subhead}
          </p>
        )}
        {ctaLabel && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-11 items-center px-6 rounded-md bg-[#e84e27] text-white text-sm font-medium hover:opacity-90"
            >
              {ctaLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
`,
    },
    {
      id: "c5",
      name: "EmailInput",
      kind: "Input",
      classes:
        "px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md",
      props: [
        { name: "label", type: "string", description: "Field label" },
        { name: "placeholder", type: "string", description: "Placeholder" },
        { name: "error", type: "string", description: "Error message" },
      ],
      source: `import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? React.useId();
    const describedBy = error ? \`\${inputId}-error\` : hint ? \`\${inputId}-hint\` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={\`px-3 py-2 text-sm bg-white border border-neutral-200 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e84e27] focus-visible:outline-offset-1 placeholder:text-neutral-400 \${className}\`}
          {...props}
        />
        {error && (
          <p id={\`\${inputId}-error\`} className="text-xs text-red-600">{error}</p>
        )}
        {!error && hint && (
          <p id={\`\${inputId}-hint\`} className="text-xs text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
`,
    },
    {
      id: "c6",
      name: "StatusBadge",
      kind: "Badge",
      classes: "inline-flex items-center px-2 py-0.5 rounded-full text-xs",
      content: "Beta",
      props: [
        {
          name: "children",
          type: "React.ReactNode",
          description: "Badge label",
        },
        {
          name: "tone",
          type: '"neutral" | "success" | "warning" | "danger"',
          defaultValue: '"neutral"',
          description: "Color treatment",
        },
      ],
      source: `import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const tones = {
  neutral: "bg-neutral-100 text-neutral-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${tones[tone]}\`}>
      {children}
    </span>
  );
}
`,
    },
    {
      id: "c7",
      name: "SiteFooter",
      kind: "Footer",
      classes: "border-t border-neutral-200 bg-neutral-50",
      props: [
        {
          name: "brand",
          type: "React.ReactNode",
          description: "Footer brand mark",
        },
        {
          name: "sections",
          type: "Array<FooterSection>",
          description: "Link groups",
        },
      ],
      source: `import * as React from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  heading: string;
  links: FooterLink[];
}

interface FooterProps {
  brand?: React.ReactNode;
  sections: FooterSection[];
  legal?: React.ReactNode;
}

export function Footer({ brand, sections, legal }: FooterProps) {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">{brand}</div>
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-semibold text-neutral-900">{section.heading}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
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
          <div className="mt-12 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
            {legal}
          </div>
        )}
      </div>
    </footer>
  );
}
`,
    },
  ],
  pages: [
    {
      id: "p1",
      name: "Marketing",
      componentIds: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"],
    },
    { id: "p2", name: "Pricing", componentIds: ["c1", "c2", "c3", "c6"] },
    { id: "p3", name: "Components", componentIds: ["c1", "c5", "c6"] },
  ],
  layerTree: [
    {
      id: "p1",
      name: "Marketing",
      type: "CANVAS",
      depth: 0,
      children: [
        {
          id: "f1",
          name: "Landing / Desktop",
          type: "FRAME",
          depth: 1,
          children: [
            {
              id: "f1-1",
              name: "Navbar",
              type: "FRAME",
              depth: 2,
              children: [
                { id: "f1-1-1", name: "Logo", type: "FRAME", depth: 3 },
                { id: "f1-1-2", name: "Nav Links", type: "FRAME", depth: 3 },
                {
                  id: "f1-1-3",
                  name: "CTA / Get started",
                  type: "INSTANCE",
                  depth: 3,
                },
              ],
            },
            {
              id: "f1-2",
              name: "Hero",
              type: "FRAME",
              depth: 2,
              children: [
                { id: "f1-2-1", name: "Eyebrow", type: "TEXT", depth: 3 },
                { id: "f1-2-2", name: "Headline", type: "TEXT", depth: 3 },
                { id: "f1-2-3", name: "Subhead", type: "TEXT", depth: 3 },
                { id: "f1-2-4", name: "CTA Group", type: "FRAME", depth: 3 },
              ],
            },
            {
              id: "f1-3",
              name: "Feature Grid",
              type: "FRAME",
              depth: 2,
              children: [
                { id: "f1-3-1", name: "FeatureCard 1", type: "FRAME", depth: 3 },
                { id: "f1-3-2", name: "FeatureCard 2", type: "FRAME", depth: 3 },
                { id: "f1-3-3", name: "FeatureCard 3", type: "FRAME", depth: 3 },
              ],
            },
            { id: "f1-4", name: "Footer", type: "FRAME", depth: 2 },
          ],
        },
      ],
    },
    {
      id: "p2",
      name: "Pricing",
      type: "CANVAS",
      depth: 0,
      children: [
        {
          id: "f2",
          name: "Pricing / Desktop",
          type: "FRAME",
          depth: 1,
          children: [
            { id: "f2-1", name: "Plan Card / Starter", type: "FRAME", depth: 2 },
            { id: "f2-2", name: "Plan Card / Team", type: "FRAME", depth: 2 },
            { id: "f2-3", name: "Plan Card / Enterprise", type: "FRAME", depth: 2 },
          ],
        },
      ],
    },
  ],
  accessibility: {
    score: 88,
    issues: [
      {
        id: "a1",
        severity: "pass",
        category: "contrast",
        title: "9 color pairs meet WCAG AA",
        description:
          "Text on surface combinations reach contrast ratios of 4.5 or higher, the WCAG AA threshold for body text.",
      },
      {
        id: "a2",
        severity: "pass",
        category: "heading",
        title: "Heading outline is linear",
        description:
          "Exactly one h1 was emitted and subsequent headings step down without skipping levels.",
      },
      {
        id: "a3",
        severity: "pass",
        category: "label",
        title: "1 input ships with associated labels",
        description:
          "Input components wire htmlFor to the input id and route errors through aria-describedby.",
      },
      {
        id: "a4",
        severity: "warning",
        category: "contrast",
        title: "1 secondary text combination falls just below AA",
        description:
          "neutral-500 on surface-100 sits at 4.21:1 — close, but body copy needs 4.5:1. Try neutral-600 (#57534e) for a 5.74:1 ratio.",
      },
      {
        id: "a5",
        severity: "info",
        category: "keyboard",
        title: "Keyboard navigation guidance",
        description:
          "Generated buttons and inputs use native elements, so Tab order follows source order. Test focus visibility by tabbing through the preview — every interactive element should show a clear focus ring.",
      },
      {
        id: "a6",
        severity: "pass",
        category: "semantic",
        title: "86% of components use semantic HTML",
        description:
          "header, nav, section, article, footer, and button elements are emitted in place of generic divs.",
      },
    ],
    summary: { errors: 0, warnings: 1, passes: 4 },
  },
};
