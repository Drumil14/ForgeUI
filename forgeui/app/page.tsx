import { MarketingNav } from "@/components/landing/marketing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Screenshots } from "@/components/landing/screenshots";
import { MarketingFooter } from "@/components/landing/marketing-footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-accent-fg"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main" className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Screenshots />
      </main>
      <MarketingFooter />
    </div>
  );
}
