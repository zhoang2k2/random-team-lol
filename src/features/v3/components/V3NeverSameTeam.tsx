import React, { useState, useEffect } from "react";
import type { ExclusionPair } from "@/lib/randomize";
import { SummonerSelect } from "@/components/DefaultRolePicker";
import { useV3Locales } from "@/features/v3/locales/v3Locales";
import { useI18n } from "@/i18n/I18nContext";

type V3NeverSameTeamProps = {
  members: string[];
  value: ExclusionPair | null;
  onChange: (pair: ExclusionPair | null) => void;
  disabled?: boolean;
};

export const V3NeverSameTeam: React.FC<V3NeverSameTeamProps> = ({
  members,
  value,
  onChange,
  disabled = false,
}) => {
  const v3Locales = useV3Locales();
  const { locale } = useI18n();

  const [playerA, setPlayerA] = useState<string>(value?.a || "");
  const [playerB, setPlayerB] = useState<string>(value?.b || "");

  // Sync with value prop if externally reset or changed
  useEffect(() => {
    setPlayerA(value?.a || "");
    setPlayerB(value?.b || "");
  }, [value?.a, value?.b]);

  const handleSelectA = (val: string) => {
    setPlayerA(val);
    if (val && playerB && val !== playerB) {
      onChange({ a: val, b: playerB });
    } else {
      onChange(null);
    }
  };

  const handleSelectB = (val: string) => {
    setPlayerB(val);
    if (playerA && val && playerA !== val) {
      onChange({ a: playerA, b: val });
    } else {
      onChange(null);
    }
  };

  const handleClear = () => {
    setPlayerA("");
    setPlayerB("");
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {v3Locales.settings.neverSameTeamLabel}
        </label>
        {(playerA || playerB || value) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-red-400 hover:text-gold-bright transition-colors uppercase tracking-wider font-display cursor-pointer"
            disabled={disabled}
          >
            {v3Locales.matchResults.deleteButton}
          </button>
        )}
      </div>

      <div className="border border-gold/20 bg-background/20 p-3 space-y-3 mt-2 rounded">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-center font-display text-[10px] uppercase tracking-wider text-muted-foreground border-b border-gold/15 pb-2">
          <div>{locale === "en" ? "Summoner 1" : "Anh Hùng 1"}</div>
          <div className="text-gold">⚔</div>
          <div>{locale === "en" ? "Summoner 2" : "Anh Hùng 2"}</div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <SummonerSelect
            value={playerA}
            onChange={handleSelectA}
            options={members.filter((m) => m !== playerB)}
            placeholder={locale === "en" ? "Select..." : "Chọn..."}
            disabled={disabled}
          />

          <span className="text-gold font-bold text-xs shrink-0">⚔</span>

          <SummonerSelect
            value={playerB}
            onChange={handleSelectB}
            options={members.filter((m) => m !== playerA)}
            placeholder={locale === "en" ? "Select..." : "Chọn..."}
            disabled={disabled}
          />
        </div>

        {value?.a && value?.b && (
          <div className="flex items-center justify-between border border-gold/30 bg-gold/10 px-2.5 py-1 rounded text-xs">
            <span className="font-display font-bold text-gold-bright text-[11px]">
              {value.a}{" "}
              <span className="text-destructive font-normal mx-1">
                {locale === "en" ? "never with" : "không chung đội với"}
              </span>{" "}
              {value.b}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
