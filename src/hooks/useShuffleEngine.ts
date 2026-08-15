import { useCallback, useEffect, useRef, useState } from "react";

import { getAllChampions, pickRandomChampions, type Champion, type Role } from "@/lib/lol-api";
import { buildLanePairings, type ExclusionPair } from "@/lib/randomize";
import { balanceByPower, interleaveTeams, type PowerEntry } from "@/lib/powerBalance";
import { analytics } from "@/lib/analytics";
import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";

// ── Types ────────────────────────────────────────────────────────────────────

export type ShuffleLane = {
  role: Role;
  alphaName: string | null;
  betaName: string | null;
  alphaChamp: Champion | null;
  betaChamp: Champion | null;
};

export type ShuffleRound = {
  id: number;
  lanes: ShuffleLane[];
  /** How many lanes have been revealed so far (animation counter) */
  revealed: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const INTER_LANE_GAP_MS = 1000;
const DEFAULT_LANE_SECONDS = 2;

// ── Hook ──────────────────────────────────────────────────────────────────────

type UseShuffleEngineOptions = {
  members: string[];
  randomMembers: boolean;
  exclusions: ExclusionPair[];
  defaultRoles: DefaultRoleConfig;
  skipAnimation: boolean;
  laneSeconds?: number;
  /** When provided and evaluatePower=true, teams are balanced by power score */
  powerEntries?: PowerEntry[];
  evaluatePower?: boolean;
  /** "v1" | "v2" — used for analytics */
  version?: "v1" | "v2";
};

export const useShuffleEngine = ({
  members,
  randomMembers,
  exclusions,
  defaultRoles,
  skipAnimation,
  laneSeconds = DEFAULT_LANE_SECONDS,
  powerEntries,
  evaluatePower = false,
  version = "v1",
}: UseShuffleEngineOptions) => {
  // ── Champions ──────────────────────────────────────────────────────────────
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);
  const [champsError, setChampsError] = useState<string | null>(null);

  // ── Shuffle state ──────────────────────────────────────────────────────────
  const [rounds, setRounds] = useState<ShuffleRound[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null);
  const [activeLaneIdx, setActiveLaneIdx] = useState<number>(-1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const usedChampionsRef = useRef<Set<string>>(new Set());
  const roundIdRef = useRef(0);
  const gapTimerRef = useRef<number | null>(null);

  // ── Load champions once ────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    getAllChampions()
      .then((champList) => {
        if (!alive) return;
        setChampions(champList);
        setLoadingChamps(false);
      })
      .catch((error) => {
        if (!alive) return;
        setChampsError(String(error));
        setLoadingChamps(false);
      });
    return () => {
      alive = false;
      if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
    };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const teamSize = Math.min(5, Math.ceil(members.length / 2));
  const canShuffle = members.length >= 2 && champions.length > 0 && !shuffling;

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const activeLane = activeRound && activeLaneIdx >= 0 ? activeRound.lanes[activeLaneIdx] : null;
  const showArena = shuffling || activeLane != null;

  // ── finishRound ────────────────────────────────────────────────────────────
  const finishRound = useCallback(() => {
    setShuffling(false);
    setActiveRoundId(null);
  }, []);

  // ── handleLaneComplete ─────────────────────────────────────────────────────
  const handleLaneComplete = useCallback(() => {
    const roundId = activeRoundId;
    const laneIdx = activeLaneIdx;
    if (roundId == null || laneIdx < 0) return;

    setActiveLaneIdx(-1);
    setRounds((prev) => prev.map((r) => (r.id === roundId ? { ...r, revealed: laneIdx + 1 } : r)));

    const round = rounds.find((r) => r.id === roundId);
    const totalLaneCount = round?.lanes.length ?? 0;
    const nextIdx = laneIdx + 1;

    if (nextIdx >= totalLaneCount) {
      finishRound();
      return;
    }

    gapTimerRef.current = window.setTimeout(() => {
      setActiveLaneIdx(nextIdx);
    }, INTER_LANE_GAP_MS);
  }, [activeRoundId, activeLaneIdx, rounds, finishRound]);

  // ── handleStopShuffle ──────────────────────────────────────────────────────
  const handleStopShuffle = useCallback(() => {
    if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
    setRounds((prev) => prev.filter((r) => r.id !== activeRoundId));
    setShuffling(false);
    setActiveRoundId(null);
    setActiveLaneIdx(-1);
    analytics.shuffleStop({ version });
  }, [activeRoundId, version]);

  // ── handleShuffle ──────────────────────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (!canShuffle) return;

    let orderedMembers: string[];

    if (evaluatePower && powerEntries && powerEntries.length >= 2) {
      // Power-balanced assignment: sort by power then interleave alpha/beta
      const { alpha, beta } = balanceByPower(powerEntries);
      orderedMembers = interleaveTeams(alpha, beta);
    } else if (randomMembers) {
      // Full random — pass as-is, buildLanePairings will shuffle
      orderedMembers = members;
    } else {
      // Preserve manual list order (top-to-bottom in summoner list)
      orderedMembers = members;
    }

    const pairings = buildLanePairings(
      orderedMembers,
      teamSize,
      false, // randomRole always false in v2
      // when power-balanced, disable internal random shuffle so our order is respected
      evaluatePower ? false : randomMembers,
      exclusions,
      defaultRoles,
    );

    // Champion picks — all picks within one round must be unique (no two summoners
    // in the same round share a champion, regardless of team).
    // Cross-round dedup: champions used in previous rounds are excluded until pool runs out.
    const totalChamps = pairings.reduce(
      (count, p) => count + (p.alpha ? 1 : 0) + (p.beta ? 1 : 0),
      0,
    );
    // Snapshot the current used set so concurrent calls don't share a stale reference
    let usedSnapshot = new Set(usedChampionsRef.current);
    if (champions.length - usedSnapshot.size < totalChamps) {
      // Pool exhausted — reset and start fresh
      usedSnapshot = new Set();
    }
    // pickRandomChampions uses Fisher-Yates so all picks are unique within one call
    const champPicks = pickRandomChampions(champions, totalChamps, usedSnapshot);
    // Commit picks back to the ref immediately, before any state update
    champPicks.forEach((champ) => usedSnapshot.add(champ.id));
    usedChampionsRef.current = usedSnapshot;

    let cursor = 0;
    const lanes: ShuffleLane[] = pairings.map((pairing) => ({
      role: pairing.role,
      alphaName: pairing.alpha,
      betaName: pairing.beta,
      alphaChamp: pairing.alpha ? champPicks[cursor++] : null,
      betaChamp: pairing.beta ? champPicks[cursor++] : null,
    }));

    roundIdRef.current += 1;
    const newRound: ShuffleRound = {
      id: roundIdRef.current,
      lanes,
      revealed: skipAnimation ? lanes.length : 0,
    };

    setRounds((prev) => [...prev, newRound]);

    analytics.shuffleTeam({
      version,
      member_count: members.length,
      skip_animation: skipAnimation,
    });

    if (!skipAnimation) {
      setShuffling(true);
      setActiveRoundId(newRound.id);
      setActiveLaneIdx(0);
    }
  }, [
    canShuffle,
    members,
    randomMembers,
    evaluatePower,
    powerEntries,
    teamSize,
    exclusions,
    defaultRoles,
    champions,
    skipAnimation,
  ]);

  // ── clearRounds ────────────────────────────────────────────────────────────
  const clearRounds = useCallback(() => {
    setRounds([]);
    setActiveRoundId(null);
    usedChampionsRef.current = new Set();
    roundIdRef.current = 0;
    analytics.shuffleClear({ version });
  }, [version]);

  // ── deleteRound ────────────────────────────────────────────────────────────
  const deleteRound = useCallback((roundId: number) => {
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
  }, []);

  // ── Derived power balance info ─────────────────────────────────────────────
  const balancedTeams =
    evaluatePower && powerEntries && powerEntries.length >= 2 ? balanceByPower(powerEntries) : null;

  return {
    // champion state
    champions,
    loadingChamps,
    champsError,
    // rounds
    rounds,
    shuffling,
    activeRound,
    activeRoundId,
    activeLane,
    activeLaneIdx,
    showArena,
    canShuffle,
    laneSeconds,
    // power balance preview
    balancedTeams,
    // actions
    handleShuffle,
    handleLaneComplete,
    handleStopShuffle,
    clearRounds,
    deleteRound,
  };
};
