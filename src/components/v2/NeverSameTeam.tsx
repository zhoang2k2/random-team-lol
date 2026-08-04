import type { ExclusionPair } from "@/lib/randomize";

type NeverSameTeamProps = {
  members: string[];
  value: ExclusionPair | null;
  onChange: (pair: ExclusionPair | null) => void;
  disabled?: boolean;
};

const SwordIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="text-gold/50 shrink-0"
  >
    <path d="M14.5 17.5 21 21l-1-4-3.5-3.5" />
    <path d="m3 3 7.5 7.5" />
    <path d="M9.5 17.5 3 21l1-4 3.5-3.5" />
    <path d="m21 3-7.5 7.5" />
  </svg>
);

// Fully controlled — no local state; value is the single source of truth
export const NeverSameTeam = ({
  members,
  value,
  onChange,
  disabled = false,
}: NeverSameTeamProps) => {
  const selectedA = value?.a ?? "";
  const selectedB = value?.b ?? "";

  const handleAChange = (nextA: string) => {
    if (nextA && selectedB && nextA !== selectedB) {
      onChange({ a: nextA, b: selectedB });
    } else {
      onChange(null);
    }
  };

  const handleBChange = (nextB: string) => {
    if (selectedA && nextB && selectedA !== nextB) {
      onChange({ a: selectedA, b: nextB });
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Never on the same team
      </label>

      <div className="flex items-center gap-2">
        <MemberSelect
          value={selectedA}
          options={members.filter((member) => member !== selectedB)}
          placeholder="Summoner A"
          onChange={handleAChange}
          disabled={disabled}
        />

        <SwordIcon />

        <MemberSelect
          value={selectedB}
          options={members.filter((member) => member !== selectedA)}
          placeholder="Summoner B"
          onChange={handleBChange}
          disabled={disabled}
        />
      </div>

      {value && (
        <div className="flex items-center justify-between border border-gold/30 bg-background/40 px-2 py-1">
          <span className="text-xs">
            <span className="text-gold-bright font-display">{value.a}</span>
            <span className="mx-2 text-muted-foreground">⚔</span>
            <span className="text-gold-bright font-display">{value.b}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            aria-label="Xoá cặp exclusion"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// ── MemberSelect ─────────────────────────────────────────────────────────────

type MemberSelectProps = {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const MemberSelect = ({
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: MemberSelectProps) => {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="input-hex flex-1 h-9 px-2 text-xs bg-background/40 border border-gold/30 text-gold-bright cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={placeholder}
    >
      <option value="" className="bg-background text-muted-foreground">
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option} className="bg-background text-gold-bright">
          {option}
        </option>
      ))}
    </select>
  );
};
