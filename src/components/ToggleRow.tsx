type ToggleRowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export const ToggleRow = ({ label, hint, value, onChange, disabled }: ToggleRowProps) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`group flex w-full items-center justify-between gap-4 border border-gold/30 bg-background/40 px-3 py-2 text-left transition ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:border-gold cursor-pointer"
      }`}
    >
      <div className="min-w-0">
        <div className="font-display text-sm uppercase tracking-[0.2em] text-gold-bright">
          {label}
        </div>
        {hint && <div className="mt-0.5 text-xs italic text-muted-foreground">{hint}</div>}
      </div>
      <div
        className={`relative h-6 w-12 shrink-0 border transition-colors ${
          value ? "border-gold bg-gold/30" : "border-gold/40 bg-background"
        }`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 transition-all ${
            value
              ? "left-7 bg-gold-bright shadow-[0_0_8px_var(--gold-bright)]"
              : "left-0.5 bg-muted-foreground"
          }`}
        />
      </div>
    </button>
  );
};
