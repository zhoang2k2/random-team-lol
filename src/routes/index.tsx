import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllChampions,
  pickRandomChampions,
  ROLE_META,
  type Champion,
  type Role,
} from "@/lib/lol-api";
import { buildLanePairings, type ExclusionPair } from "@/lib/randomize";
import { LaneRow } from "@/components/LaneRow";
import { EVENTS, formatEventTime, pickEvents, type GameEvent } from "@/lib/events";
import { InternalNav } from "@/components/InternalNav";

const HOME_TITLE = "Random Team LOL — Chia Team Liên Minh Huyền Thoại Online | Nghiện LOL";
const HOME_DESC =
  "Công cụ random team Liên Minh Huyền Thoại miễn phí: chia đội Alpha/Beta, random lane, random tướng cho custom game, ARAM, đấu nội bộ. Nhanh, cân bằng, không cần đăng nhập.";
const HOME_URL = "https://random-team-lol.lovable.app/";
const HOME_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f46e38b-7f65-4499-90d0-f533ae0b30bd/id-preview-59dea75c--798fb065-8b64-41bc-a26e-91489f067067.lovable.app-1778658824543.png";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
      { property: "og:image", content: HOME_OG_IMAGE },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESC },
      { name: "twitter:image", content: HOME_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Random Team LOL",
          url: HOME_URL,
          applicationCategory: "GameApplication",
          operatingSystem: "Any (Web)",
          browserRequirements: "Requires JavaScript",
          inLanguage: ["vi-VN", "en"],
          description: HOME_DESC,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "Random chia team Alpha/Beta cân bằng",
            "Random lane (Top, Jungle, Mid, ADC, Support)",
            "Random tướng từ pool 160+ champion LMHT",
            "Hỗ trợ ARAM mode",
            "Loại trừ cặp người chơi (exclusion pairs)",
            "Sự kiện ngẫu nhiên trong trận (special events)",
            "Lưu lịch sử shuffle local",
          ],
        }),
      },
    ],
  }),
});

type RoundLane = {
  role: ReturnType<typeof buildLanePairings>[number]["role"];
  alphaName: string | null;
  betaName: string | null;
  alphaChamp: Champion | null;
  betaChamp: Champion | null;
};

type Round = {
  id: number;
  lanes: RoundLane[];
  revealed: number; // count of lanes already revealed in table
  events: GameEvent[]; // rolled events for this round (empty if disabled)
};

const INTER_LANE_GAP_MS = 1000;
const DEFAULT_LANE_SECONDS = 3;
const MIN_LANE_SECONDS = 2;
const MAX_LANE_SECONDS = 30;
const MAX_SUMMONERS = 10;
const EVENT_ROLL_MS = 200; // 0.2s per event roll
const STORAGE_KEY = "summoners-draft-state-v1";

type PersistedState = {
  members: string[];
  teamSize: number;
  randomRole: boolean;
  randomMembers: boolean;
  exclusions: ExclusionPair[];
  laneSeconds: number;
  rounds: Round[];
  usedChampionIds: string[];
  roundIdSeed: number;
  enableEvents: boolean;
  eventCount: number;
  defaultRoles?: Record<Role, { p1: string; p2: string }>;
};

function loadPersisted(): Partial<PersistedState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function HomePage() {
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [teamSize, setTeamSize] = useState(5);
  const [randomRole, setRandomRole] = useState(false);
  const [randomMembers, setRandomMembers] = useState(false);
  const [exclusions, setExclusions] = useState<ExclusionPair[]>([]);
  const [exclA, setExclA] = useState("");
  const [exclB, setExclB] = useState("");
  const [laneSeconds, setLaneSeconds] = useState<number>(DEFAULT_LANE_SECONDS);
  const [enableEvents, setEnableEvents] = useState<boolean>(false);
  const [eventCount, setEventCount] = useState<number>(1);
  const [defaultRoles, setDefaultRoles] = useState<Record<Role, { p1: string; p2: string }>>({
    TOP: { p1: "", p2: "" },
    JUNGLE: { p1: "", p2: "" },
    MID: { p1: "", p2: "" },
    ADC: { p1: "", p2: "" },
    SUPPORT: { p1: "", p2: "" },
  });

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);
  const [champsError, setChampsError] = useState<string | null>(null);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState<number>(-1);
  const [eventRolling, setEventRolling] = useState<{
    roundId: number;
    pool: GameEvent[];
    final: GameEvent[];
    revealedIndex: number;
    currentName: string;
  } | null>(null);
  const [hydrating, setHydrating] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const usedChampionsRef = useRef<Set<string>>(new Set());
  const roundIdRef = useRef(0);
  const gapTimerRef = useRef<number | null>(null);
  const eventTimerRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Load persisted state after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      if (persisted.members) setMembers(persisted.members);
      if (typeof persisted.teamSize === "number") setTeamSize(persisted.teamSize);
      if (typeof persisted.randomRole === "boolean") setRandomRole(persisted.randomRole);
      if (typeof persisted.randomMembers === "boolean") setRandomMembers(persisted.randomMembers);
      if (persisted.exclusions) setExclusions(persisted.exclusions);
      if (typeof persisted.laneSeconds === "number") setLaneSeconds(persisted.laneSeconds);
      if (typeof persisted.enableEvents === "boolean") setEnableEvents(persisted.enableEvents);
      if (typeof persisted.eventCount === "number")
        setEventCount(Math.min(3, Math.max(1, persisted.eventCount)));
      if (persisted.defaultRoles) setDefaultRoles(persisted.defaultRoles);
      if (persisted.rounds)
        setRounds(persisted.rounds.map((r) => ({ ...r, events: r.events ?? [] })));
      if (persisted.usedChampionIds) usedChampionsRef.current = new Set(persisted.usedChampionIds);
      if (typeof persisted.roundIdSeed === "number") roundIdRef.current = persisted.roundIdSeed;
      const hadData = (persisted.members?.length ?? 0) > 0 || (persisted.rounds?.length ?? 0) > 0;
      if (hadData) setHydrating(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let alive = true;
    getAllChampions()
      .then((c) => {
        if (!alive) return;
        setChampions(c);
        setLoadingChamps(false);
      })
      .catch((e) => {
        if (!alive) return;
        setChampsError(String(e));
        setLoadingChamps(false);
      });
    return () => {
      alive = false;
      if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
      if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
    };
  }, []);

  // Brief skeleton when we hydrated from storage so the UI doesn't pop in coldly.
  useEffect(() => {
    if (!hydrating) return;
    const t = window.setTimeout(() => setHydrating(false), 600);
    return () => window.clearTimeout(t);
  }, [hydrating]);

  // Persist to localStorage whenever durable state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    const state: PersistedState = {
      members,
      teamSize,
      randomRole,
      randomMembers,
      exclusions,
      laneSeconds,
      rounds,
      usedChampionIds: Array.from(usedChampionsRef.current),
      roundIdSeed: roundIdRef.current,
      enableEvents,
      eventCount,
      defaultRoles,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [
    hydrated,
    members,
    teamSize,
    randomRole,
    randomMembers,
    exclusions,
    laneSeconds,
    rounds,
    enableEvents,
    eventCount,
    defaultRoles,
  ]);

  const addMember = () => {
    const v = memberInput.trim();
    if (!v) return;
    if (members.length >= MAX_SUMMONERS) {
      setMemberInput("");
      return;
    }
    if (members.includes(v)) {
      setMemberInput("");
      return;
    }
    setMembers((prev) => [...prev, v]);
    setMemberInput("");
  };

  const removeMember = (name: string) => {
    setMembers((prev) => prev.filter((m) => m !== name));
    setExclusions((prev) => prev.filter((p) => p.a !== name && p.b !== name));
    setDefaultRoles((prev) => {
      const updated = { ...prev };
      for (const r of Object.keys(updated) as Role[]) {
        updated[r] = {
          p1: updated[r].p1 === name ? "" : updated[r].p1,
          p2: updated[r].p2 === name ? "" : updated[r].p2,
        };
      }
      return updated;
    });
  };

  const addExclusion = () => {
    if (!exclA || !exclB || exclA === exclB) return;
    const exists = exclusions.some(
      (p) => (p.a === exclA && p.b === exclB) || (p.a === exclB && p.b === exclA),
    );
    if (exists) return;
    setExclusions((prev) => [...prev, { a: exclA, b: exclB }]);
    setExclA("");
    setExclB("");
  };

  const canShuffle = members.length >= 2 && champions.length > 0 && !shuffling;
  const inputsLocked = shuffling;

  // Minimum team size = floor(n/2) so both teams can field full lanes
  // (odd 7th sits as solo on Alpha). Capped to 5 (max 5v5).
  const minTeamSize = Math.max(1, Math.min(5, Math.floor(members.length / 2)));

  // Auto-bump teamSize if below the minimum required for current roster.
  useEffect(() => {
    if (teamSize < minTeamSize) setTeamSize(minTeamSize);
  }, [minTeamSize, teamSize]);

  const totalLanes = useMemo(
    () => Math.min(teamSize, Math.ceil(members.length / 2)),
    [teamSize, members.length],
  );

  const handleShuffle = () => {
    if (!canShuffle) return;
    const pairings = buildLanePairings(
      members,
      teamSize,
      false, // Force randomRole to false
      randomMembers,
      exclusions,
      defaultRoles,
    );
    // Count actual champion picks needed (skip null sides for odd counts)
    const totalChamps = pairings.reduce((n, p) => n + (p.alpha ? 1 : 0) + (p.beta ? 1 : 0), 0);

    let used = usedChampionsRef.current;
    const available = champions.length - used.size;
    if (available < totalChamps) {
      used = new Set();
      usedChampionsRef.current = used;
    }
    const champPicks = pickRandomChampions(champions, totalChamps, used);
    champPicks.forEach((c) => used.add(c.id));

    let cursor = 0;
    const lanes: RoundLane[] = pairings.map((p) => {
      const alphaChamp = p.alpha ? champPicks[cursor++] : null;
      const betaChamp = p.beta ? champPicks[cursor++] : null;
      return {
        role: p.role,
        alphaName: p.alpha,
        betaName: p.beta,
        alphaChamp,
        betaChamp,
      };
    });
    roundIdRef.current += 1;
    const newRound: Round = {
      id: roundIdRef.current,
      lanes,
      revealed: 0,
      events: [],
    };
    setRounds((prev) => [...prev, newRound]);
    setShuffling(true);
    setActiveRoundId(newRound.id);
    setActiveLaneIdx(0);
    requestAnimationFrame(() => {
      arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const startEventRoll = (roundId: number, countOverride?: number) => {
    const desiredCount = countOverride !== undefined ? countOverride : eventCount;
    const desired = Math.max(0, Math.min(Math.floor(desiredCount) || 0, EVENTS.length));
    if ((!enableEvents && countOverride === undefined) || desired === 0) {
      finishRound(roundId);
      return;
    }
    const finals = pickEvents(desired);

    // Clear the events of the round we are re-rolling
    setRounds((prev) => prev.map((r) => (r.id === roundId ? { ...r, events: [] } : r)));

    setEventRolling({
      roundId,
      pool: EVENTS,
      final: finals,
      revealedIndex: 0,
      currentName: EVENTS[0].name,
    });
    setShuffling(true); // make sure inputs are locked during reshuffle
    requestAnimationFrame(() => {
      arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleStopShuffle = () => {
    if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
    if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
    setRounds((prev) =>
      prev.filter(
        (r) => r.id !== activeRoundId && (!eventRolling || r.id !== eventRolling.roundId),
      ),
    );
    setShuffling(false);
    setActiveRoundId(null);
    setActiveLaneIdx(-1);
    setEventRolling(null);
  };

  const finishRound = (_roundId: number) => {
    setShuffling(false);
    setActiveRoundId(null);
    setEventRolling(null);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleLaneComplete = () => {
    const roundId = activeRoundId;
    const laneIdx = activeLaneIdx;
    if (roundId == null || laneIdx < 0) return;

    setActiveLaneIdx(-1);
    setRounds((prev) => prev.map((r) => (r.id === roundId ? { ...r, revealed: laneIdx + 1 } : r)));

    const round = rounds.find((r) => r.id === roundId);
    const totalLaneCount = round?.lanes.length ?? 0;
    const nextIdx = laneIdx + 1;

    if (nextIdx >= totalLaneCount) {
      // All lanes done — now roll events if enabled, then finish.
      startEventRoll(roundId);
      return;
    }

    gapTimerRef.current = window.setTimeout(() => {
      setActiveLaneIdx(nextIdx);
    }, INTER_LANE_GAP_MS);
  };

  // Drive event roll: every EVENT_ROLL_MS we flicker the name; once we land on
  // each final event we commit it and continue with the next.
  useEffect(() => {
    if (!eventRolling) return;
    const { roundId, pool, final, revealedIndex } = eventRolling;

    if (revealedIndex >= final.length) {
      // commit events into the round, then finish
      setRounds((prev) => prev.map((r) => (r.id === roundId ? { ...r, events: final } : r)));
      const t = window.setTimeout(() => finishRound(roundId), 400);
      return () => window.clearTimeout(t);
    }

    // Flicker: pick a random name from pool, then after ROLL_MS commit & advance
    let flickers = 6; // ~ a few flickers per event
    const tick = () => {
      flickers -= 1;
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      setEventRolling((prev) =>
        prev && prev.roundId === roundId ? { ...prev, currentName: rnd.name } : prev,
      );
      if (flickers <= 0) {
        // settle on the actual final event
        setEventRolling((prev) =>
          prev && prev.roundId === roundId
            ? {
                ...prev,
                currentName: final[revealedIndex].name,
                revealedIndex: revealedIndex + 1,
              }
            : prev,
        );
        return;
      }
      eventTimerRef.current = window.setTimeout(tick, EVENT_ROLL_MS);
    };
    eventTimerRef.current = window.setTimeout(tick, EVENT_ROLL_MS);
    return () => {
      if (eventTimerRef.current) window.clearTimeout(eventTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventRolling?.roundId, eventRolling?.revealedIndex]);

  const handleResetAll = () => {
    setRounds([]);
    setActiveRoundId(null);
    setEventRolling(null);
    setMembers([]);
    setExclusions([]);
    setMemberInput("");
    setExclA("");
    setExclB("");
    setDefaultRoles({
      TOP: { p1: "", p2: "" },
      JUNGLE: { p1: "", p2: "" },
      MID: { p1: "", p2: "" },
      ADC: { p1: "", p2: "" },
      SUPPORT: { p1: "", p2: "" },
    });
    usedChampionsRef.current = new Set();
    roundIdRef.current = 0;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const handleResetResults = () => {
    setRounds([]);
    setActiveRoundId(null);
    setEventRolling(null);
    usedChampionsRef.current = new Set();
    roundIdRef.current = 0;
  };

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const activeLane = activeRound && activeLaneIdx >= 0 ? activeRound.lanes[activeLaneIdx] : null;
  const showArena = shuffling || activeLane != null;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Header />

        {/* Shuffle Arena — TOP of page, only visible while shuffling */}
        {(showArena || eventRolling) && (
          <section
            ref={arenaRef}
            className="mt-8 hextech-frame border-gold/60 bg-background/80 p-4 sm:p-6 scroll-mt-8 animate-fade-in relative"
          >
            <button
              onClick={handleStopShuffle}
              className="absolute top-2 right-4 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive z-10"
              title="Dừng shuffle ngay lập tức"
            >
              Stop
            </button>
            <h2 className="font-display text-center text-sm uppercase tracking-[0.4em] text-gold">
              {eventRolling
                ? `Round ${rounds.findIndex((r) => r.id === eventRolling.roundId) + 1} · Ông trời kêu vậy`
                : activeRound && activeLane
                  ? `Round ${rounds.findIndex((r) => r.id === activeRound.id) + 1} · Lane ${activeLaneIdx + 1} / ${activeRound.lanes.length}`
                  : "Shuffle Arena"}
            </h2>
            <div className="gold-divider my-3" />
            <div className="flex min-h-[360px] items-center justify-center">
              {eventRolling ? (
                <EventRollPanel
                  pool={eventRolling.pool}
                  final={eventRolling.final}
                  revealedIndex={eventRolling.revealedIndex}
                  currentName={eventRolling.currentName}
                />
              ) : activeLane && activeRound ? (
                <div className="w-full max-w-3xl mx-auto">
                  <LaneRow
                    key={`${activeRound.id}-${activeLaneIdx}`}
                    index={activeLaneIdx}
                    finalRole={activeLane.role}
                    alphaName={activeLane.alphaName}
                    betaName={activeLane.betaName}
                    alphaChampion={activeLane.alphaChamp}
                    betaChampion={activeLane.betaChamp}
                    allMemberNames={members}
                    championPool={champions}
                    scale={laneSeconds / DEFAULT_LANE_SECONDS}
                    onComplete={handleLaneComplete}
                  />
                </div>
              ) : (
                <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                  Channeling…
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          {/* LEFT: setup column */}
          <section className={`space-y-6 ${inputsLocked ? "pointer-events-none opacity-60" : ""}`}>
            <div className="hextech-frame p-5">
              <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold-bright">
                Summoners{" "}
                <span className="text-xs text-muted-foreground">
                  ({members.length}/{MAX_SUMMONERS})
                </span>
              </h2>
              <div className="gold-divider my-3" />

              <div className="flex gap-2">
                <input
                  className="input-hex w-full"
                  placeholder={
                    members.length >= MAX_SUMMONERS
                      ? `Max ${MAX_SUMMONERS} summoners`
                      : "Enter summoner name…"
                  }
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  disabled={inputsLocked || members.length >= MAX_SUMMONERS}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMember();
                    }
                  }}
                />
                <button
                  className="btn-hex"
                  onClick={addMember}
                  type="button"
                  disabled={inputsLocked || members.length >= MAX_SUMMONERS}
                >
                  Add
                </button>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {hydrating && members.length > 0 && (
                  <SummonerSkeleton count={Math.min(members.length, 5)} />
                )}
                {!hydrating && members.length === 0 && (
                  <li className="text-sm italic text-muted-foreground">
                    No summoners yet. Add at least 2 to begin.
                  </li>
                )}
                {!hydrating &&
                  members.map((m, i) => (
                    <li
                      key={m}
                      className="group flex items-center gap-2 border border-gold/50 bg-card/60 px-2 py-1"
                    >
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                      <span className="font-display text-sm text-gold-bright">{m}</span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember(m)}
                        aria-label={`Remove ${m}`}
                        disabled={inputsLocked}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="hextech-frame p-5 space-y-4">
              <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold-bright">
                Match Settings
              </h2>
              <div className="gold-divider" />

              {/* Team size */}
              <div>
                <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Players per team
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((n) => {
                    const tooSmall = n < minTeamSize;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTeamSize(n)}
                        disabled={inputsLocked || tooSmall}
                        title={
                          tooSmall
                            ? `Need at least ${minTeamSize}v${minTeamSize} for ${members.length} players`
                            : undefined
                        }
                        className={`btn-hex ${
                          teamSize === n ? "btn-hex-primary" : ""
                        } ${tooSmall ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {n}v{n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default role */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Default role
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDefaultRoles({
                        TOP: { p1: "", p2: "" },
                        JUNGLE: { p1: "", p2: "" },
                        MID: { p1: "", p2: "" },
                        ADC: { p1: "", p2: "" },
                        SUPPORT: { p1: "", p2: "" },
                      })
                    }
                    className="text-[10px] text-muted-foreground hover:text-gold-bright transition-colors uppercase tracking-wider font-display"
                    disabled={inputsLocked}
                  >
                    Clear
                  </button>
                </div>

                <div className="border border-gold/20 bg-background/20 p-3 space-y-3 mt-2">
                  <div className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center text-center font-display text-[10px] uppercase tracking-wider text-muted-foreground border-b border-gold/15 pb-2">
                    <div>Role</div>
                    <div>Người chơi 1</div>
                    <div>Người chơi 2</div>
                  </div>

                  {(() => {
                    const activeMembers = members.slice(0, teamSize * 2);
                    const lanesNeeded = Math.ceil(activeMembers.length / 2);
                    
                    const activeRoleKeys = (["ADC", "SUPPORT", "JUNGLE", "MID", "TOP"] as Role[]).filter(r => 
                      (defaultRoles[r].p1 && activeMembers.includes(defaultRoles[r].p1)) || 
                      (defaultRoles[r].p2 && activeMembers.includes(defaultRoles[r].p2))
                    );
                    
                    const maxLanesReached = activeRoleKeys.length >= lanesNeeded;

                    return (["ADC", "SUPPORT", "JUNGLE", "MID", "TOP"] as Role[]).map((role) => {
                      const meta = ROLE_META[role];
                      const isRoleActive = activeRoleKeys.includes(role);
                      const isRoleDisabled = maxLanesReached && !isRoleActive;

                      const getAvailableOptions = (currentSlotKey: "p1" | "p2") => {
                        const currentSelectedVal = defaultRoles[role][currentSlotKey];
                        return members.filter((m) => {
                          const isSelectedElsewhere = Object.entries(defaultRoles).some(
                            ([r, config]) => {
                              if (r === role) {
                                if (currentSlotKey === "p1") {
                                  return config.p2 === m;
                                } else {
                                  return config.p1 === m;
                                }
                              }
                              return config.p1 === m || config.p2 === m;
                            },
                          );
                          return !isSelectedElsewhere || m === currentSelectedVal;
                        });
                      };

                      const handleRoleChange = (slotKey: "p1" | "p2", val: string) => {
                        setDefaultRoles((prev) => {
                          let next = { ...prev, [role]: { ...prev[role], [slotKey]: val } };
                          let changed = true;
                          while (changed) {
                            changed = false;
                            const assigned = new Set<string>();
                            const currentActiveRoles: Role[] = [];
                            
                            for (const r of ["ADC", "SUPPORT", "JUNGLE", "MID", "TOP"] as Role[]) {
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
                            
                            const unassigned = activeMembers.filter(m => !assigned.has(m));
                            const allowedRoles = currentActiveRoles.length >= lanesNeeded ? currentActiveRoles : (["ADC", "SUPPORT", "JUNGLE", "MID", "TOP"] as Role[]);
                            
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
                        });
                      };

                      return (
                        <div key={role} className={`grid grid-cols-[50px_1fr_1fr] gap-2 items-center transition-opacity duration-300 ${isRoleDisabled ? "opacity-30" : ""}`}>
                          <div className="flex justify-center items-center min-w-0" title={isRoleDisabled ? "Đã đạt đủ số lượng lane tối đa" : ""}>
                            <img
                              src={meta.iconUrl}
                              alt={meta.label}
                              className="w-6 h-6 shrink-0"
                              style={{ filter: "drop-shadow(0 0 2px rgba(255,215,0,0.4))" }}
                            />
                          </div>

                          <SummonerSelect
                            value={defaultRoles[role].p1}
                            onChange={(val) => handleRoleChange("p1", val)}
                            options={getAvailableOptions("p1")}
                            placeholder="Chọn..."
                            disabled={inputsLocked || isRoleDisabled}
                          />

                          <SummonerSelect
                            value={defaultRoles[role].p2}
                            onChange={(val) => handleRoleChange("p2", val)}
                            options={getAvailableOptions("p2")}
                            placeholder="Chọn..."
                            disabled={inputsLocked || isRoleDisabled}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Toggles */}
              <div>
                <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Additional Options
                </label>
                <div className="mt-2 space-y-4">
                  {/* "Randomize roles" temporarily hidden */}
                  <ToggleRow
                    label="Randomize members"
                    hint="Off: split by entry order. On: reshuffle on every spin."
                    value={randomMembers}
                    onChange={setRandomMembers}
                  />

                  {/* Ông trời kêu vậy */}
                  <ToggleRow
                    label="Ông trời kêu vậy"
                    hint="Roll random in-game events after each round."
                    value={enableEvents}
                    onChange={setEnableEvents}
                  />
                  <div className={enableEvents ? "" : "opacity-50 pointer-events-none"}>
                    <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Số sự kiện
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={3}
                        step={1}
                        className="input-hex w-24"
                        value={eventCount}
                        disabled={!enableEvents || inputsLocked}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isNaN(v)) return;
                          setEventCount(Math.min(3, Math.max(1, Math.floor(v))));
                        }}
                      />
                      <span className="text-xs italic text-muted-foreground">1–3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Random duration */}
              <div>
                <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Lane spin (seconds)
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={MIN_LANE_SECONDS}
                    max={MAX_LANE_SECONDS}
                    step={0.5}
                    className="input-hex w-24"
                    value={laneSeconds}
                    disabled={inputsLocked}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isNaN(v)) return;
                      setLaneSeconds(Math.min(MAX_LANE_SECONDS, Math.max(MIN_LANE_SECONDS, v)));
                    }}
                  />
                  <button
                    type="button"
                    className="btn-hex text-xs"
                    onClick={() => setLaneSeconds(DEFAULT_LANE_SECONDS)}
                    disabled={inputsLocked}
                  >
                    Reset
                  </button>
                  <span className="text-xs italic text-muted-foreground">
                    {MIN_LANE_SECONDS}–{MAX_LANE_SECONDS}s
                  </span>
                </div>
              </div>

              {/* Exclusions */}
              <div>
                <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Never on the same team
                </label>
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <SummonerSelect
                    value={exclA}
                    onChange={setExclA}
                    options={members.filter((m) => m !== exclB)}
                    placeholder="Summoner A"
                  />
                  <SummonerSelect
                    value={exclB}
                    onChange={setExclB}
                    options={members.filter((m) => m !== exclA)}
                    placeholder="Summoner B"
                  />
                  <button
                    type="button"
                    className="btn-hex"
                    onClick={addExclusion}
                    disabled={inputsLocked || !exclA || !exclB || exclA === exclB}
                  >
                    +
                  </button>
                </div>

                {exclusions.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {exclusions.map((p, i) => (
                      <li
                        key={`${p.a}-${p.b}-${i}`}
                        className="flex items-center justify-between border border-gold/30 bg-background/40 px-2 py-1 text-sm"
                      >
                        <span>
                          <span className="text-gold-bright">{p.a}</span>
                          <span className="mx-2 text-muted-foreground">⚔</span>
                          <span className="text-gold-bright">{p.b}</span>
                        </span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setExclusions((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          disabled={inputsLocked}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="btn-hex btn-hex-primary w-full text-base"
                onClick={handleShuffle}
                disabled={!canShuffle}
              >
                {shuffling ? "Drafting…" : `Shuffle — Round ${rounds.length + 1}`}
              </button>
              {loadingChamps && (
                <p className="text-center text-xs italic text-muted-foreground">
                  Loading champions from Data Dragon…
                </p>
              )}
              {champsError && (
                <p className="text-center text-xs text-destructive">
                  Failed to load champions: {champsError}
                </p>
              )}
              {!loadingChamps && !champsError && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <p className="text-center text-xs text-muted-foreground">
                    {champions.length} champions loaded · {totalLanes || 0} lane
                    {totalLanes === 1 ? "" : "s"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn-hex text-[10px] px-3 py-1.5"
                      onClick={handleResetResults}
                      type="button"
                      disabled={inputsLocked || rounds.length === 0}
                    >
                      Reset Result
                    </button>
                    <button
                      className="btn-hex text-[10px] px-3 py-1.5 border-destructive/50 text-destructive-foreground hover:bg-destructive/10"
                      onClick={handleResetAll}
                      type="button"
                      disabled={inputsLocked}
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: rounds */}
          <section ref={resultsRef} className="space-y-8 scroll-mt-8 relative">
            {hydrating && rounds.length > 0 && <ResultsSkeleton />}
            {!hydrating && rounds.length === 0 && <EmptyDraft />}
            {!hydrating &&
              rounds.map((r, idx) => (
                <RoundView
                  key={r.id}
                  roundNumber={idx + 1}
                  round={r}
                  onReshuffle={startEventRoll}
                  disabled={inputsLocked}
                />
              ))}
          </section>
        </div>

        <InternalNav currentPath="/" />
        <Footer />
      </div>
    </div>
  );
}

function EventRollPanel({
  pool,
  final,
  revealedIndex,
  currentName,
}: {
  pool: GameEvent[];
  final: GameEvent[];
  revealedIndex: number;
  currentName: string;
}) {
  void pool;
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="hextech-frame px-4 py-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Sự kiện {Math.min(revealedIndex + 1, final.length)} / {final.length}
        </div>
        <div className="mt-2 font-display text-2xl uppercase tracking-widest text-gold-bright text-glow-gold animate-pulse">
          {currentName}
        </div>
      </div>
      {revealedIndex > 0 && (
        <ul className="space-y-2">
          {final.slice(0, revealedIndex).map((ev) => (
            <li key={ev.id}>
              <EventCard event={ev} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  return (
    <div className="hextech-frame flex items-start gap-3 px-3 py-2 animate-fade-in">
      <div className="shrink-0 w-24 text-center border border-gold/50 bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-gold-bright">
        {formatEventTime(event.time)}
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm uppercase tracking-[0.18em] text-gold-bright">
          {event.name}
        </div>
        <div className="mt-0.5 font-serif text-xs text-muted-foreground">{event.content}</div>
      </div>
    </div>
  );
}

function SummonerSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="h-7 w-24 border border-gold/30 bg-gold/5 animate-pulse" />
      ))}
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="hextech-frame p-5 animate-pulse">
      <div className="h-4 w-32 bg-gold/20" />
      <div className="gold-divider my-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-gold/10 border border-gold/20" />
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="text-center">
      <p className="font-display text-xs uppercase tracking-[0.5em] text-gold">CMVN</p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.2em] text-gold-bright text-glow-gold md:text-5xl">
        Xóm Nghẹo
      </h1>
      <div className="gold-divider mx-auto mt-3 max-w-md" />
      <p className="mt-3 font-serif text-sm italic text-muted-foreground">
        Vĩ nhân nào không có 1 quá khứ, Kẻ nghiện nào chẳng còn 1 tương lai
      </p>
    </header>
  );
}

function TeamHeading({ side }: { side: "alpha" | "beta" }) {
  const isAlpha = side === "alpha";
  const color = isAlpha ? "var(--team-alpha)" : "var(--team-beta)";
  const label = isAlpha ? "Team Alpha" : "Team Beta";
  return (
    <span
      className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.3em]"
      style={{ color, textShadow: `0 0 10px ${color}` }}
    >
      {isAlpha ? (
        // Crossed swords (Alpha → aggression)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14.5 17.5 21 21l-1-4-3.5-3.5" />
          <path d="m3 3 7.5 7.5" />
          <path d="M9.5 17.5 3 21l1-4 3.5-3.5" />
          <path d="m21 3-7.5 7.5" />
        </svg>
      ) : (
        // Shield (Beta → defense)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )}
      <span style={{ fontFamily: "'Cinzel', 'Trajan Pro', serif", letterSpacing: "0.25em" }}>
        {label}
      </span>
    </span>
  );
}

function Footer() {
  return (
    <footer className="mt-16 text-center text-xs text-muted-foreground">
      <p>
        Champions, roles & artwork via{" "}
        <a
          href="https://developer.riotgames.com/docs/lol#data-dragon"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-gold-bright"
        >
          Riot Data Dragon
        </a>
        . Not endorsed by Riot Games.
      </p>
    </footer>
  );
}

function EmptyDraft() {
  return (
    <div className="hextech-frame flex h-full min-h-[400px] flex-col items-center justify-center p-10 text-center">
      <div className="font-display text-3xl uppercase tracking-[0.3em] text-gold-bright text-glow-gold">
        Awaiting the draft
      </div>
      <div className="gold-divider my-4 w-32" />
      <p className="max-w-md text-sm italic text-muted-foreground">
        Add summoners on the left, set the rules of engagement, then strike{" "}
        <span className="text-gold-bright">Shuffle</span> to begin the ceremony.
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="group flex w-full items-center justify-between gap-4 border border-gold/30 bg-background/40 px-3 py-2 text-left transition hover:border-gold"
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
}

function SummonerSelect({
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
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        className={`input-hex w-full flex items-center justify-between text-left py-2 px-3 transition-all ${
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

function RoundView({
  roundNumber,
  round,
  onReshuffle,
  disabled,
}: {
  roundNumber: number;
  round: Round;
  onReshuffle?: (roundId: number, count: number) => void;
  disabled?: boolean;
}) {
  const visibleLanes = round.lanes.slice(0, round.revealed);
  const [localEventCount, setLocalEventCount] = useState(round.events?.length || 1);

  useEffect(() => {
    if (round.events && round.events.length > 0) {
      setLocalEventCount(round.events.length);
    }
  }, [round.events]);

  return (
    <div className="hextech-frame p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.4em] text-gold">
          Round {roundNumber}
        </h3>
      </div>
      <div className="gold-divider my-4" />

      {round.events && round.events.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4">
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">
              Ông trời kêu vậy
            </div>
            {onReshuffle && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={3}
                  step={1}
                  className="input-hex w-16 h-9 text-xs px-1 py-0"
                  value={localEventCount}
                  disabled={disabled}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) setLocalEventCount(Math.max(1, Math.floor(v)));
                  }}
                />
                <button
                  type="button"
                  className="btn-hex text-[10px] px-2 py-0.5"
                  onClick={() => onReshuffle(round.id, localEventCount)}
                  disabled={disabled}
                >
                  Re-shuffle events
                </button>
              </div>
            )}
          </div>
          <ul className="space-y-2">
            {round.events.map((ev) => (
              <li key={ev.id}>
                <EventCard event={ev} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {visibleLanes.length === 0 ? (
        <div className="py-6 text-center text-xs italic uppercase tracking-[0.3em] text-muted-foreground">
          Awaiting first lane reveal…
        </div>
      ) : (
        <div className="overflow-hidden border border-gold/40">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gold/10 text-xs uppercase tracking-[0.25em] text-gold">
                <th className="border-b border-gold/40 px-3 py-2 text-left">Lane</th>
                <th className="border-b border-gold/40 px-3 py-2 text-left">
                  <TeamHeading side="alpha" />
                </th>
                <th className="border-b border-gold/40 px-3 py-2 text-left">
                  <TeamHeading side="beta" />
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleLanes.map((lane, i) => (
                <tr
                  key={`${round.id}-${i}`}
                  className="animate-fade-in border-b border-gold/20 last:border-b-0 align-middle"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={ROLE_META[lane.role].iconUrl}
                        alt={lane.role}
                        className="h-6 w-6"
                        style={{ filter: "drop-shadow(0 0 4px var(--gold))" }}
                      />
                      <span className="font-display text-xs uppercase tracking-[0.2em] text-gold-bright">
                        {ROLE_META[lane.role].label}
                      </span>
                    </div>
                  </td>
                  <TeamCell
                    name={lane.alphaName}
                    champ={lane.alphaChamp}
                    color="var(--team-alpha)"
                  />
                  <TeamCell name={lane.betaName} champ={lane.betaChamp} color="var(--team-beta)" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {round.revealed < round.lanes.length && (
        <div className="mt-3 text-center text-xs italic uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Drafting lane {round.revealed + 1} of {round.lanes.length}…
        </div>
      )}
    </div>
  );
}

function TeamCell({
  name,
  champ,
  color,
}: {
  name: string | null;
  champ: Champion | null;
  color: string;
}) {
  if (!name || !champ) {
    return <td className="px-3 py-3 text-muted-foreground italic">—</td>;
  }
  return (
    <td className="px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden border border-gold/50">
          <img src={champ.squareUrl} alt={champ.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div
            className="font-display text-sm tracking-wide truncate"
            style={{ color, textShadow: `0 0 8px ${color}` }}
          >
            {name}
          </div>
          <div className="text-xs text-gold-bright truncate">{champ.name}</div>
          <div className="text-[10px] italic text-muted-foreground truncate">{champ.title}</div>
        </div>
      </div>
    </td>
  );
}
