import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Version 1", to: "/" },
  { label: "Version 2", to: "/v2/random" },
];

type SiteHeaderProps = {
  /** The current route path — used to mark the active nav tab */
  currentPath?: string;
  /** Optional page-level heading shown below the sticky bar (NOT an H1 — use aria-label) */
  pageHeading?: React.ReactNode;
};

/**
 * Shared sticky header used by both V1 ("/") and V2 ("/v2/random").
 *
 * SEO note: The logo "Random LOL" is rendered as a visual <span> inside
 * the sticky bar — the actual page H1 lives in the page body and is
 * provided per-page. Each page must have exactly one H1.
 */
export const SiteHeader = ({ currentPath, pageHeading }: SiteHeaderProps) => {
  return (
    <header>
      {/* ── Sticky nav bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/20 bg-background/60 backdrop-blur-sm sticky top-0 z-40">
        {/* Brand mark — NOT an H1 (each page provides its own H1) */}
        <span className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground leading-none select-none">
          Random{" "}
          <span className="text-gold-bright text-glow-gold">LOL</span>
        </span>

        {/* Tab navigation */}
        <nav aria-label="Phiên bản">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "font-display text-xs uppercase tracking-[0.2em] px-3 py-1.5 border transition-colors",
                      isActive
                        ? "border-gold/60 text-gold-bright bg-gold/10"
                        : "border-transparent text-muted-foreground hover:text-gold-bright hover:border-gold/30",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* ── Optional page heading slot ── */}
      {pageHeading && (
        <div className="text-center px-4 pt-8 pb-2">
          {pageHeading}
        </div>
      )}
    </header>
  );
};

/**
 * @deprecated Use SiteHeader instead.
 * Kept as alias so any existing imports of V2Header still compile.
 */
export const V2Header = SiteHeader;
