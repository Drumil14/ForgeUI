"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconGithub } from "@/components/ui/icons";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-sm">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          aria-label="ForgeUI home"
          className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="#features"
            className="hidden rounded px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg sm:inline-block"
          >
            Features
          </Link>
          <Link
            href="#how"
            className="hidden rounded px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg sm:inline-block"
          >
            How it works
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IconGithub className="h-4 w-4" />
          </a>
          <ThemeToggle />
          <Link href="/workspace">
            <Button size="sm" iconRight={<IconArrowRight className="h-3.5 w-3.5" />}>
              Open workspace
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
