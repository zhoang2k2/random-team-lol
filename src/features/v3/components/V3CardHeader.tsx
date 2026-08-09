import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type V3CardHeaderProps = {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
};

export const V3CardHeader = ({
  title,
  icon,
  badge,
  action,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: V3CardHeaderProps) => {
  return (
    <div
      onClick={isCollapsible ? onToggleCollapse : undefined}
      className={cn(
        "flex items-center justify-between select-none py-1.5",
        isCollapsible && "cursor-pointer group",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="text-gold-bright shrink-0 flex items-center justify-center">{icon}</span>
        )}
        <h2 className="text-sm sm:text-base font-display font-bold uppercase tracking-wider text-gold-bright transition-colors group-hover:text-white truncate">
          {title}
        </h2>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action}
        {isCollapsible && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapse?.();
            }}
            aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
            className="p-1 rounded hover:bg-gold/10 text-gold-bright transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};
