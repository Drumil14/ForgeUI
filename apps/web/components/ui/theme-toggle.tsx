"use client";

import { useTheme } from "@/hooks/use-theme";
import { IconMoon, IconSun } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border",
        "text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className
      )}
    >
      {mounted ? (
        theme === "dark" ? (
          <IconSun className="h-4 w-4" />
        ) : (
          <IconMoon className="h-4 w-4" />
        )
      ) : (
        <div className="h-4 w-4" />
      )}
    </button>
  );
}
