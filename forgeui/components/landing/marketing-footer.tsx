import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function MarketingFooter() {
  return (
    <footer className="bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-fg-muted">
              An interactive bridge between Figma and your codebase. Built as
              a portfolio project — fully local, open source friendly.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-8 text-sm">
            <div className="space-y-2">
              <p className="eyebrow text-fg-subtle">Product</p>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/workspace"
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    Workspace
                  </Link>
                </li>
                <li>
                  <Link
                    href="#features"
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how"
                    className="text-fg-muted transition-colors hover:text-fg"
                  >
                    How it works
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="eyebrow text-fg-subtle">Stack</p>
              <ul className="space-y-1.5 text-fg-muted">
                <li>Next.js 15</li>
                <li>React 19</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center">
          <p className="font-mono">
            Built with Next.js · No database · Local-first
          </p>
          <p>
            © {new Date().getFullYear()} ForgeUI. Portfolio project, not affiliated with Figma.
          </p>
        </div>
      </div>
    </footer>
  );
}
