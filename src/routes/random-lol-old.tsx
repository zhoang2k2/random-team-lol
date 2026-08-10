import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllChampions,
  pickRandomChampions,
  ROLE_META,
  ROLES_ORDER,
  type Champion,
  type Role,
} from "@/lib/lol-api";
import { buildLanePairings, type ExclusionPair } from "@/lib/randomize";
import { LaneRow } from "@/components/LaneRow";
import { InternalNav } from "@/components/InternalNav";
import { SiteHeader } from "@/components/SiteHeader";
import { analytics } from "@/lib/analytics";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const HOME_TITLE = "Random Team LOL – Shuffle Players for League of Legends";
const HOME_DESC =
  "Generate random teams for League of Legends custom games. Add players, shuffle teams, and start playing in seconds.";
const HOME_URL = "https://random-team-lol.lovable.app/";
const HOME_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f46e38b-7f65-4499-90d0-f533ae0b30bd/id-preview-59dea75c--798fb065-8b64-41bc-a26e-91489f067067.lovable.app-1778658824543.png";
const HOME_KEYWORDS =
  "Random LOL, League of Legends, random teams, custom games, shuffle players, chia team LMHT, random tướng";

export const Route = createFileRoute("/random-lol-old")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { name: "keywords", content: HOME_KEYWORDS },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
      { property: "og:image", content: HOME_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
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
            "Random teams for League of Legends custom games",
            "Shuffle Alpha/Beta teams with balanced assignments",
            "Random lane assignment (Top, Jungle, Mid, ADC, Support)",
            "Random champion picks from 160+ champion pool",
            "ARAM mode support",
            "Exclusion pairs — keep players on opposite teams",
            "Local history saved automatically",
          ],
        }),
      },
    ],
  }),
});

type TeamSide = "alpha" | "beta";

type SummonerEntry = {
  id: string;
  name: string;
  team: TeamSide;
};

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
const MIN_LANE_SECONDS = 2;
const MAX_LANE_SECONDS = 30;
const DEFAULT_LANE_SECONDS = MIN_LANE_SECONDS;
const MAX_SUMMONERS = 10;
const STORAGE_KEY = "summoners-draft-state-v1";

type PersistedState = {
  summoners: SummonerEntry[];
  members?: string[]; // legacy format — used for migration only
  teamSize: number;
  randomRole: boolean;
  randomMembers: boolean;
  exclusions: ExclusionPair[];
  laneSeconds: number;
  skipAnimation?: boolean;
  rounds: Round[];
  usedChampionIds: string[];
  roundIdSeed: number;
  defaultRoles?: Record<Role, { p1: string; p2: string }>;
};

function distributeEqually(names: string[]): SummonerEntry[] {
  return names.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    team: index % 2 === 0 ? ("alpha" as TeamSide) : ("beta" as TeamSide),
  }));
}

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

async function captureElements(elements: HTMLElement[]): Promise<string> {
  const { default: html2canvas } = await import("html2canvas-pro");

  if (elements.length === 0) throw new Error("No elements to capture");

  if (elements.length === 1) {
    const canvas = await html2canvas(elements[0], {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });
    return canvas.toDataURL("image/png");
  }

  // Multiple elements: render each to canvas, then stitch vertically
  const canvases = await Promise.all(
    elements.map((el) =>
      html2canvas(el, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      }),
    ),
  );

  const GAP = 16; // px gap between rounds (scaled)
  const totalWidth = Math.max(...canvases.map((c) => c.width));
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + GAP * (canvases.length - 1);

  const combined = document.createElement("canvas");
  combined.width = totalWidth;
  combined.height = totalHeight;
  const ctx = combined.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Fill background with the app background color
  ctx.fillStyle = "#1a2335"; // approximate --background value
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, 0, y);
    y += c.height + GAP;
  }

  return combined.toDataURL("image/png");
}

function HomePage() {
  const [summoners, setSummoners] = useState<SummonerEntry[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    danger?: boolean;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Derived members array for backward compatibility with all existing logic
  const members = useMemo(() => summoners.map((s) => s.name), [summoners]);
  const [teamSize, setTeamSize] = useState(5);
  const [randomRole, setRandomRole] = useState(false);
  const [randomMembers, setRandomMembers] = useState(false);
  const [exclusions, setExclusions] = useState<ExclusionPair[]>([]);
  const [exclA, setExclA] = useState("");
  const [exclB, setExclB] = useState("");
  const [laneSeconds, setLaneSeconds] = useState<number>(DEFAULT_LANE_SECONDS);
  const [skipAnimation, setSkipAnimation] = useState<boolean>(false);
  const [showSummoners, setShowSummoners] = useState<boolean>(true);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const [resetResultsConfirmOpen, setResetResultsConfirmOpen] = useState(false);

  // Screenshot mode
  type ScreenshotMode = "all" | "select";
  const [screenshotMode, setScreenshotMode] = useState<ScreenshotMode | null>(null);
  const [selectedRoundIds, setSelectedRoundIds] = useState<Set<number>>(new Set());
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotChooserOpen, setScreenshotChooserOpen] = useState(false);
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
  const [hydrating, setHydrating] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const usedChampionsRef = useRef<Set<string>>(new Set());
  const roundIdRef = useRef(0);
  const gapTimerRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Load persisted state after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      // New format: summoners array
      if (persisted.summoners && persisted.summoners.length > 0) {
        setSummoners(persisted.summoners);
      } else if (persisted.members && persisted.members.length > 0) {
        // Legacy migration: convert old members[] to SummonerEntry[]
        setSummoners(distributeEqually(persisted.members));
      }
      if (typeof persisted.teamSize === "number") setTeamSize(persisted.teamSize);
      if (typeof persisted.randomRole === "boolean") setRandomRole(persisted.randomRole);
      if (typeof persisted.randomMembers === "boolean") setRandomMembers(persisted.randomMembers);
      if (persisted.exclusions) setExclusions(persisted.exclusions);
      if (typeof persisted.laneSeconds === "number") setLaneSeconds(persisted.laneSeconds);
      if (typeof persisted.skipAnimation === "boolean") setSkipAnimation(persisted.skipAnimation);
      if (persisted.defaultRoles) setDefaultRoles(persisted.defaultRoles);
      if (persisted.rounds) setRounds(persisted.rounds.map((r) => ({ ...r })));
      if (persisted.rounds && persisted.rounds.length > 0) {
        setShowSummoners(false);
      }
      if (persisted.usedChampionIds) usedChampionsRef.current = new Set(persisted.usedChampionIds);
      if (typeof persisted.roundIdSeed === "number") roundIdRef.current = persisted.roundIdSeed;
      const hadData =
        (persisted.summoners?.length ?? persisted.members?.length ?? 0) > 0 ||
        (persisted.rounds?.length ?? 0) > 0;
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
      summoners,
      teamSize,
      randomRole,
      randomMembers,
      exclusions,
      laneSeconds,
      skipAnimation,
      rounds,
      usedChampionIds: Array.from(usedChampionsRef.current),
      roundIdSeed: roundIdRef.current,
      defaultRoles,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [
    hydrated,
    summoners,
    teamSize,
    randomRole,
    randomMembers,
    exclusions,
    laneSeconds,
    skipAnimation,
    rounds,
    defaultRoles,
  ]);

  const addMember = () => {
    const v = memberInput.trim();
    if (!v) return;
    if (summoners.length >= MAX_SUMMONERS) {
      setMemberInput("");
      return;
    }
    if (summoners.some((s) => s.name === v)) {
      setMemberInput("");
      return;
    }
    const alphaCount = summoners.filter((s) => s.team === "alpha").length;
    const betaCount = summoners.filter((s) => s.team === "beta").length;
    const team: TeamSide = alphaCount <= betaCount ? "alpha" : "beta";
    setSummoners((prev) => [...prev, { id: crypto.randomUUID(), name: v, team }]);
    setMemberInput("");
  };

  const removeMember = (id: string) => {
    const entry = summoners.find((s) => s.id === id);
    if (!entry) return;
    const name = entry.name;
    setSummoners((prev) => prev.filter((s) => s.id !== id));
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const parts = over.id.toString().split("-");
    if (parts.length < 3 || parts[0] !== "slot") return;
    const targetTeam = parts[1] as TeamSide;
    const targetIndex = parseInt(parts[2]);
    if (Number.isNaN(targetIndex)) return;
    const draggedId = active.id.toString();

    setSummoners((prev) => {
      const dragged = prev.find((s) => s.id === draggedId);
      if (!dragged) return prev;
      const targetColumnSummoners = prev.filter((s) => s.team === targetTeam);
      const occupant = targetColumnSummoners[targetIndex];

      if (!occupant) {
        // Empty slot: just move
        return prev.map((s) => (s.id === draggedId ? { ...s, team: targetTeam } : s));
      } else if (occupant.id !== draggedId) {
        // Swap teams
        return prev.map((s) => {
          if (s.id === draggedId) return { ...s, team: targetTeam };
          if (s.id === occupant.id) return { ...s, team: dragged.team };
          return s;
        });
      }
      return prev;
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

  const alphaCount = useMemo(() => summoners.filter((s) => s.team === "alpha").length, [summoners]);
  const betaCount = useMemo(() => summoners.filter((s) => s.team === "beta").length, [summoners]);
  const isTeamEmpty = !randomMembers && (alphaCount === 0 || betaCount === 0);

  const canShuffle = members.length >= 2 && champions.length > 0 && !shuffling && !isTeamEmpty;
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

    let orderedMembers: string[];

    if (randomMembers) {
      // Existing behavior: pass full members array, let buildLanePairings shuffle
      orderedMembers = members;
    } else {
      // New behavior: interleave alpha and beta by their column order
      // Alpha slot 0 → Beta slot 0 → Alpha slot 1 → Beta slot 1 → ...
      // This ensures lane assignment follows Top→Jungle→Mid→ADC→Support
      // with alpha[0]=Top Alpha, beta[0]=Top Beta, alpha[1]=Jungle Alpha, etc.
      const alphaMembers = summoners.filter((s) => s.team === "alpha").map((s) => s.name);
      const betaMembers = summoners.filter((s) => s.team === "beta").map((s) => s.name);

      orderedMembers = [];
      const maxLen = Math.max(alphaMembers.length, betaMembers.length);
      for (let i = 0; i < maxLen; i++) {
        if (alphaMembers[i]) orderedMembers.push(alphaMembers[i]);
        if (betaMembers[i]) orderedMembers.push(betaMembers[i]);
      }
    }

    const pairings = buildLanePairings(
      orderedMembers,
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
      revealed: skipAnimation ? lanes.length : 0,
    };
    setRounds((prev) => [...prev, newRound]);
    setShowSummoners(false);

    analytics.shuffleTeam({
      version: "v1",
      member_count: members.length,
      skip_animation: skipAnimation,
    });

    if (!skipAnimation) {
      setShuffling(true);
      setActiveRoundId(newRound.id);
      setActiveLaneIdx(0);
      requestAnimationFrame(() => {
        arenaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      setShuffling(false);
      setActiveRoundId(null);
      setActiveLaneIdx(-1);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const startEventRoll = (roundId: number) => {
    finishRound(roundId);
  };

  const handleStopShuffle = () => {
    if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
    setRounds((prev) => prev.filter((r) => r.id !== activeRoundId));
    setShuffling(false);
    setActiveRoundId(null);
    setActiveLaneIdx(-1);
  };

  const finishRound = (_roundId: number) => {
    setShuffling(false);
    setActiveRoundId(null);
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

  const handleResetAll = () => {
    setRounds([]);
    setActiveRoundId(null);
    setSummoners([]);
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
    usedChampionsRef.current = new Set();
    roundIdRef.current = 0;
  };

  const handleDeleteRound = (roundId: number) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
  };

  const handleCaptureAll = async () => {
    if (!resultsRef.current) return;

    // Only query round wrapper divs, not the header/action bars
    const elements = Array.from(
      resultsRef.current.querySelectorAll<HTMLElement>("[data-round-id]"),
    );
    if (elements.length === 0) return;

    try {
      const dataUrl = await captureElements(elements);
      setScreenshotPreview(dataUrl);
    } catch (err) {
      console.error("Screenshot failed:", err);
      alert("Lỗi chụp ảnh: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCaptureSelected = async () => {
    if (!resultsRef.current) return;

    // Capture in the order they appear in the DOM, not selection order
    const elements = Array.from(
      resultsRef.current.querySelectorAll<HTMLElement>("[data-round-id]"),
    ).filter((el) => {
      const id = Number(el.getAttribute("data-round-id"));
      return selectedRoundIds.has(id);
    });

    if (elements.length === 0) return;

    try {
      const dataUrl = await captureElements(elements);
      setScreenshotMode(null);
      setSelectedRoundIds(new Set());
      setScreenshotPreview(dataUrl);
    } catch (err) {
      console.error("Screenshot failed:", err);
      alert("Lỗi chụp ảnh: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSaveScreenshot = () => {
    if (!screenshotPreview) return;
    const link = document.createElement("a");
    link.href = screenshotPreview;
    const timestamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
    link.download = `xom-ngheo-${timestamp}.png`;
    link.click();
    setScreenshotPreview(null);
  };

  const handleDiscardScreenshot = () => {
    setScreenshotPreview(null);
  };

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const activeLane = activeRound && activeLaneIdx >= 0 ? activeRound.lanes[activeLaneIdx] : null;
  const showArena = shuffling || activeLane != null;
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12 flex flex-col">
      <div className="mx-auto max-w-7xl w-full flex-grow flex flex-col">
        <div className="flex-grow">
          <SiteHeader
            currentPath="/random-lol-old"
            pageHeading={
              <>
                <p className="font-display text-xs uppercase tracking-[0.5em] text-gold">CMDN</p>
                <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.2em] text-gold-bright text-glow-gold md:text-5xl">
                  Xóm Nghẹo
                </h1>
                <div className="gold-divider mx-auto mt-3 max-w-md" />
                <p className="mt-3 font-serif text-sm italic text-muted-foreground">
                  Vĩ nhân nào không có 1 quá khứ, Kẻ nghiện nào chẳng còn 1 tương lai
                </p>
              </>
            }
          />

          {/* Shuffle Arena — TOP of page, only visible while shuffling */}
          {showArena && (
            <section
              ref={arenaRef}
              className="mt-8 hextech-frame border-gold/60 bg-background/80 p-4 sm:p-6 scroll-mt-8 animate-fade-in relative"
            >
              <button
                onClick={() => setStopConfirmOpen(true)}
                className="absolute top-2 right-4 btn-hex text-xs border-destructive/50 text-destructive hover:bg-destructive/10 cursor-pointer"
                disabled={!shuffling}
              >
                ✕ Stop
              </button>
              <h2 className="font-display text-center text-sm uppercase tracking-[0.4em] text-gold">
                {activeRound && activeLane
                  ? `Round ${rounds.findIndex((r) => r.id === activeRound.id) + 1} · Lane ${activeLaneIdx + 1} / ${activeRound.lanes.length}`
                  : "Shuffle Arena"}
              </h2>
              <div className="gold-divider my-3" />
              <div className="flex min-h-[360px] items-center justify-center">
                {activeLane && activeRound ? (
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

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
            {/* LEFT: setup column */}
            <section className="space-y-6">
              <div className="hextech-frame p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold-bright">
                    Summoners{" "}
                    <span className="text-xs text-muted-foreground">
                      ({summoners.length}/{MAX_SUMMONERS})
                    </span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={summoners.length === 0}
                      onClick={() => setShowSummoners(!showSummoners)}
                      className="text-[11px] font-display uppercase tracking-wider text-muted-foreground hover:text-gold-bright disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors px-2 py-1 border border-gold/15 bg-background/25 hover:border-gold/50"
                    >
                      {showSummoners ? "HIDE" : "SHOW"}
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      disabled={summoners.length === 0 || inputsLocked}
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: "Clear All Summoners",
                          description:
                            "This will remove all summoners from both teams. Are you sure?",
                          danger: true,
                          onConfirm: () => {
                            setSummoners([]);
                            setExclusions([]);
                            setDefaultRoles({
                              TOP: { p1: "", p2: "" },
                              JUNGLE: { p1: "", p2: "" },
                              MID: { p1: "", p2: "" },
                              ADC: { p1: "", p2: "" },
                              SUPPORT: { p1: "", p2: "" },
                            });
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                          },
                        })
                      }
                      title="Clear all summoners"
                      aria-label="Clear all summoners"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>

                {showSummoners && summoners.length > 0 && (
                  <>
                    <div className="gold-divider my-3" />
                    <div className="flex gap-2">
                      <input
                        className="input-hex w-full"
                        placeholder={
                          summoners.length >= MAX_SUMMONERS
                            ? `Max ${MAX_SUMMONERS} summoners`
                            : "Enter summoner name…"
                        }
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        disabled={inputsLocked || summoners.length >= MAX_SUMMONERS}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addMember();
                          }
                        }}
                      />
                      <button
                        className="btn-hex cursor-pointer"
                        onClick={addMember}
                        type="button"
                        disabled={inputsLocked || summoners.length >= MAX_SUMMONERS}
                      >
                        Add
                      </button>
                    </div>

                    {hydrating && summoners.length > 0 ? (
                      <div className="mt-4">
                        <SummonerSkeleton count={Math.min(summoners.length, 5)} />
                      </div>
                    ) : (
                      <DndContext onDragEnd={inputsLocked ? () => {} : handleDragEnd}>
                        <div className="mt-4">
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="text-center">
                              <TeamHeading side="alpha" />
                            </div>
                            <div className="text-center">
                              <TeamHeading side="beta" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {(() => {
                              const alphaSummoners = summoners.filter((s) => s.team === "alpha");
                              const betaSummoners = summoners.filter((s) => s.team === "beta");
                              const rows: React.ReactNode[] = [];
                              for (let i = 0; i < 5; i++) {
                                const alphaEntry = alphaSummoners[i];
                                const betaEntry = betaSummoners[i];
                                rows.push(
                                  <DroppableSlot key={`slot-alpha-${i}`} slotId={`slot-alpha-${i}`}>
                                    {alphaEntry ? (
                                      <DraggableSummonerItem
                                        entry={alphaEntry}
                                        index={i}
                                        onRemove={() => removeMember(alphaEntry.id)}
                                        disabled={inputsLocked}
                                      />
                                    ) : (
                                      <EmptySlot />
                                    )}
                                  </DroppableSlot>,
                                  <DroppableSlot key={`slot-beta-${i}`} slotId={`slot-beta-${i}`}>
                                    {betaEntry ? (
                                      <DraggableSummonerItem
                                        entry={betaEntry}
                                        index={i}
                                        onRemove={() => removeMember(betaEntry.id)}
                                        disabled={inputsLocked}
                                      />
                                    ) : (
                                      <EmptySlot />
                                    )}
                                  </DroppableSlot>,
                                );
                              }
                              return rows;
                            })()}
                          </div>
                        </div>
                      </DndContext>
                    )}
                  </>
                )}

                {summoners.length === 0 && (
                  <>
                    <div className="gold-divider my-3" />
                    <div className="flex gap-2">
                      <input
                        className="input-hex w-full"
                        placeholder="Enter summoner name…"
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        disabled={inputsLocked}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addMember();
                          }
                        }}
                      />
                      <button
                        className="btn-hex cursor-pointer"
                        onClick={addMember}
                        type="button"
                        disabled={inputsLocked}
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-4 text-sm italic text-muted-foreground">
                      No summoners yet. Add at least 2 to begin.
                    </p>
                  </>
                )}
              </div>
              <div className="hextech-frame p-5 space-y-4">
                <h2 className="font-display text-lg uppercase tracking-[0.3em] text-gold-bright">
                  Match Settings
                </h2>
                <div className="gold-divider" />

                {/* 2. Shuffle team toggle */}
                <div>
                  <ToggleRow
                    label="Shuffle team"
                    hint="Bạn sợ à?"
                    value={randomMembers}
                    onChange={setRandomMembers}
                    disabled={inputsLocked}
                  />
                </div>

                {/* 3. Default role */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Default role
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: "Xác nhận xóa vị trí mặc định",
                          description:
                            "Bạn có chắc chắn muốn xóa tất cả các vị trí mặc định đã chọn?",
                          danger: true,
                          onConfirm: () => {
                            setDefaultRoles({
                              TOP: { p1: "", p2: "" },
                              JUNGLE: { p1: "", p2: "" },
                              MID: { p1: "", p2: "" },
                              ADC: { p1: "", p2: "" },
                              SUPPORT: { p1: "", p2: "" },
                            });
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                          },
                        })
                      }
                      className="text-[10px] text-muted-foreground hover:text-gold-bright transition-colors uppercase tracking-wider font-display cursor-pointer"
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

                      const activeRoleKeys = (
                        ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as Role[]
                      ).filter(
                        (r) =>
                          (defaultRoles[r].p1 && activeMembers.includes(defaultRoles[r].p1)) ||
                          (defaultRoles[r].p2 && activeMembers.includes(defaultRoles[r].p2)),
                      );

                      const maxLanesReached = activeRoleKeys.length >= lanesNeeded;

                      return (["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as Role[]).map((role) => {
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
                                currentActiveRoles.length >= lanesNeeded
                                  ? currentActiveRoles
                                  : (["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as Role[]);

                              const emptySlots: { r: Role; s: "p1" | "p2" }[] = [];
                              for (const r of allowedRoles) {
                                if (!next[r].p1 || !activeMembers.includes(next[r].p1))
                                  emptySlots.push({ r, s: "p1" });
                                if (!next[r].p2 || !activeMembers.includes(next[r].p2))
                                  emptySlots.push({ r, s: "p2" });
                              }

                              if (unassigned.length === 1 && emptySlots.length === 1) {
                                const target = emptySlots[0];
                                next = {
                                  ...next,
                                  [target.r]: { ...next[target.r], [target.s]: unassigned[0] },
                                };
                                changed = true;
                              }
                            }
                            return next;
                          });
                        };

                        return (
                          <div
                            key={role}
                            className={`grid grid-cols-[50px_1fr_1fr] gap-2 items-center transition-opacity duration-300 ${isRoleDisabled ? "opacity-30" : ""}`}
                          >
                            <div
                              className="flex justify-center items-center min-w-0"
                              title={isRoleDisabled ? "Đã đạt đủ số lượng lane tối đa" : ""}
                            >
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

                {/* 6. Never on the same team */}
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
                      disabled={inputsLocked}
                    />
                    <SummonerSelect
                      value={exclB}
                      onChange={setExclB}
                      options={members.filter((m) => m !== exclA)}
                      placeholder="Summoner B"
                      disabled={inputsLocked}
                    />
                    <button
                      type="button"
                      className="btn-hex h-9 px-4 py-0 flex items-center justify-center cursor-pointer"
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
                            className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
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

                {/* 4. Skip animation toggle */}
                <div>
                  <label className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Additional Options
                  </label>
                  <div className="mt-2 space-y-4">
                    <ToggleRow
                      label="Skip animation"
                      hint="Show result immediately!"
                      value={skipAnimation}
                      onChange={setSkipAnimation}
                      disabled={inputsLocked}
                    />
                  </div>
                </div>

                {/* 5. Lane spin (seconds) */}
                {/* <div className={skipAnimation ? "opacity-40 pointer-events-none" : ""}>
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
                      disabled={inputsLocked || skipAnimation}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isNaN(v)) return;
                        setLaneSeconds(Math.min(MAX_LANE_SECONDS, Math.max(MIN_LANE_SECONDS, v)));
                      }}
                    />
                    <button
                      type="button"
                      className="btn-hex text-xs cursor-pointer"
                      onClick={() => setLaneSeconds(DEFAULT_LANE_SECONDS)}
                      disabled={inputsLocked || skipAnimation}
                    >
                      Reset
                    </button>
                    <span className="text-xs italic text-muted-foreground">
                      {MIN_LANE_SECONDS}–{MAX_LANE_SECONDS}s
                    </span>
                  </div>
                </div> */}
              </div>
            </section>

            {/* RIGHT: Action Bar & Rounds */}
            <section ref={resultsRef} className="space-y-6 scroll-mt-8 relative">
              <div className="hextech-frame p-5 space-y-4 bg-background/40">
                <button
                  type="button"
                  className="btn-hex btn-hex-primary w-full text-base py-3 font-display uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:shadow-[0_0_25px_rgba(255,215,0,0.35)] transition-all"
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-gold/15">
                    <p className="text-xs text-muted-foreground">
                      {champions.length} champions loaded · {totalLanes || 0} lane
                      {totalLanes === 1 ? "" : "s"}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {!hydrating && rounds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoundIds(new Set());
                            setScreenshotChooserOpen(true);
                          }}
                          disabled={
                            inputsLocked || rounds.length === 0 || screenshotMode === "select"
                          }
                          className="btn-hex text-[10px] px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                          title="Screenshot results"
                        >
                          {/* Camera icon */}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Screenshot
                        </button>
                      )}

                      <button
                        className="btn-hex btn-hex-danger text-[10px] px-3 py-1.5 flex-1 sm:flex-initial cursor-pointer"
                        onClick={() => setResetResultsConfirmOpen(true)}
                        type="button"
                        disabled={inputsLocked || rounds.length === 0}
                      >
                        Clear Result
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {hydrating && rounds.length > 0 && <ResultsSkeleton />}
              {!hydrating && rounds.length === 0 && <EmptyDraft />}
              {!hydrating &&
                rounds.map((r, idx) => {
                  const isSelected = selectedRoundIds.has(r.id);
                  const isSelectMode = screenshotMode === "select";

                  return (
                    <div
                      key={r.id}
                      data-round-id={r.id}
                      className={`relative transition-all ${isSelectMode ? "cursor-pointer" : ""}`}
                      onClick={
                        isSelectMode
                          ? () => {
                              setSelectedRoundIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(r.id)) next.delete(r.id);
                                else next.add(r.id);
                                return next;
                              });
                            }
                          : undefined
                      }
                    >
                      {/* Selection highlight border */}
                      {isSelectMode && (
                        <div
                          className={`absolute inset-0 z-10 pointer-events-none border-2 transition-colors ${
                            isSelected ? "border-gold" : "border-gold/20"
                          }`}
                        />
                      )}

                      {/* Checkmark badge */}
                      {isSelectMode && (
                        <div
                          className={`absolute top-2 left-2 z-20 w-5 h-5 flex items-center justify-center
                          border transition-colors ${
                            isSelected
                              ? "border-gold bg-gold text-background"
                              : "border-gold/40 bg-background/80 text-transparent"
                          }`}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}

                      <RoundView
                        roundNumber={idx + 1}
                        round={r}
                        onDelete={handleDeleteRound}
                        disabled={inputsLocked || isSelectMode}
                      />
                    </div>
                  );
                })}

              {screenshotMode === "select" && (
                <div
                  className="sticky bottom-4 z-30 flex items-center justify-between gap-3
                hextech-frame px-4 py-3 bg-background/95 border-gold/60 animate-fade-in"
                >
                  <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                    {selectedRoundIds.size === 0
                      ? "Click rounds to select"
                      : `${selectedRoundIds.size} round${selectedRoundIds.size > 1 ? "s" : ""} selected`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-hex text-xs px-3 py-1.5 cursor-pointer"
                      onClick={() => {
                        setScreenshotMode(null);
                        setSelectedRoundIds(new Set());
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-hex btn-hex-primary text-xs px-3 py-1.5 cursor-pointer"
                      disabled={selectedRoundIds.size === 0}
                      onClick={handleCaptureSelected}
                    >
                      Capture Selected
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <InternalNav currentPath="/" />
        <Footer />
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        danger={confirmDialog.danger}
      />
      <ConfirmDialog
        open={stopConfirmOpen}
        title="Stop Shuffle?"
        description="This will cancel the current round. The result will not be saved."
        confirmLabel="Stop & Discard"
        cancelLabel="Keep Going"
        danger={true}
        onConfirm={() => {
          setStopConfirmOpen(false);
          handleStopShuffle();
        }}
        onCancel={() => setStopConfirmOpen(false)}
      />
      <ConfirmDialog
        open={resetResultsConfirmOpen}
        title="Reset All Results?"
        description="All round history will be cleared. Champion usage history will also reset."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={() => {
          setResetResultsConfirmOpen(false);
          handleResetResults();
        }}
        onCancel={() => setResetResultsConfirmOpen(false)}
      />
      <ScreenshotChooserDialog
        open={screenshotChooserOpen}
        onSelectAll={() => {
          setScreenshotChooserOpen(false);
          setScreenshotMode("all");
          handleCaptureAll();
        }}
        onSelectPick={() => {
          setScreenshotChooserOpen(false);
          setScreenshotMode("select");
        }}
        onCancel={() => {
          setScreenshotChooserOpen(false);
        }}
      />
      <ScreenshotPreviewDialog
        dataUrl={screenshotPreview}
        onSave={handleSaveScreenshot}
        onDiscard={handleDiscardScreenshot}
      />
    </div>
  );
}

function ScreenshotChooserDialog({
  open,
  onSelectAll,
  onSelectPick,
  onCancel,
}: {
  open: boolean;
  onSelectAll: () => void;
  onSelectPick: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="hextech-frame p-6 max-w-sm w-full mx-4 space-y-4 animate-fade-in">
        <h3 className="font-display text-gold-bright uppercase tracking-widest text-sm">
          Screenshot Results
        </h3>
        <p className="font-serif text-sm text-muted-foreground">Choose what to capture:</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-hex btn-hex-primary w-full cursor-pointer"
            onClick={onSelectAll}
          >
            Select All Rounds
          </button>
          <button type="button" className="btn-hex w-full cursor-pointer" onClick={onSelectPick}>
            Select Rounds
          </button>
        </div>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground hover:text-gold-bright transition-colors font-display uppercase tracking-widest cursor-pointer"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ScreenshotPreviewDialog({
  dataUrl,
  onSave,
  onDiscard,
}: {
  dataUrl: string | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!dataUrl) return null;

  const handleCopy = async () => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("Không thể sao chép ảnh vào clipboard. Vui lòng tải ảnh về thiết bị.");
    }
  };

  const handleSaveAndCopy = async () => {
    // Attempt background copy to clipboard for convenience
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (e) {
      // ignore clipboard error during download
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="hextech-frame p-5 max-w-xl w-full mx-auto space-y-4 animate-fade-in">
        <h3 className="font-display text-gold-bright uppercase tracking-widest text-sm">
          Save Screenshot?
        </h3>

        {/* Preview image */}
        <div className="border border-gold/30 overflow-hidden max-h-[60vh] overflow-y-auto">
          <img src={dataUrl} alt="Screenshot preview" className="w-full h-auto" />
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            className="btn-hex text-xs px-4 py-1.5 border-destructive/50 text-destructive cursor-pointer"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            type="button"
            className={`btn-hex text-xs px-4 py-1.5 cursor-pointer transition-all ${
              copied ? "border-green-500 text-green-400" : ""
            }`}
            onClick={handleCopy}
          >
            {copied ? "Copied! ✓" : "Copy to Clipboard"}
          </button>
          <button
            type="button"
            className="btn-hex btn-hex-primary text-xs px-4 py-1.5 cursor-pointer"
            onClick={handleSaveAndCopy}
          >
            Save to Device
          </button>
        </div>
      </div>
    </div>
  );
}

function SummonerSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 w-full border border-gold/30 bg-gold/5 animate-pulse" />
      ))}
    </div>
  );
}

function EmptySlot() {
  return <div className="w-full h-14 border border-dashed border-gold/20 bg-transparent" />;
}

function DraggableSummonerItem({
  entry,
  index,
  onRemove,
  disabled,
}: {
  entry: SummonerEntry;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    disabled,
  });
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.7 : 1,
      }
    : undefined;

  const isAlpha = entry.team === "alpha";
  const borderClass = isAlpha ? "border-gold/50" : "border-[var(--team-beta)]/50";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-full h-12 flex items-center gap-2 px-3 border bg-card/60 ${borderClass} group relative cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? "shadow-[0_0_16px_var(--gold)]" : ""
      }`}
    >
      <span className="font-display text-sm text-gold-bright truncate pr-4 flex-1 select-none">
        {entry.name}
      </span>
      <button
        type="button"
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border border-gold/40 text-gold-bright hover:border-destructive/60 hover:text-destructive flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-md z-20 cursor-pointer"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove();
        }}
        aria-label={`Remove ${entry.name}`}
        disabled={disabled}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function DroppableSlot({ slotId, children }: { slotId: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: slotId });
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? "ring-1 ring-gold/60 bg-gold/5" : ""}`}
    >
      {children}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="hextech-frame p-6 max-w-[420px] w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-gold-bright uppercase tracking-widest">{title}</h3>
        <p className="font-serif text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-hex text-xs px-3 py-1.5 whitespace-nowrap cursor-pointer"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-hex text-xs px-3 py-1.5 whitespace-nowrap cursor-pointer ${
              danger
                ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                : "btn-hex-primary"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
    <footer className="mt-32 text-center text-xs text-muted-foreground">
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
    <div className="hextech-frame flex h-fill min-h-[400px] h-fit flex-col items-center justify-center p-10 text-center">
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
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
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

function RoundView({
  roundNumber,
  round,
  onDelete,
  disabled,
}: {
  roundNumber: number;
  round: Round;
  onDelete?: (roundId: number) => void;
  disabled?: boolean;
}) {
  const visibleLanes = round.lanes.slice(0, round.revealed);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div className="hextech-frame p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-[0.4em] text-gold">
          Round {roundNumber}
        </h3>
        {onDelete && (
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={disabled}
            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 cursor-pointer"
            aria-label={`Delete round ${roundNumber}`}
            title="Delete this round"
          >
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
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        )}
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
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Round?"
        description={`Round ${roundNumber} will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        danger={true}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDelete?.(round.id);
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
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
