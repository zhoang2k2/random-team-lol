import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllChampions,
  pickRandomChampions,
  ROLE_META,
  type Champion,
} from "@/lib/lol-api";
import { buildLanePairings, type ExclusionPair } from "@/lib/randomize";
import { LaneRow } from "@/components/LaneRow";
import { EVENTS, formatEventTime, pickEvents, type GameEvent } from "@/lib/events";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Summoner's Draft — LoL Team Randomizer" },
      {
        name: "description",
        content:
          "Hextech-style team randomizer for League of Legends: shuffle members into Alpha & Beta, roll roles, lock in champions with CSGO-style spins.",
      },
      { property: "og:title", content: "Summoner's Draft — LoL Team Randomizer" },
      {
        property: "og:description",
        content: "Random teams, lanes & champions for your custom League of Legends matches.",
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
  const persisted = useMemo(() => loadPersisted(), []);

  const [members, setMembers] = useState<string[]>(persisted?.members ?? []);
  const [memberInput, setMemberInput] = useState("");
  const [teamSize, setTeamSize] = useState(persisted?.teamSize ?? 5);
  const [randomRole, setRandomRole] = useState(persisted?.randomRole ?? false);
  const [randomMembers, setRandomMembers] = useState(persisted?.randomMembers ?? false);
  const [exclusions, setExclusions] = useState<ExclusionPair[]>(persisted?.exclusions ?? []);
  const [exclA, setExclA] = useState("");
  const [exclB, setExclB] = useState("");
  const [laneSeconds, setLaneSeconds] = useState<number>(
    persisted?.laneSeconds ?? DEFAULT_LANE_SECONDS
  );
  const [enableEvents, setEnableEvents] = useState<boolean>(
    persisted?.enableEvents ?? false
  );
  const [eventCount, setEventCount] = useState<number>(
    persisted?.eventCount ?? 1
  );

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);
  const [champsError, setChampsError] = useState<string | null>(null);

  const [rounds, setRounds] = useState<Round[]>(
    (persisted?.rounds ?? []).map((r) => ({ ...r, events: r.events ?? [] }))
  );
  const [shuffling, setShuffling] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState<number>(-1);
  const [eventRolling, setEventRolling] = useState<{
    roundId: number;
    pool: GameEvent[];
    final: GameEvent[];
    revealedIndex: number; // how many final events are settled
    currentName: string;   // name flickering during roll
  } | null>(null);
  // brief hydration skeleton — only when we actually had persisted data
  const hadPersisted = persisted != null && ((persisted.members?.length ?? 0) > 0 || (persisted.rounds?.length ?? 0) > 0);
  const [hydrating, setHydrating] = useState<boolean>(hadPersisted);
  const usedChampionsRef = useRef<Set<string>>(
    new Set(persisted?.usedChampionIds ?? [])
  );
  const roundIdRef = useRef(persisted?.roundIdSeed ?? 0);
  const gapTimerRef = useRef<number | null>(null);
  const eventTimerRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [members, teamSize, randomRole, randomMembers, exclusions, laneSeconds, rounds, enableEvents, eventCount]);

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
    setExclusions((prev) =>
      prev.filter((p) => p.a !== name && p.b !== name)
    );
  };

  const addExclusion = () => {
    if (!exclA || !exclB || exclA === exclB) return;
    const exists = exclusions.some(
      (p) =>
        (p.a === exclA && p.b === exclB) ||
        (p.a === exclB && p.b === exclA)
    );
    if (exists) return;
    setExclusions((prev) => [...prev, { a: exclA, b: exclB }]);
    setExclA("");
    setExclB("");
  };

  const canShuffle = members.length >= 2 && champions.length > 0 && !shuffling;
  const inputsLocked = shuffling;

  const totalLanes = useMemo(
    () => Math.min(teamSize, Math.ceil(members.length / 2)),
    [teamSize, members.length]
  );

  const handleShuffle = () => {
    if (!canShuffle) return;
    const pairings = buildLanePairings(
      members,
      teamSize,
      randomRole,
      randomMembers,
      exclusions
    );
    // Count actual champion picks needed (skip null sides for odd counts)
    const totalChamps = pairings.reduce(
      (n, p) => n + (p.alpha ? 1 : 0) + (p.beta ? 1 : 0),
      0
    );

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

  const startEventRoll = (roundId: number) => {
    const desired = Math.max(0, Math.min(Math.floor(eventCount) || 0, EVENTS.length));
    if (!enableEvents || desired === 0) {
      finishRound(roundId);
      return;
    }
    const finals = pickEvents(desired);
    setEventRolling({
      roundId,
      pool: EVENTS,
      final: finals,
      revealedIndex: 0,
      currentName: EVENTS[0].name,
    });
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
    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId ? { ...r, revealed: laneIdx + 1 } : r
      )
    );

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
      setRounds((prev) =>
        prev.map((r) => (r.id === roundId ? { ...r, events: final } : r))
      );
      const t = window.setTimeout(() => finishRound(roundId), 400);
      return () => window.clearTimeout(t);
    }

    // Flicker: pick a random name from pool, then after ROLL_MS commit & advance
    let flickers = 6; // ~ a few flickers per event
    const tick = () => {
      flickers -= 1;
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      setEventRolling((prev) =>
        prev && prev.roundId === roundId
          ? { ...prev, currentName: rnd.name }
          : prev
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
            : prev
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

  const handleReset = () => {
    setRounds([]);
    setMembers([]);
    setExclusions([]);
    setMemberInput("");
    setExclA("");
    setExclB("");
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

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const activeLane =
    activeRound && activeLaneIdx >= 0
      ? activeRound.lanes[activeLaneIdx]
      : null;
  const showArena = shuffling || activeLane != null;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Header />

        {/* Shuffle Arena — TOP of page, only visible while shuffling */}
        {(showArena || eventRolling) && (
          <section
            ref={arenaRef}
            className="mt-8 hextech-frame border-gold/60 bg-background/80 p-4 sm:p-6 scroll-mt-8 animate-fade-in"
          >
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
                Summoners <span className="text-xs text-muted-foreground">({members.length}/{MAX_SUMMONERS})</span>
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
                {!hydrating && members.map((m, i) => (
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
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTeamSize(n)}
                      disabled={inputsLocked}
                      className={`btn-hex ${
                        teamSize === n ? "btn-hex-primary" : ""
                      }`}
                    >
                      {n}v{n}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow
                label="Randomize roles"
                hint="Off: ADC → Support → Jungle → Mid → Top"
                value={randomRole}
                onChange={setRandomRole}
              />
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
                  <span className="text-xs italic text-muted-foreground">
                    1–3
                  </span>
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
                      setLaneSeconds(
                        Math.min(MAX_LANE_SECONDS, Math.max(MIN_LANE_SECONDS, v))
                      );
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
                            setExclusions((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
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
                <p className="text-center text-xs text-muted-foreground">
                  {champions.length} champions loaded · {totalLanes || 0} lane
                  {totalLanes === 1 ? "" : "s"} ·{" "}
                  <button
                    className="underline hover:text-gold-bright disabled:opacity-50"
                    onClick={handleReset}
                    type="button"
                    disabled={inputsLocked}
                  >
                    reset all
                  </button>
                </p>
              )}
            </div>
          </section>

          {/* RIGHT: rounds */}
          <section ref={resultsRef} className="space-y-8 scroll-mt-8 relative">
            {hydrating && rounds.length > 0 && <ResultsSkeleton />}
            {!hydrating && rounds.length === 0 && <EmptyDraft />}
            {!hydrating &&
              rounds.map((r, idx) => (
                <RoundView key={r.id} roundNumber={idx + 1} round={r} />
              ))}
          </section>
        </div>

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
      <div className="shrink-0 border border-gold/50 bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-gold-bright">
        {formatEventTime(event.time)}
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm uppercase tracking-[0.18em] text-gold-bright">
          {event.name}
        </div>
        <div className="mt-0.5 font-serif text-xs text-muted-foreground">
          {event.content}
        </div>
      </div>
    </div>
  );
}

function SummonerSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="h-7 w-24 border border-gold/30 bg-gold/5 animate-pulse"
        />
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
      <p className="font-display text-xs uppercase tracking-[0.5em] text-gold">
        Hextech Workshop
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.2em] text-gold-bright text-glow-gold md:text-5xl">
        Summoner's Draft
      </h1>
      <div className="gold-divider mx-auto mt-3 max-w-md" />
      <p className="mt-3 font-serif text-sm italic text-muted-foreground">
        Random team builder for League of Legends · Alpha vs Beta
      </p>
    </header>
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
        {hint && (
          <div className="mt-0.5 text-xs italic text-muted-foreground">
            {hint}
          </div>
        )}
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
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-hex w-full"
    >
      <option value="">{placeholder}</option>
      {options.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

function RoundView({
  roundNumber,
  round,
}: {
  roundNumber: number;
  round: Round;
}) {
  const visibleLanes = round.lanes.slice(0, round.revealed);
  return (
    <div className="hextech-frame p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.4em] text-gold">
          Round {roundNumber}
        </h3>
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.3em]">
          <span style={{ color: "var(--team-alpha)" }}>Team Alpha</span>
          <span className="text-muted-foreground">vs</span>
          <span style={{ color: "var(--team-beta)" }}>Team Beta</span>
        </div>
      </div>
      <div className="gold-divider my-4" />

      {round.events && round.events.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">
            Ông trời kêu vậy
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
                <th className="border-b border-gold/40 px-3 py-2 text-left" style={{ color: "var(--team-alpha)" }}>
                  Team Alpha
                </th>
                <th className="border-b border-gold/40 px-3 py-2 text-left" style={{ color: "var(--team-beta)" }}>
                  Team Beta
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
                  <TeamCell
                    name={lane.betaName}
                    champ={lane.betaChamp}
                    color="var(--team-beta)"
                  />
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
          <div className="font-display text-sm tracking-wide truncate" style={{ color, textShadow: `0 0 8px ${color}` }}>
            {name}
          </div>
          <div className="text-xs text-gold-bright truncate">{champ.name}</div>
          <div className="text-[10px] italic text-muted-foreground truncate">{champ.title}</div>
        </div>
      </div>
    </td>
  );
}
