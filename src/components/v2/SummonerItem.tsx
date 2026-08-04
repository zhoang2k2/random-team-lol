import { cn } from "@/lib/utils";

type SummonerItemProps = {
  name?: string;
  index: number;
  showPowerInput?: boolean;
  power?: number;
  onPowerChange?: (value: number) => void;
  onRemove?: () => void;
  /** Drag handle attributes from dnd-kit */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
};

export const SummonerItem = ({
  name,
  index,
  showPowerInput = false,
  power = 1,
  onPowerChange,
  onRemove,
  dragHandleProps,
  isDragging = false,
}: SummonerItemProps) => {
  const isEmpty = !name;

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-10 px-3 border transition-all",
        isEmpty
          ? "border-gold/15 bg-transparent"
          : "border-gold/40 bg-card/60",
        isDragging && "shadow-[0_0_16px_var(--gold)] opacity-70",
      )}
    >
      {/* Slot index */}
      <span
        className={cn(
          "font-display text-[10px] w-5 shrink-0 text-center",
          isEmpty ? "text-gold/20" : "text-gold/60",
        )}
      >
        {index + 1}
      </span>

      {/* Drag handle — only shown when name exists */}
      {name && (
        <div
          {...dragHandleProps}
          className="shrink-0 cursor-grab active:cursor-grabbing text-gold/40 hover:text-gold/80 transition-colors"
          aria-label="Kéo để sắp xếp"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="6" r="2" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="15" cy="12" r="2" />
            <circle cx="9" cy="18" r="2" />
            <circle cx="15" cy="18" r="2" />
          </svg>
        </div>
      )}

      {/* Name */}
      <span
        className={cn(
          "flex-1 font-display text-sm truncate select-none",
          isEmpty ? "text-gold/20 italic text-xs" : "text-gold-bright",
        )}
      >
        {isEmpty ? "—" : name}
      </span>

      {/* Power input */}
      {name && showPowerInput && (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={1}
            step={1}
            value={power}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isNaN(parsed) && parsed >= 1) {
                onPowerChange?.(Math.floor(parsed));
              }
            }}
            className="input-hex w-12 h-7 text-xs text-center px-1 py-0"
            aria-label={`Power của ${name}`}
          />
          <span className="text-gold/60 text-xs">$</span>
        </div>
      )}

      {/* Remove button */}
      {name && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          aria-label={`Xoá ${name}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
