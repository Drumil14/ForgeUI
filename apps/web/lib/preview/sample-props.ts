import type { ComponentKind, GeneratedComponent } from "@/types";

/**
 * Default props for rendering a generated component in the preview. These
 * mirror the props interfaces the generator emits per kind; the Props tab
 * lets the user override them live.
 */
export function samplePropsFor(
  component: GeneratedComponent,
): Record<string, unknown> {
  const content = component.content?.trim();
  const lines = (content ?? "").split("\n").filter(Boolean);

  const byKind: Partial<Record<ComponentKind, Record<string, unknown>>> = {
    Button: { children: content || "Get started" },
    Badge: { children: content || "New" },
    Card: {
      title: lines[0] || component.name,
      description:
        lines.slice(1).join(" ") ||
        "Supporting copy extracted from the design.",
    },
    Input: {
      label: content || "Email address",
      placeholder: "you@example.com",
      hint: "We'll never share your email.",
    },
    Navbar: {
      brand: "Acme",
      items: [
        { label: "Product", href: "#product" },
        { label: "Pricing", href: "#pricing" },
        { label: "Docs", href: "#docs" },
        { label: "Blog", href: "#blog" },
      ],
      action: "Sign in",
    },
    Hero: {
      headline: lines[0] || "Bring your designs to life",
      subhead:
        lines[1] ||
        "Headings, supporting copy, and primary actions — generated from your Figma file.",
      ctaLabel: "Get started",
    },
    Footer: {
      brand: "Acme",
      sections: [
        {
          heading: "Product",
          links: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
          ],
        },
        {
          heading: "Company",
          links: [
            { label: "About", href: "#about" },
            { label: "Contact", href: "#contact" },
          ],
        },
      ],
      legal: "© 2026 Acme, Inc.",
    },
  };

  return byKind[component.kind] ?? {};
}

/**
 * Parse a ComponentProp.type string into something the Props tab can build a
 * control for.
 */
export type PropControl =
  | { kind: "enum"; options: string[] }
  | { kind: "boolean" }
  | { kind: "string" }
  | { kind: "unsupported" };

export function controlForPropType(type: string): PropControl {
  const trimmed = type.trim();
  if (trimmed === "boolean") return { kind: "boolean" };
  if (trimmed === "string" || trimmed === "React.ReactNode")
    return { kind: "string" };
  // A union of string literals: "primary" | "secondary" | "ghost"
  const parts = trimmed.split("|").map((p) => p.trim());
  if (parts.length > 1 && parts.every((p) => /^".*"$/.test(p))) {
    return { kind: "enum", options: parts.map((p) => p.slice(1, -1)) };
  }
  return { kind: "unsupported" };
}
