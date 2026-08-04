import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/v2" },
  { label: "About", to: "/v2/about" },
];

type V2HeaderProps = {
  currentPath?: string;
};

export const V2Header = ({ currentPath }: V2HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gold/20 bg-background/60 backdrop-blur-sm sticky top-0 z-40">
      {/* Logo / H1 */}
      <h1 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground leading-none select-none">
        Random{" "}
        <span className="text-gold-bright text-glow-gold">LOL</span>
      </h1>

      {/* Tab navigation */}
      <nav aria-label="Điều hướng chính">
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
    </header>
  );
};
