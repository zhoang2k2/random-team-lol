import { useState } from "react";

import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/v2/NumberInput";

type SummonerItemProps = {
  name?: string;
  showPowerInput?: boolean;
  power?: number;
  onPowerChange?: (value: number) => void;
  onRemove?: () => void;
  onRename?: (name: string) => void;
  /** Drag handle attributes from dnd-kit */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
};

const DragHandleIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="15" cy="18" r="2" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const SummonerItem = ({
  name,
  showPowerInput = false,
  power = 0,
  onPowerChange,
  onRemove,
  onRename,
  dragHandleProps,
  isDragging = false,
}: SummonerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name ?? "");
  const isEmpty = !name;

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(trimmed);
    } else {
      setEditValue(name ?? "");
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleEditSubmit();
    if (event.key === "Escape") {
      setEditValue(name ?? "");
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col transition-all",
        isDragging && "opacity-70 shadow-[0_0_16px_var(--gold)]",
      )}
    >
      {/* Main item row */}
      <div
        className={cn(
          "flex items-center gap-1.5 h-9 px-2 border transition-colors",
          isEmpty
            ? "border-gold/10 bg-transparent"
            : "border-gold/30 bg-card/50 hover:border-gold/50",
        )}
      >
        {/* Drag handle */}
        {name && dragHandleProps && (
          <div
            {...dragHandleProps}
            className="shrink-0 cursor-grab active:cursor-grabbing text-gold/30 hover:text-gold/70 transition-colors"
            aria-label="Kéo để sắp xếp"
          >
            <DragHandleIcon />
          </div>
        )}

        {/* Name or edit input */}
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
            className="flex-1 min-w-0 bg-transparent border-b border-gold/60 text-gold-bright text-xs font-display outline-none px-0.5 py-0"
            maxLength={32}
          />
        ) : (
          <span
            className={cn(
              "flex-1 min-w-0 font-display text-xs truncate select-none",
              isEmpty ? "text-gold/15" : "text-gold-bright",
            )}
          >
            {isEmpty ? "—" : name}
          </span>
        )}

        {/* Actions */}
        {name && !isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditValue(name);
                setIsEditing(true);
              }}
              className="text-gold/40 hover:text-gold-bright transition-colors cursor-pointer p-0.5"
              aria-label={`Đổi tên ${name}`}
            >
              <EditIcon />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-gold/40 hover:text-destructive transition-colors cursor-pointer p-0.5"
                aria-label={`Xoá ${name}`}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* PowerInfo subitem — only shown when evaluate power is on and name exists */}
      {name && showPowerInput && (
        <div className="flex items-center gap-2 h-7 px-2 border-x border-b border-gold/20 bg-card/80">
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-gold/50 shrink-0">
            Power
          </span>
          <NumberInput
            value={power}
            min={0}
            max={1000}
            step={1}
            onChange={(event) => {
              const parsed = parseFloat(event.target.value);
              if (!Number.isNaN(parsed)) {
                const clamped = Math.min(1000, Math.max(0, parsed));
                onPowerChange?.(clamped);
              }
            }}
            className="flex-1 h-5 text-[11px] px-1 border-gold/20"
            aria-label={`Power của ${name}`}
          />
        </div>
      )}
    </div>
  );
};
