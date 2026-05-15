import { useEffect, useRef, useState } from "react";
import {
  ROLE_META,
  ROLES_ORDER,
  type Champion,
  type Role,
} from "@/lib/lol-api";
import { SlotMachine } from "./SlotMachine";
import { ChampionStrip } from "./ChampionStrip";

type Phase =
  | "idle"
  | "pre-role"
  | "role"
  | "pre-members"
  | "members"
  | "pre-champ-alpha"
  | "champ-alpha"
  | "pre-champ-beta"
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
  scale?: number;
  onComplete?: () => void;
};

// Base durations (in ms) at scale=1 → ~4.5s per lane
const BASE_PRE_DELAY_MS = 300;
const BASE_ROLE_SLOT_MS = 300;
const BASE_MEMBER_SLOT_MS = 300;
const BASE_CHAMP_ALPHA_MS = 1500;
const BASE_CHAMP_BETA_MS = 1800;
const BASE_FINAL_HOLD_MS = 300;

export function LaneRow({
  index,
  finalRole,
  alphaName,
  betaName,
  alphaChampion,
  betaChampion,
  allMemberNames,
  championPool,
  scale = 1,
  onComplete,
}: Props) {
  const PRE_DELAY_MS = Math.round(BASE_PRE_DELAY_MS * scale);
  const ROLE_SLOT_MS = Math.round(BASE_ROLE_SLOT_MS * scale);
  const MEMBER_SLOT_MS = Math.round(BASE_MEMBER_SLOT_MS * scale);
  const CHAMP_ALPHA_MS = Math.round(BASE_CHAMP_ALPHA_MS * scale);
  const CHAMP_BETA_MS = Math.round(BASE_CHAMP_BETA_MS * scale);
  const FINAL_HOLD_MS = Math.round(BASE_FINAL_HOLD_MS * scale);
  const [phase, setPhase] = useState<Phase>("idle");
  const memberDoneRef = useRef(0);

  useEffect(() => {
    setPhase("idle");
    memberDoneRef.current = 0;
    const t = setTimeout(() => setPhase("pre-role"), 100);
    return () => clearTimeout(t);
  }, [finalRole, alphaName, betaName, alphaChampion, betaChampion]);

  // Phase auto-transitions: pre-* phases wait then advance
  useEffect(() => {
    if (phase === "pre-role") {
      const t = setTimeout(() => setPhase("role"), PRE_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (phase === "pre-members") {
      const t = setTimeout(() => setPhase("members"), PRE_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (phase === "pre-champ-alpha") {
      if (!alphaChampion) {
        const t = setTimeout(
          () => setPhase(betaChampion ? "pre-champ-beta" : "done"),
          PRE_DELAY_MS
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("champ-alpha"), PRE_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (phase === "pre-champ-beta") {
      if (!betaChampion) {
        const t = setTimeout(() => setPhase("done"), PRE_DELAY_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("champ-beta"), PRE_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (phase === "done") {
      const t = setTimeout(() => onComplete?.(), FINAL_HOLD_MS);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const roleMeta = ROLE_META[finalRole];

  const isPastRole =
    phase !== "idle" && phase !== "pre-role" && phase !== "role";
  const isPastMembers =
    isPastRole && phase !== "pre-members" && phase !== "members";

  const roleNode = (() => {
    if (phase === "idle" || phase === "pre-role") {
      return (
        <div className="flex h-20 items-center justify-center text-xs uppercase tracking-[0.4em] text-muted-foreground">
          {phase === "pre-role" ? "Selecting lane…" : `Lane ${index + 1}`}
        </div>
      );
    }
    if (phase === "role") {
      return (
        <SlotMachine<Role>
          items={ROLES_ORDER}
          finalItem={finalRole}
          spinDurationMs={ROLE_SLOT_MS}
          itemHeight={80}
          onDone={() => setPhase("pre-members")}
          renderItem={(r) => (
            <div className="flex items-center gap-3">
              <img src={ROLE_META[r].iconUrl} alt={r} className="h-10 w-10" style={{ filter: "drop-shadow(0 0 6px var(--gold))" }} />
              <span className="font-display text-2xl uppercase tracking-widest text-gold-bright">
                {ROLE_META[r].label}
              </span>
            </div>
          )}
        />
      );
    }
    return (
      <div className="hextech-frame flex h-20 items-center justify-center gap-3">
        <img src={roleMeta.iconUrl} alt={finalRole} className="h-10 w-10" style={{ filter: "drop-shadow(0 0 8px var(--gold-bright))" }} />
        <span className="font-display text-2xl uppercase tracking-widest text-gold-bright text-glow-gold">
          {roleMeta.label}
        </span>
      </div>
    );
  })();

  const renderMemberSlot = (name: string | null, color: string) => {
    if (!name) {
      return (
        <div className="hextech-frame flex h-14 items-center justify-center text-sm text-muted-foreground italic">
          —
        </div>
      );
    }
    if (!isPastRole) {
      return (
        <div className="hextech-frame flex h-14 items-center justify-center text-sm text-muted-foreground">
          ???
        </div>
      );
    }
    if (phase === "pre-members") {
      return (
        <div className="hextech-frame flex h-14 items-center justify-center text-sm uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Drawing…
        </div>
      );
    }
    if (phase === "members") {
      return (
        <SlotMachine<string>
          items={allMemberNames.length > 0 ? allMemberNames : [name]}
          finalItem={name}
          spinDurationMs={MEMBER_SLOT_MS}
          itemHeight={56}
          onDone={() => {
            memberDoneRef.current += 1;
            if (memberDoneRef.current >= 2 || !alphaName || !betaName) {
              setPhase("pre-champ-alpha");
            }
          }}
          renderItem={(n) => (
            <span className="font-display text-lg tracking-wide" style={{ color }}>
              {n}
            </span>
          )}
        />
      );
    }
    return (
      <div className="hextech-frame flex h-14 items-center justify-center">
        <span className="font-display text-lg tracking-wide" style={{ color, textShadow: `0 0 10px ${color}` }}>
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
        <div className="hextech-frame flex h-32 items-center justify-center text-muted-foreground italic">
          —
        </div>
      );
    }
    const myStripPhase: Phase = side === "alpha" ? "champ-alpha" : "champ-beta";
    const myPrePhase: Phase = side === "alpha" ? "pre-champ-alpha" : "pre-champ-beta";

    const beforeMe =
      !isPastMembers ||
      (side === "beta" &&
        (phase === "pre-champ-alpha" || phase === "champ-alpha"));

    if (beforeMe) {
      return (
        <div className="hextech-frame flex h-32 items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Awaiting champion
        </div>
      );
    }
    if (phase === myPrePhase) {
      return (
        <div className="hextech-frame flex h-32 items-center justify-center text-xs uppercase tracking-[0.3em] text-gold animate-pulse">
          Rolling champion…
        </div>
      );
    }
    if (phase === myStripPhase) {
      return (
        <ChampionStrip
          pool={championPool}
          finalChampion={champ}
          durationMs={side === "alpha" ? CHAMP_ALPHA_MS : CHAMP_BETA_MS}
          onDone={() => {
            if (side === "alpha") setPhase("pre-champ-beta");
            else setPhase("done");
          }}
        />
      );
    }
    return (
      <div className="hextech-frame flex h-32 items-center gap-3 px-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden border border-gold/60">
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
    <div className="grid grid-cols-1 gap-3">
      <div className="mx-auto w-full max-w-sm">{roleNode}</div>
      <div className="grid grid-cols-2 gap-3">
        {renderMemberSlot(alphaName, "var(--team-alpha)")}
        {renderMemberSlot(betaName, "var(--team-beta)")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {renderChampSlot("alpha", alphaChampion)}
        {renderChampSlot("beta", betaChampion)}
      </div>
    </div>
  );
}
