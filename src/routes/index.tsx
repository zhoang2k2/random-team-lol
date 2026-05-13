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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

type Round = { id: number; lanes: RoundLane[] };

function HomePage() {
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [teamSize, setTeamSize] = useState(5);
  const [randomRole, setRandomRole] = useState(false);
  const [randomMembers, setRandomMembers] = useState(false);
  const [exclusions, setExclusions] = useState<ExclusionPair[]>([]);
  const [exclA, setExclA] = useState("");
  const [exclB, setExclB] = useState("");

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);
  const [champsError, setChampsError] = useState<string | null>(null);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const roundIdRef = useRef(0);

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
    const champPicks = pickRandomChampions(champions, totalChamps);
    const lanes: RoundLane[] = pairings.map((p, i) => ({
      role: p.role,
      alphaName: p.alpha,
      betaName: p.beta,
      alphaChamp: p.alpha ? champPicks[i * 2] : null,
      betaChamp: p.beta ? champPicks[i * 2 + 1] : null,
    }));
    roundIdRef.current += 1;
    setRounds((prev) => [...prev, { id: roundIdRef.current, lanes }]);
    setShuffling(true);
    // Each lane staggered by 1500ms; lane completes in ~3s.
    const totalMs = (lanes.length - 1) * 1500 + 3200;
    window.setTimeout(() => setShuffling(false), totalMs);
  };

  const handleReset = () => {
    setRounds([]);
  };

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
              <RoundView
                key={r.id}
                roundNumber={idx + 1}
                round={r}
                allMembers={members}
                champions={champions}
              />
            ))}
          </section>
        </div>

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
  allMembers,
  champions,
}: {
  roundNumber: number;
  round: Round;
  allMembers: string[];
  champions: Champion[];
}) {
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
      <div className="space-y-6">
        {round.lanes.map((lane, i) => (
          <LaneRow
            key={`${round.id}-${i}`}
            index={i}
            finalRole={lane.role}
            alphaName={lane.alphaName}
            betaName={lane.betaName}
            alphaChampion={lane.alphaChamp}
            betaChampion={lane.betaChamp}
            allMemberNames={allMembers}
            championPool={champions}
            startDelayMs={i * 1500}
          />
        ))}
      </div>
    </div>
  );
}
