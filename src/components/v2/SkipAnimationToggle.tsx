import { ToggleRow } from "@/components/ToggleRow";

type SkipAnimationToggleProps = {
  value: boolean;
  animationSeconds: number;
  onChange: (value: boolean) => void;
  onSecondsChange: (seconds: number) => void;
  disabled?: boolean;
};

const MIN_SECONDS = 0;
const MAX_SECONDS = 2.5;

export const SkipAnimationToggle = ({
  value,
  animationSeconds,
  onChange,
  onSecondsChange,
  disabled = false,
}: SkipAnimationToggleProps) => {
  const handleSecondsChange = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;

    const clamped = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, parsed));
    onSecondsChange(clamped);

    if (clamped === 0) onChange(true);
    else onChange(false);
  };

  const handleToggle = (next: boolean) => {
    onChange(next);
    if (next) onSecondsChange(0);
    else onSecondsChange(2);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ToggleRow
            label="Skip animation"
            value={value}
            onChange={handleToggle}
            disabled={disabled}
          />
        </div>

        <input
          type="number"
          min={MIN_SECONDS}
          max={MAX_SECONDS}
          step={0.5}
          value={animationSeconds}
          disabled={disabled}
          onChange={(event) => handleSecondsChange(event.target.value)}
          className="input-hex w-16 h-10 text-xs text-center px-1 shrink-0"
          aria-label="Animation seconds"
        />

        <span className="text-xs text-muted-foreground shrink-0">s</span>
      </div>

      <p className="text-[10px] italic text-muted-foreground px-1">
        Điền 0 để bật skip · {MIN_SECONDS}–{MAX_SECONDS}s
      </p>
    </div>
  );
};
