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
};

const INTER_LANE_GAP_MS = 1000;
const DEFAULT_LANE_SECONDS = 4.5;
const MIN_LANE_SECONDS = 3;
const MAX_LANE_SECONDS = 30;

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

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);
  const [champsError, setChampsError] = useState<string | null>(null);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState<number>(-1); // -1 = closed
  const usedChampionsRef = useRef<Set<string>>(new Set());
  const roundIdRef = useRef(0);
  const gapTimerRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

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
    };
  }, []);

  const addMember = () => {
    const v = memberInput.trim();
    if (!v) return;
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
    const totalChamps = pairings.length * 2;

    // No duplicate champions across rounds. If pool exhausted, reset.
    let used = usedChampionsRef.current;
    const available = champions.length - used.size;
    if (available < totalChamps) {
      used = new Set();
      usedChampionsRef.current = used;
    }
    const champPicks = pickRandomChampions(champions, totalChamps, used);
    champPicks.forEach((c) => used.add(c.id));

    const lanes: RoundLane[] = pairings.map((p, i) => ({
      role: p.role,
      alphaName: p.alpha,
      betaName: p.beta,
      alphaChamp: p.alpha ? champPicks[i * 2] : null,
      betaChamp: p.beta ? champPicks[i * 2 + 1] : null,
    }));
    roundIdRef.current += 1;
    const newRound: Round = {
      id: roundIdRef.current,
      lanes,
      revealed: 0,
    };
    setRounds((prev) => [...prev, newRound]);
    setShuffling(true);
    setActiveRoundId(newRound.id);
    setActiveLaneIdx(0);
    // Smooth-scroll to the shuffle arena
    requestAnimationFrame(() => {
      arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleLaneComplete = () => {
    const roundId = activeRoundId;
    const laneIdx = activeLaneIdx;
    if (roundId == null || laneIdx < 0) return;

    // Close modal, mark lane as revealed in the round table
    setActiveLaneIdx(-1);
    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId ? { ...r, revealed: laneIdx + 1 } : r
      )
    );

    // Find the round to know its lane count
    const round = rounds.find((r) => r.id === roundId);
    const totalLaneCount = round?.lanes.length ?? 0;
    const nextIdx = laneIdx + 1;

    if (nextIdx >= totalLaneCount) {
      // Round complete
      setShuffling(false);
      setActiveRoundId(null);
      return;
    }

    // 3s pause then open modal for next lane
    gapTimerRef.current = window.setTimeout(() => {
      setActiveLaneIdx(nextIdx);
    }, INTER_LANE_GAP_MS);
  };

  const handleReset = () => {
    setRounds([]);
    usedChampionsRef.current = new Set();
  };

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const activeLane =
    activeRound && activeLaneIdx >= 0
      ? activeRound.lanes[activeLaneIdx]
      : null;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Header />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          {/* LEFT: setup column */}
          <section className="space-y-6">
            <div className="hextech-frame p-5">
              <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold-bright">
                Summoners
              </h2>
              <div className="gold-divider my-3" />

              <div className="flex gap-2">
                <input
                  className="input-hex w-full"
                  placeholder="Enter summoner name…"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMember();
                    }
                  }}
                />
                <button className="btn-hex" onClick={addMember} type="button">
                  Add
                </button>
              </div>

              <ul className="mt-4 flex flex-wrap gap-2">
                {members.length === 0 && (
                  <li className="text-sm italic text-muted-foreground">
                    No summoners yet. Add at least 2 to begin.
                  </li>
                )}
                {members.map((m, i) => (
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
                  Players per team (max 5)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTeamSize(n)}
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

              {/* Random duration */}
              <div>
                <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Random duration per lane (seconds)
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={MIN_LANE_SECONDS}
                    max={MAX_LANE_SECONDS}
                    step={0.5}
                    className="input-hex w-24"
                    value={laneSeconds}
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
                  >
                    Reset
                  </button>
                  <span className="text-xs italic text-muted-foreground">
                    Default {DEFAULT_LANE_SECONDS}s · range {MIN_LANE_SECONDS}–{MAX_LANE_SECONDS}s
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
                    disabled={!exclA || !exclB || exclA === exclB}
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
                    className="underline hover:text-gold-bright"
                    onClick={handleReset}
                    type="button"
                  >
                    clear history
                  </button>
                </p>
              )}
            </div>
          </section>

          {/* RIGHT: rounds */}
          <section className="space-y-8">
            {rounds.length === 0 && <EmptyDraft />}
            {rounds.map((r, idx) => (
              <RoundView key={r.id} roundNumber={idx + 1} round={r} />
            ))}
          </section>
        </div>

        {/* Shuffle Arena (inline, between setup grid and results history) */}
        <section
          ref={arenaRef}
          className="mt-10 hextech-frame border-gold/60 bg-background/80 p-4 sm:p-6 scroll-mt-8"
        >
          <h2 className="font-display text-center text-sm uppercase tracking-[0.4em] text-gold">
            {activeRound && activeLane
              ? `Round ${rounds.findIndex((r) => r.id === activeRound.id) + 1} · Lane ${activeLaneIdx + 1} / ${activeRound.lanes.length}`
              : "Shuffle Arena"}
          </h2>
          <p className="text-center font-serif italic text-xs text-muted-foreground">
            {activeLane ? "The Hextech engine spins…" : "Press Shuffle to begin the ceremony."}
          </p>
          <div className="gold-divider my-3" />
          {activeLane && activeRound ? (
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
          ) : (
            <div className="flex h-40 items-center justify-center text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Idle
            </div>
          )}
        </section>

        <Footer />
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
