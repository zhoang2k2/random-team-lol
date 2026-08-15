import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";
import type { ExclusionPair } from "@/lib/randomize";
import { ROLES_ORDER } from "@/lib/lol-api";
import type { V3Summoner, V3TeamLaneResult } from "@/features/v3/types/v3Types";

export type V3PowerBalancedOptions = {
  /** Soft tolerance window relative to minDiff (default: 2) */
  tolerance?: number;
  /** Signatures of recently generated team partitions (max 2-3) to avoid repeating */
  recentHistorySignatures?: string[];
};

export type V3PowerBalancedResult = {
  team1: V3Summoner[];
  team2: V3Summoner[];
  interleavedSummoners: V3Summoner[];
  team1Power: number;
  team2Power: number;
  powerDiff: number;
  top2Separated: boolean;
  lanePairings: V3TeamLaneResult[];
  signature: string;
};

/**
 * Creates a canonical partition signature for 2 teams.
 * Independent of Team 1 vs Team 2 designation (order-insensitive).
 */
export function getPartitionSignature(team1: V3Summoner[], team2: V3Summoner[]): string {
  const team1Sig = team1
    .map((summoner) => summoner.id)
    .sort()
    .join(",");
  const team2Sig = team2
    .map((summoner) => summoner.id)
    .sort()
    .join(",");
  return [team1Sig, team2Sig].sort().join("::");
}

/**
 * Generates all subset combinations of size k from array indices 0..n-1
 */
function generateCombinations(n: number, k: number): number[][] {
  const result: number[][] = [];

  function helper(start: number, current: number[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let index = start; index <= n - (k - current.length); index++) {
      current.push(index);
      helper(index + 1, current);
      current.pop();
    }
  }

  helper(0, []);
  return result;
}

/**
 * Performs weighted random selection over a pool of partition candidates.
 * Weight for each candidate = 1 / (powerDiff + 1).
 */
function selectWeightedRandomCandidate<T extends { powerDiff: number }>(candidates: T[]): T {
  if (candidates.length === 1) {
    return candidates[0];
  }

  const weights = candidates.map((candidate) => 1 / (candidate.powerDiff + 1));
  const totalWeight = weights.reduce((accumulated, weight) => accumulated + weight, 0);

  let randomPoint = Math.random() * totalWeight;

  for (let index = 0; index < candidates.length; index++) {
    const weight = weights[index];
    if (randomPoint < weight) {
      return candidates[index];
    }
    randomPoint -= weight;
  }

  return candidates[candidates.length - 1];
}

/**
 * Calculates power-balanced team assignments for V3 with dynamic & fair randomization.
 *
 * PIPELINE:
 * Step 1: Generate all combinations (C(10,5) = 252).
 * Step 2: Strict Constraints (Never Same Team & Default Roles).
 * Step 3: Filter Top 2 separation priority.
 * Step 4: Calculate minDiff.
 * Step 5: Soft Tolerance Window (powerDiff <= minDiff + TOLERANCE).
 * Step 6: History Anti-Repeat Filter (exclude recentHistorySignatures, fallback if empty).
 * Step 7: Weighted Random Selection based on weight = 1 / (powerDiff + 1).
 * Step 8: Return chosen assignment + canonical signature.
 */
export function calculateV3PowerBalancedTeams(
  activeSummoners: V3Summoner[],
  defaultRoles: DefaultRoleConfig,
  neverSameTeam: ExclusionPair | null,
  options: V3PowerBalancedOptions = {},
): V3PowerBalancedResult | null {
  if (activeSummoners.length < 2) {
    return null;
  }

  const { tolerance = 2, recentHistorySignatures = [] } = options;

  const trimmed = activeSummoners.slice(0, 10);
  const totalCount = trimmed.length;
  const team1Size = Math.ceil(totalCount / 2);

  // Identify top 2 highest power summoners among active list
  const sortedByPower = [...trimmed].sort((a, b) => b.powerScore - a.powerScore);
  const top1Id = sortedByPower[0]?.id;
  const top2Id = sortedByPower[1]?.id;

  // Step 1: Generate all team 1 combinations
  const team1Combinations = generateCombinations(totalCount, team1Size);

  type PartitionCandidate = {
    team1: V3Summoner[];
    team2: V3Summoner[];
    team1Power: number;
    team2Power: number;
    powerDiff: number;
    top2Separated: boolean;
    violatesExclusions: boolean;
    violatesDefaultRoles: boolean;
    signature: string;
  };

  const candidates: PartitionCandidate[] = [];

  for (const t1Indices of team1Combinations) {
    const t1IndexSet = new Set(t1Indices);
    const team1 = t1Indices.map((index) => trimmed[index]);
    const team2 = trimmed.filter((_, index) => !t1IndexSet.has(index));

    const team1NameSet = new Set(team1.map((s) => s.name));
    const team2NameSet = new Set(team2.map((s) => s.name));

    // Check Never Same Team constraint
    let violatesExclusions = false;
    if (neverSameTeam && neverSameTeam.a && neverSameTeam.b) {
      const { a, b } = neverSameTeam;
      if (
        (team1NameSet.has(a) && team1NameSet.has(b)) ||
        (team2NameSet.has(a) && team2NameSet.has(b))
      ) {
        violatesExclusions = true;
      }
    }

    // Check Default Role compatibility
    let violatesDefaultRoles = false;
    for (const role of ROLES_ORDER) {
      const roleConfig = defaultRoles[role];
      if (!roleConfig) continue;
      const { p1, p2 } = roleConfig;

      if (p1 && p2) {
        if (
          (team1NameSet.has(p1) && team1NameSet.has(p2)) ||
          (team2NameSet.has(p1) && team2NameSet.has(p2))
        ) {
          violatesDefaultRoles = true;
          break;
        }
      }
    }

    // Check top 2 separation
    const top1InT1 = team1.some((s) => s.id === top1Id);
    const top2InT1 = team1.some((s) => s.id === top2Id);
    const top2Separated = Boolean(
      top1Id && top2Id && ((top1InT1 && !top2InT1) || (!top1InT1 && top2InT1)),
    );

    const team1Power = team1.reduce(
      (accumulator, summoner) => accumulator + summoner.powerScore,
      0,
    );
    const team2Power = team2.reduce(
      (accumulator, summoner) => accumulator + summoner.powerScore,
      0,
    );
    const powerDiff = Math.abs(team1Power - team2Power);
    const signature = getPartitionSignature(team1, team2);

    candidates.push({
      team1,
      team2,
      team1Power,
      team2Power,
      powerDiff,
      top2Separated,
      violatesExclusions,
      violatesDefaultRoles,
      signature,
    });
  }

  // Step 2: Filter candidates through Strict Constraints
  let validCandidates = candidates.filter(
    (candidate) => !candidate.violatesExclusions && !candidate.violatesDefaultRoles,
  );

  // Fallback safeguards if strict constraints cannot be satisfied simultaneously
  if (validCandidates.length === 0) {
    validCandidates = candidates.filter((candidate) => !candidate.violatesExclusions);
  }
  if (validCandidates.length === 0) {
    validCandidates = candidates;
  }

  // Step 3: Prefer partitions where top 2 power summoners are separated
  const separatedCandidates = validCandidates.filter((candidate) => candidate.top2Separated);
  const poolToUse = separatedCandidates.length > 0 ? separatedCandidates : validCandidates;

  // Step 4: Calculate minDiff
  let minDiff = Infinity;
  for (const item of poolToUse) {
    if (item.powerDiff < minDiff) {
      minDiff = item.powerDiff;
    }
  }

  // Step 5: Soft Tolerance Window (powerDiff <= minDiff + TOLERANCE)
  const acceptableCandidates = poolToUse.filter(
    (candidate) => candidate.powerDiff <= minDiff + tolerance,
  );

  // Step 6: History Anti-Repeat Filter (exclude recentHistorySignatures)
  const historySet = new Set(recentHistorySignatures);
  let freshCandidates = acceptableCandidates.filter(
    (candidate) => !historySet.has(candidate.signature),
  );

  // Fallback to acceptable candidates if history filter eliminates all choices
  if (freshCandidates.length === 0) {
    freshCandidates = acceptableCandidates;
  }

  // Step 7: Weighted Random Selection (Weight = 1 / (powerDiff + 1))
  const chosen = selectWeightedRandomCandidate(freshCandidates);

  if (!chosen) {
    return null;
  }

  // Step 8: Build lane pairings matching ROLES_ORDER & Interleaved summoner order
  const lanePairings: V3TeamLaneResult[] = [];
  const assignedTeam1Names = new Set<string>();
  const assignedTeam2Names = new Set<string>();

  const orderedTeam1: (V3Summoner | null)[] = Array(5).fill(null);
  const orderedTeam2: (V3Summoner | null)[] = Array(5).fill(null);

  // First pass: Assign default roles
  ROLES_ORDER.forEach((role, roleIndex) => {
    const roleConfig = defaultRoles[role];
    if (!roleConfig) return;

    const { p1, p2 } = roleConfig;

    if (p1) {
      const s1InT1 = chosen.team1.find((s) => s.name === p1);
      const s1InT2 = chosen.team2.find((s) => s.name === p1);
      if (s1InT1 && !assignedTeam1Names.has(p1) && !orderedTeam1[roleIndex]) {
        orderedTeam1[roleIndex] = s1InT1;
        assignedTeam1Names.add(p1);
      } else if (s1InT2 && !assignedTeam2Names.has(p1) && !orderedTeam2[roleIndex]) {
        orderedTeam2[roleIndex] = s1InT2;
        assignedTeam2Names.add(p1);
      }
    }

    if (p2) {
      const s2InT1 = chosen.team1.find((s) => s.name === p2);
      const s2InT2 = chosen.team2.find((s) => s.name === p2);
      if (s2InT1 && !assignedTeam1Names.has(p2) && !orderedTeam1[roleIndex]) {
        orderedTeam1[roleIndex] = s2InT1;
        assignedTeam1Names.add(p2);
      } else if (s2InT2 && !assignedTeam2Names.has(p2) && !orderedTeam2[roleIndex]) {
        orderedTeam2[roleIndex] = s2InT2;
        assignedTeam2Names.add(p2);
      }
    }
  });

  // Second pass: Fill remaining unassigned summoners into empty slots
  const remainingTeam1 = chosen.team1.filter((s) => !assignedTeam1Names.has(s.name));
  const remainingTeam2 = chosen.team2.filter((s) => !assignedTeam2Names.has(s.name));

  let cursor1 = 0;
  let cursor2 = 0;

  for (let index = 0; index < 5; index++) {
    if (!orderedTeam1[index] && cursor1 < remainingTeam1.length) {
      orderedTeam1[index] = remainingTeam1[cursor1++];
    }
    if (!orderedTeam2[index] && cursor2 < remainingTeam2.length) {
      orderedTeam2[index] = remainingTeam2[cursor2++];
    }
  }

  const finalTeam1 = orderedTeam1.filter(Boolean) as V3Summoner[];
  const finalTeam2 = orderedTeam2.filter(Boolean) as V3Summoner[];

  // Interleave team1 and team2 for the active list order: T1[0], T2[0], T1[1], T2[1], ...
  const interleavedSummoners: V3Summoner[] = [];
  for (let index = 0; index < 5; index++) {
    const s1 = orderedTeam1[index];
    const s2 = orderedTeam2[index];
    if (s1) interleavedSummoners.push(s1);
    if (s2) interleavedSummoners.push(s2);
  }

  ROLES_ORDER.forEach((role, index) => {
    lanePairings.push({
      roleName: role,
      teamOneSummonerName: orderedTeam1[index]?.name || null,
      teamTwoSummonerName: orderedTeam2[index]?.name || null,
    });
  });

  return {
    team1: finalTeam1,
    team2: finalTeam2,
    interleavedSummoners,
    team1Power: chosen.team1Power,
    team2Power: chosen.team2Power,
    powerDiff: chosen.powerDiff,
    top2Separated: chosen.top2Separated,
    lanePairings,
    signature: chosen.signature,
  };
}
