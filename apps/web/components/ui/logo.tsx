import * as React from "react";
import { cn } from "@/utils/cn";

interface LogoProps {
  className?: string;
}

/**
 * The ForgeUI wordmark. The mark itself is a folded "F" that doubles as an
 * anvil silhouette — a quiet nod to the name without being literal.
 */
export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="relative inline-flex h-6 w-6 items-center justify-center"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M4 4 H20 V8 H10 V12 H18 V16 H10 V20 H4 Z"
            fill="currentColor"
          />
          <path
            d="M4 4 H20"
            stroke="rgb(var(--accent))"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span className="font-display text-base font-semibold tracking-tight text-fg">
        ForgeUI
      </span>
    </div>
  );
}
