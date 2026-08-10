import React from "react";
import { cn } from "@/lib/utils";

type BananaPowerDisplayProps = {
  powerScore: number;
  className?: string;
  imageClassName?: string;
  overlapOffset?: number;
};

export const BananaPowerDisplay: React.FC<BananaPowerDisplayProps> = ({
  powerScore,
  className,
  imageClassName = "w-7 h-7",
  overlapOffset = 12,
}) => {
  const normalizedPower = Math.min(10, Math.max(1, Math.round(powerScore || 1)));
  const totalCount = 10;
  // Calculate container width based on offset + 28px image width
  const containerWidth = (totalCount - 1) * overlapOffset + 28;

  return (
    <div
      className={cn("relative h-7 select-none shrink-0", className)}
      style={{ width: `${containerWidth}px` }}
    >
      {Array.from({ length: totalCount }).map((_, index) => {
        const isActive = index < normalizedPower;
        return (
          <img
            key={index}
            src="/images/banana-power.png"
            alt="banana power"
            style={{
              left: `${index * overlapOffset}px`,
              zIndex: index + 1,
              transform: "rotate(-20deg)",
            }}
            className={cn(
              "absolute top-0 rotate-[-20deg]",
              imageClassName,
              "object-contain shrink-0 transition-opacity",
              isActive ? "opacity-100" : "opacity-20",
            )}
          />
        );
      })}
    </div>
  );
};
