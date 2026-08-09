import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type V3AnimatedTitleHeaderProps = {
  mainHeading: string;
  defaultBadgeText: string;
  className?: string;
};

export const V3AnimatedTitleHeader: React.FC<V3AnimatedTitleHeaderProps> = ({
  mainHeading,
  defaultBadgeText,
  className,
}) => {
  const [subtitleMode, setSubtitleMode] = useState<"cmdn" | "default">("cmdn");
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show 'CMDN Nghẹo' glowing subtitle for 2 seconds (2000ms)
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const switchTimer = setTimeout(() => {
        setSubtitleMode("default");
        setIsFadingOut(false);
      }, 350);

      return () => clearTimeout(switchTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const badgeText = subtitleMode === "cmdn" ? "CMDN Nghẹo" : defaultBadgeText;

  return (
    <header className={cn("mb-6 border-b border-gold/20 pb-4", className)}>
      <div className="flex flex-col items-start gap-2">
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-foreground sm:text-3xl">
          {mainHeading}
        </h1>

        <div className="relative min-h-[28px] flex items-center">
          <span
            className={cn(
              "px-3 py-1 text-xs font-display uppercase tracking-widest rounded transition-all duration-500 ease-in-out inline-flex items-center gap-1.5 select-none",
              subtitleMode === "cmdn"
                ? "text-gold-bright bg-gold/20 border border-gold-bright shadow-[0_0_18px_rgba(255,215,0,0.7)] animate-pulse font-bold"
                : "text-gold-bright/90 bg-gold/10 border border-gold/30 shadow-none font-medium",
              isFadingOut
                ? "opacity-0 scale-95 -translate-y-0.5"
                : "opacity-100 scale-100 translate-y-0",
            )}
          >
            {subtitleMode === "cmdn" && (
              <Sparkles
                className="w-3.5 h-3.5 text-gold-bright animate-spin shrink-0"
                style={{ animationDuration: "3s" }}
              />
            )}
            <span>{badgeText}</span>
          </span>
        </div>
      </div>
    </header>
  );
};
