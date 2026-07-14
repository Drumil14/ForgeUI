import {
  IconAccessibility,
  IconCode,
  IconLayers,
  IconPackage,
  IconPalette,
  IconZap,
} from "@/components/ui/icons";
import { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <IconLayers className="h-5 w-5" />,
    eyebrow: "01",
    title: "Faithful node parsing",
    description:
      "Walks Frames, Groups, Auto Layout, Text, and Images. Classifies components by name and structure — Button, Card, Navbar, Hero, Input, Badge.",
  },
  {
    icon: <IconPalette className="h-5 w-5" />,
    eyebrow: "02",
    title: "Design tokens, extracted",
    description:
      "Colors, typography scale, spacing rhythm, radii, shadows. Output as CSS variables or a Tailwind theme object — both stay in sync.",
  },
  {
    icon: <IconCode className="h-5 w-5" />,
    eyebrow: "03",
    title: "Production-grade React",
    description:
      "Semantic HTML, forwardRef where it matters, accessible props, no leaked Figma artifacts. The code you'd actually ship.",
  },
  {
    icon: <IconAccessibility className="h-5 w-5" />,
    eyebrow: "04",
    title: "Accessibility built in",
    description:
      "WCAG 2.1 contrast checks, heading hierarchy validation, missing labels, keyboard nav. Every warning explains itself.",
  },
  {
    icon: <IconZap className="h-5 w-5" />,
    eyebrow: "05",
    title: "Live preview, responsive",
    description:
      "Desktop, tablet, mobile viewports. Click any component to inspect its classes, props, and rendered output side by side.",
  },
  {
    icon: <IconPackage className="h-5 w-5" />,
    eyebrow: "06",
    title: "Export anywhere",
    description:
      "Copy components individually, download the full library, or grab just the token files. Drop into any Next.js project.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow text-fg-subtle">Features</p>
          <h2 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Everything you need between Figma and main.
          </h2>
          <p className="mt-4 text-pretty text-fg-muted">
            ForgeUI doesn't try to replace designers or engineers. It removes
            the busywork between them — the part where a perfect Figma file
            becomes a slightly-off implementation.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex flex-col gap-3 bg-bg p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-fg">
                {f.icon}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-fg-subtle">{f.eyebrow}</span>
                  <h3 className="text-sm font-semibold text-fg">{f.title}</h3>
                </div>
                <p className="text-sm text-fg-muted">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
