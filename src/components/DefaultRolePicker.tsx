import { useEffect, useRef, useState } from "react";
import { ROLE_META, ROLES_ORDER, type Role } from "@/lib/lol-api";
import { useI18n } from "@/i18n/I18nContext";

export type DefaultRoleConfig = Record<Role, { p1: string; p2: string }>;

export const EMPTY_DEFAULT_ROLES: DefaultRoleConfig = {
  TOP: { p1: "", p2: "" },
  JUNGLE: { p1: "", p2: "" },
  MID: { p1: "", p2: "" },
  ADC: { p1: "", p2: "" },
  SUPPORT: { p1: "", p2: "" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  /** All summoner names available for selection */
  members: string[];
  /** How many players per team (determines max lanes) */
  teamSize: number;
  value: DefaultRoleConfig;
  onChange: (next: DefaultRoleConfig) => void;
  /** When true, all inputs are read-only */
  disabled?: boolean;
  /** Callback for the "Clear" button. Defaults to resetting all roles. */
  onClear?: () => void;
};

// ---------------------------------------------------------------------------
// DefaultRolePicker
// ---------------------------------------------------------------------------

export function DefaultRolePicker({
  members,
  teamSize,
  value,
  onChange,
  disabled = false,
  onClear,
}: Props) {
  const { locale } = useI18n();
  const activeMembers = members.slice(0, teamSize * 2);
  const lanesNeeded = Math.ceil(activeMembers.length / 2);

  const activeRoleKeys = ROLES_ORDER.filter(
    (r) =>
      (value[r].p1 && activeMembers.includes(value[r].p1)) ||
      (value[r].p2 && activeMembers.includes(value[r].p2)),
  );

  const maxLanesReached = activeRoleKeys.length >= lanesNeeded;

  const handleClear = onClear ?? (() => onChange({ ...EMPTY_DEFAULT_ROLES }));

  const handleRoleChange = (role: Role, slotKey: "p1" | "p2", val: string) => {
    onChange(produce(value, role, slotKey, val, activeMembers, lanesNeeded));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {locale === "en" ? "Default Roles" : "Vai Trò Mặc Định"}
        </label>
        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] text-red-400 hover:text-gold-bright transition-colors uppercase tracking-wider font-display cursor-pointer"
          disabled={disabled}
        >
          {locale === "en" ? "Clear" : "Xóa"}
        </button>
      </div>

      <div className="border border-gold/20 bg-background/20 p-3 space-y-3 mt-2 rounded">
        {/* Header row */}
        <div className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center text-center font-display text-[10px] uppercase tracking-wider text-muted-foreground border-b border-gold/15 pb-2">
          <div>{locale === "en" ? "Role" : "Vai Trò"}</div>
          <div>{locale === "en" ? "Summoner 1" : "Anh Hùng 1"}</div>
          <div>{locale === "en" ? "Summoner 2" : "Anh Hùng 2"}</div>
        </div>

        {ROLES_ORDER.map((role) => {
          const meta = ROLE_META[role];
          const isRoleActive = activeRoleKeys.includes(role);
          const isRoleDisabled = maxLanesReached && !isRoleActive;

          const getOptions = (slot: "p1" | "p2") => {
            const currentVal = value[role][slot];
            return members.filter((m) => {
              const takenElsewhere = Object.entries(value).some(([r, cfg]) => {
                if (r === role) return slot === "p1" ? cfg.p2 === m : cfg.p1 === m;
                return cfg.p1 === m || cfg.p2 === m;
              });
              return !takenElsewhere || m === currentVal;
            });
          };

          return (
            <div
              key={role}
              className={`grid grid-cols-[50px_1fr_1fr] gap-2 items-center transition-opacity duration-300 ${
                isRoleDisabled ? "opacity-30" : ""
              }`}
            >
              <div
                className="flex justify-center items-center min-w-0"
                title={
                  isRoleDisabled
                    ? locale === "en"
                      ? "Maximum lane count reached"
                      : "Đã đạt đủ số lượng lane tối đa"
                    : ""
                }
              >
                <img
                  src={meta.iconUrl}
                  alt={meta.label}
                  className="w-6 h-6 shrink-0"
                  style={{ filter: "drop-shadow(0 0 2px rgba(255,215,0,0.4))" }}
                />
              </div>

              <SummonerSelect
                value={value[role].p1}
                onChange={(v) => handleRoleChange(role, "p1", v)}
                options={getOptions("p1")}
                placeholder={locale === "en" ? "Select..." : "Chọn..."}
                disabled={disabled || isRoleDisabled}
              />

              <SummonerSelect
                value={value[role].p2}
                onChange={(v) => handleRoleChange(role, "p2", v)}
                options={getOptions("p2")}
                placeholder={locale === "en" ? "Select..." : "Chọn..."}
                disabled={disabled || isRoleDisabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-fill logic
// ---------------------------------------------------------------------------

function produce(
  prev: DefaultRoleConfig,
  role: Role,
  slotKey: "p1" | "p2",
  val: string,
  activeMembers: string[],
  lanesNeeded: number,
): DefaultRoleConfig {
  let next: DefaultRoleConfig = { ...prev, [role]: { ...prev[role], [slotKey]: val } };
  let changed = true;

  while (changed) {
    changed = false;
    const assigned = new Set<string>();
    const currentActiveRoles: Role[] = [];

    for (const r of ROLES_ORDER) {
      let isActive = false;
      if (next[r].p1 && activeMembers.includes(next[r].p1)) {
        assigned.add(next[r].p1);
        isActive = true;
      }
      if (next[r].p2 && activeMembers.includes(next[r].p2)) {
        assigned.add(next[r].p2);
        isActive = true;
      }
      if (isActive) currentActiveRoles.push(r);
    }

    const unassigned = activeMembers.filter((m) => !assigned.has(m));
    const allowedRoles =
      currentActiveRoles.length >= lanesNeeded ? currentActiveRoles : (ROLES_ORDER as Role[]);

    const emptySlots: { r: Role; s: "p1" | "p2" }[] = [];
    for (const r of allowedRoles) {
      if (!next[r].p1 || !activeMembers.includes(next[r].p1)) emptySlots.push({ r, s: "p1" });
      if (!next[r].p2 || !activeMembers.includes(next[r].p2)) emptySlots.push({ r, s: "p2" });
    }

    if (unassigned.length === 1 && emptySlots.length === 1) {
      const target = emptySlots[0];
      next = { ...next, [target.r]: { ...next[target.r], [target.s]: unassigned[0] } };
      changed = true;
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// SummonerSelect (reusable hextech custom dropdown)
// ---------------------------------------------------------------------------

export function SummonerSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`input-hex w-full h-9 flex items-center justify-between text-left px-3 transition-all ${
          disabled ? "opacity-40 cursor-not-allowed" : "hover:border-gold hover:text-gold-bright"
        }`}
      >
        <span
          className={
            value
              ? "text-gold-bright font-display text-xs truncate"
              : "text-muted-foreground text-xs truncate"
          }
        >
          {value || placeholder}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gold transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 z-[100]">
          <div className="hextech-frame border-gold bg-background/95 shadow-xl max-h-60 overflow-y-auto animate-fade-in custom-scrollbar">
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] italic text-muted-foreground hover:bg-gold/10 hover:text-gold-bright transition-colors"
                >
                  -- {placeholder} --
                </button>
              </li>
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-display transition-colors ${
                      value === option
                        ? "bg-gold/25 text-gold-bright border-l-2 border-gold-bright"
                        : "text-muted-foreground hover:bg-gold/10 hover:text-gold-bright"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
