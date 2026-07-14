import type { DesignTokens } from "@forgeui/core/browser";
import type { ComponentKind, GeneratedComponent } from "../types.js";

/**
 * When the imported file doesn't yield a full set of common components, we
 * synthesize realistic placeholders so the workspace stays demonstrably
 * complete. The placeholders use the file's *real* extracted tokens so they
 * still feel like they belong to the same design system.
 */

let placeholderCounter = 0;
const nextId = () => `p${++placeholderCounter}`;

function pickPrimaryColor(tokens: DesignTokens): string {
  const primary = tokens.colors.find(
    (c) => c.role === "primary" || c.role === "accent",
  );
  return primary?.hex ?? "#111111";
}

function pickRadius(tokens: DesignTokens): string {
  const r = tokens.radii[Math.min(2, tokens.radii.length - 1)]?.value ?? 8;
  if (r <= 4) return "rounded";
  if (r <= 8) return "rounded-md";
  if (r <= 12) return "rounded-lg";
  return "rounded-xl";
}

const TEMPLATES: Record<
  ComponentKind,
  ((tokens: DesignTokens) => GeneratedComponent) | undefined
> = {
  Button: (tokens) => {
    const primary = pickPrimaryColor(tokens);
    const radius = pickRadius(tokens);
    return {
      id: nextId(),
      name: "Button",
      kind: "Button",
      classes: `bg-[${primary}] text-white px-4 py-2 ${radius} text-sm font-medium`,
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
  primary: "bg-[${primary}] text-white hover:opacity-90 active:opacity-80",
  secondary: "border border-border bg-bg-elevated text-fg hover:bg-bg-subtle",
  ghost: "text-fg hover:bg-bg-subtle",
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
      className={\`inline-flex items-center justify-center font-medium ${radius} transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 \${sizes[size]} \${variants[variant]}\`}
    >
      {children}
    </button>
  );
}
`,
    };
  },

  Card: (tokens) => {
    const radius = pickRadius(tokens);
    return {
      id: nextId(),
      name: "Card",
      kind: "Card",
      classes: `border border-border bg-bg-elevated p-6 ${radius}`,
      content: "Feature card",
      props: [
        { name: "title", type: "string", description: "Card heading" },
        {
          name: "description",
          type: "string",
          description: "Body copy",
        },
        {
          name: "children",
          type: "React.ReactNode",
          description: "Card body content",
        },
      ],
      source: `import * as React from "react";

interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <article className="border border-border bg-bg-elevated p-6 ${radius}">
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
`,
    };
  },

  Input: () => ({
    id: nextId(),
    name: "Input",
    kind: "Input",
    classes:
      "px-3 py-2 text-sm bg-bg-elevated border border-border rounded-md",
    props: [
      { name: "label", type: "string", description: "Field label" },
      { name: "placeholder", type: "string", description: "Placeholder" },
      {
        name: "type",
        type: '"text" | "email" | "password"',
        defaultValue: '"text"',
        description: "Input type",
      },
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
Input.displayName = "Input";
`,
  }),

  Badge: () => ({
    id: nextId(),
    name: "Badge",
    kind: "Badge",
    classes: "inline-flex items-center px-2 py-0.5 rounded-full text-xs",
    content: "New",
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
  neutral: "bg-bg-subtle text-fg-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${tones[tone]}\`}>
      {children}
    </span>
  );
}
`,
  }),

  Navbar: undefined,
  Footer: undefined,
  Hero: undefined,
  Container: undefined,
  Section: undefined,
  Text: undefined,
  Image: undefined,
  Icon: undefined,
};

export function synthesizePlaceholderComponents(
  kind: ComponentKind,
  tokens: DesignTokens,
): GeneratedComponent | null {
  const template = TEMPLATES[kind];
  return template ? template(tokens) : null;
}

export function resetPlaceholderCounter(): void {
  placeholderCounter = 0;
}
