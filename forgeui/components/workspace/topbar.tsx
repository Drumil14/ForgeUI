"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ImportBar } from "./import-bar";
import { IconGithub } from "@/components/ui/icons";

export function Topbar() {
  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-bg px-3 sm:gap-4 sm:px-4">
      <Link
        href="/"
        aria-label="ForgeUI home"
        className="flex-shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <Logo />
      </Link>

      <div className="hidden h-6 w-px bg-border sm:block" />

      <div className="min-w-0 flex-1">
        <ImportBar />
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub repository"
          className="hidden h-9 w-9 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg sm:inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <IconGithub className="h-4 w-4" />
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
