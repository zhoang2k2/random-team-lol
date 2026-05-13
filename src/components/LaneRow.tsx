import { useEffect, useState } from "react";
import {
  ROLE_META,
  ROLES_ORDER,
  type Champion,
  type Role,
} from "@/lib/lol-api";
import { SlotMachine } from "./SlotMachine";
import { ChampionStrip } from "./ChampionStrip";

export type LaneResult = {
  role: Role;
  alpha: { name: string | null; champion: Champion | null };
  beta: { name: string | null; champion: Champion | null };
};

type Phase =
  | "idle"
  | "role"
  | "members"
  | "champ-alpha"
  | "champ-beta"
  | "done";

type Props = {
  index: number;
  finalRole: Role;
  alphaName: string | null;
  betaName: string | null;
  alphaChampion: Champion | null;
  betaChampion: Champion | null;
  allMemberNames: string[];
  championPool: Champion[];
  startDelayMs: number;
  onComplete?: () => void;
};

const ROLE_SLOT_MS = 700;
const MEMBER_SLOT_MS = 700;
const CHAMP_STRIP_MS = 1300;

export function LaneRow({
  index,
  finalRole,
  alphaName,
  betaName,
  alphaChampion,
  betaChampion,
  allMemberNames,
  championPool,
  startDelayMs,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    setPhase("idle");
    const t = setTimeout(() => setPhase("role"), startDelayMs);
    return () => clearTimeout(t);
  }, [startDelayMs, finalRole, alphaName, betaName, alphaChampion, betaChampion]);

  const roleMeta = ROLE_META[finalRole];

  const roleNode = (() => {
    if (phase === "idle") {
      return (
        <div className="flex h-16 items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Lane {index + 1}
        </div>
      );
    }
    if (phase === "role") {
      return (
        <SlotMachine<Role>
          items={ROLES_ORDER}
          finalItem={finalRole}
          spinDurationMs={ROLE_SLOT_MS}
          itemHeight={64}
          onDone={() => setPhase("members")}
          renderItem={(r) => (
            <div className="flex items-center gap-3">
              <img src={ROLE_META[r].iconUrl} alt={r} className="h-8 w-8" style={{ filter: "drop-shadow(0 0 4px var(--gold))" }} />
              <span className="font-display text-lg uppercase tracking-widest text-gold-bright">
                {ROLE_META[r].label}
              </span>
            </div>
          )}
        />
      );
    }
    return (
      <div className="hextech-frame flex h-16 items-center justify-center gap-3">
        <img src={roleMeta.iconUrl} alt={finalRole} className="h-8 w-8" style={{ filter: "drop-shadow(0 0 6px var(--gold-bright))" }} />
        <span className="font-display text-lg uppercase tracking-widest text-gold-bright text-glow-gold">
          {roleMeta.label}
        </span>
      </div>
    );
  })();

  const renderMemberSlot = (name: string | null, color: string) => {
    if (!name) {
      return (
        <div className="hextech-frame flex h-12 items-center justify-center text-sm text-muted-foreground italic">
          —
        </div>
      );
    }
    if (phase === "idle" || phase === "role") {
      return (
        <div className="hextech-frame flex h-12 items-center justify-center text-sm text-muted-foreground">
          ???
        </div>
      );
    }
    if (phase === "members") {
      return (
        <SlotMachine<string>
          items={allMemberNames.length > 0 ? allMemberNames : [name]}
          finalItem={name}
          spinDurationMs={MEMBER_SLOT_MS}
          itemHeight={48}
          onDone={() => {
            // both slots run in parallel; advance only once via a microtask guard
            setPhase((p) => (p === "members" ? "champ-alpha" : p));
          }}
          renderItem={(n) => (
            <span className="font-display text-base tracking-wide" style={{ color }}>
              {n}
            </span>
          )}
        />
      );
    }
    return (
      <div className="hextech-frame flex h-12 items-center justify-center">
        <span className="font-display text-base tracking-wide" style={{ color, textShadow: `0 0 10px ${color}` }}>
          {name}
        </span>
      </div>
    );
  };

  const renderChampSlot = (
    side: "alpha" | "beta",
    champ: Champion | null
  ) => {
    if (!champ) {
      return (
        <div className="hextech-frame flex h-28 items-center justify-center text-muted-foreground italic">
          —
        </div>
      );
    }
    const myPhase: Phase = side === "alpha" ? "champ-alpha" : "champ-beta";
    const beforeMyPhase =
      phase === "idle" ||
      phase === "role" ||
      phase === "members" ||
      (side === "beta" && phase === "champ-alpha");

    if (beforeMyPhase) {
      return (
        <div className="hextech-frame flex h-28 items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Awaiting summoner
        </div>
      );
    }
    if (phase === myPhase) {
      return (
        <ChampionStrip
          pool={championPool}
          finalChampion={champ}
          durationMs={CHAMP_STRIP_MS}
          onDone={() => {
            if (side === "alpha") setPhase("champ-beta");
            else {
              setPhase("done");
              onComplete?.();
            }
          }}
        />
      );
    }
    // done
    return (
      <div className="hextech-frame flex h-28 items-center gap-3 px-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden border border-gold/60">
          <img src={champ.squareUrl} alt={champ.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-lg text-gold-bright text-glow-gold truncate">{champ.name}</div>
          <div className="font-serif text-xs italic text-muted-foreground truncate">{champ.title}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {/* Role center */}
      <div className="mx-auto w-full max-w-xs">{roleNode}</div>

      {/* Members row */}
      <div className="grid grid-cols-2 gap-3">
        {renderMemberSlot(alphaName, "var(--team-alpha)")}
        {renderMemberSlot(betaName, "var(--team-beta)")}
      </div>

      {/* Champion row */}
      <div className="grid grid-cols-2 gap-3">
        {renderChampSlot("alpha", alphaChampion)}
        {renderChampSlot("beta", betaChampion)}
      </div>
    </div>
  );
}
