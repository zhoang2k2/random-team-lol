import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Globe, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";
import { supabase } from "@/utils/supabase";

type NavItem = {
  label: string;
  to: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Random LOL", to: "/random-lol" },
  { label: "Version 1 (Cũ)", to: "/random-lol-old" },
];

type SiteHeaderProps = {
  /** The current route path — used to mark the active nav tab */
  currentPath?: string;
  /** Optional page-level heading shown below the sticky bar (NOT an H1 — use aria-label) */
  pageHeading?: React.ReactNode;
  /** Optional custom button to place to the right of the 2 navigation items */
  rightButton?: React.ReactNode;
};

/**
 * Shared sticky header used across routes.
 */
export const SiteHeader = ({ currentPath, pageHeading, rightButton }: SiteHeaderProps) => {
  const { locale, switchLocale } = useI18n();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <header>
      {/* ── Sticky nav bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gold/20 bg-background/80 backdrop-blur-md sticky top-0 z-40 overflow-visible">
        {/* Brand mark — NOT an H1 (each page provides its own H1) */}
        <Link
          to="/random-lol"
          className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground leading-none select-none hover:text-gold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Random</span> <span className="text-gold-bright text-glow-gold">LOL</span>
        </Link>

        {/* Tab navigation and button to the right */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <nav aria-label="Phiên bản">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.to || currentPath?.endsWith(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "font-display text-xs uppercase tracking-[0.15em] px-2.5 sm:px-3 py-1.5 border transition-all rounded-sm inline-block whitespace-nowrap",
                        isActive
                          ? "border-gold/60 text-gold-bright bg-gold/10 font-semibold"
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

          {/* Button to the right of 2 navigation items */}
          {rightButton ? (
            rightButton
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => switchLocale()}
                className="font-display text-xs uppercase tracking-wider px-2 sm:px-2.5 py-1.5 border border-gold/40 text-gold-bright bg-gold/10 hover:bg-gold/20 hover:border-gold transition-all rounded flex items-center gap-1 font-semibold cursor-pointer shadow-sm active:scale-95"
                title="Đổi ngôn ngữ (Language)"
              >
                <Globe className="w-3.5 h-3.5 text-gold-bright shrink-0" />
                <span>{locale === "vi" ? "VI" : "EN"}</span>
              </button>

              <Link
                to="/login"
                className={cn(
                  "font-display text-xs uppercase tracking-wider px-2 sm:px-2.5 py-1.5 border rounded flex items-center gap-1 font-semibold transition-all shadow-sm active:scale-95",
                  user
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40"
                    : "border-gold/30 text-muted-foreground hover:text-gold-bright hover:border-gold/50 bg-background/50",
                )}
                title={user ? user.email || "Tài khoản" : "Đăng nhập"}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="User"
                    className="w-4 h-4 rounded-full border border-emerald-400/80 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-gold-bright shrink-0" />
                )}
                <span className="hidden sm:inline">{user ? "Tài khoản" : "Login"}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Optional page heading slot ── */}
      {pageHeading && <div className="text-center px-4 pt-8 pb-2">{pageHeading}</div>}
    </header>
  );
};

export const V2Header = SiteHeader;
