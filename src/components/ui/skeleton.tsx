import React from "react";
import { cn } from "@/lib/utils";

/** Base Hextech Skeleton with gold shimmer animation and hextech clipped corners */
function Skeleton({
  className,
  isClipped = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isClipped?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#061821]/80 border border-gold/30 shadow-sm",
        isClipped &&
          "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-hex-shimmer before:bg-gradient-to-r before:from-transparent before:via-gold/20 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

/** Hextech Square Skeleton (for avatars, icons, rank boxes) */
function SkeletonSquare({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("w-10 h-10 shrink-0", className)} {...props} />;
}

/** Hextech Text Line Skeleton */
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-4 w-3/4 rounded-sm border-0 bg-gold/15", className)}
      isClipped={false}
      {...props}
    />
  );
}

/** Hextech Button Skeleton */
function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-9 w-24 rounded border-gold/40 bg-gold/10", className)} {...props} />
  );
}

/** Hextech Input Box Skeleton */
function SkeletonInput({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-10 w-full rounded border-gold/30 bg-[#061821]/90", className)}
      {...props}
    />
  );
}

/** Hextech Card Container Skeleton */
function SkeletonCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gold/30 bg-card/80 p-5 shadow-lg hextech-frame space-y-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Hextech Summoner Slot Skeleton matching V3SummonerItem */
function SkeletonSummonerSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 h-[52px] border border-gold/30 bg-[#061821]/90 relative overflow-hidden",
        "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-hex-shimmer before:bg-gradient-to-r before:from-transparent before:via-gold/20 before:to-transparent",
        className,
      )}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Drag handle icon skeleton */}
        <div className="w-3.5 h-3.5 rounded bg-gold/20 shrink-0" />
        {/* Name bar & power score skeleton */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="h-3.5 bg-gold/25 rounded w-1/2" />
          <div className="h-2.5 bg-gold/15 rounded w-1/4" />
        </div>
      </div>
      {/* Action buttons skeleton */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 rounded bg-gold/20" />
        <div className="w-5 h-5 rounded bg-red-500/20" />
      </div>
    </div>
  );
}

/** Hextech Match Card Skeleton matching V3MatchCard */
function SkeletonMatchCard({ className }: { className?: string }) {
  return (
    <SkeletonCard className={cn("p-4 space-y-3", className)}>
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-gold/20">
        <SkeletonText className="h-4 w-32" />
        <SkeletonText className="h-4 w-20" />
      </div>
      {/* 5 Lane Rows */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`match-skel-lane-${idx}`}
            className="grid grid-cols-[1fr_40px_1fr] gap-2 items-center"
          >
            <SkeletonSummonerSlot className="h-[40px]" />
            <div className="w-7 h-7 rounded-full bg-gold/20 justify-self-center border border-gold/30 shrink-0" />
            <SkeletonSummonerSlot className="h-[40px]" />
          </div>
        ))}
      </div>
      {/* Footer bar skeleton */}
      <div className="pt-2 border-t border-gold/15 flex items-center justify-between">
        <SkeletonText className="h-3.5 w-24" />
        <SkeletonText className="h-3.5 w-24" />
      </div>
    </SkeletonCard>
  );
}

export {
  Skeleton,
  SkeletonSquare,
  SkeletonText,
  SkeletonButton,
  SkeletonInput,
  SkeletonCard,
  SkeletonSummonerSlot,
  SkeletonMatchCard,
};
