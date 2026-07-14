import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Inline SVG icon set. Hand-tuned to a single visual style (1.5px strokes,
 * 24px viewBox, rounded caps) rather than pulling in an icon library.
 * Every icon accepts standard SVG props plus an optional className.
 */

type Props = React.SVGAttributes<SVGElement> & { className?: string };

const baseProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconForge = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={cn(className)} {...p}>
    <path d="M3 12 L12 3 L21 12 L12 21 Z" />
    <path d="M8 12 L12 8 L16 12 L12 16 Z" />
  </svg>
);

export const IconSun = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const IconMoon = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

export const IconArrowRight = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const IconCheck = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconCopy = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconDownload = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const IconFile = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

export const IconLayers = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="m12 2 9 5-9 5-9-5 9-5ZM3 17l9 5 9-5M3 12l9 5 9-5" />
  </svg>
);

export const IconPackage = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
  </svg>
);

export const IconPalette = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.5-.8 1.5-1.69 0-.4-.18-.79-.49-1.13a1.7 1.7 0 0 1-.42-1.1c0-.94.76-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-4.97-4.5-9-10-9Z" />
  </svg>
);

export const IconImage = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export const IconBox = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
  </svg>
);

export const IconFolder = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const IconAccessibility = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="12" cy="4" r="2" />
    <path d="M19 13v-2c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2M12 9v3M9 19l3-4 3 4M5 12l3 1.5 4 2.5 4-2.5L19 12" />
  </svg>
);

export const IconDesktop = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const IconTablet = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);

export const IconMobile = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

export const IconClose = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconChevronDown = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconChevronRight = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const IconAlert = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />
  </svg>
);

export const IconInfo = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const IconZap = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="m13 2-3 7h6l-3 13L8 15h5l-3-7H4Z" />
  </svg>
);

export const IconCode = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

export const IconGithub = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const IconPlus = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconExternal = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
  </svg>
);

export const IconSettings = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.66.42.88.74.21.32.34.7.35 1.09" />
  </svg>
);

export const IconSearch = ({ className, ...p }: Props) => (
  <svg {...baseProps} className={className} {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
