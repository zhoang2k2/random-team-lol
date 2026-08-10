import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";
import type { ExclusionPair } from "@/lib/randomize";
import { ROLES_ORDER } from "@/lib/lol-api";
import type { V3Summoner, V3TeamLaneResult } from "@/features/v3/types/v3Types";

export type V3PowerBalancedResult = {
  team1: V3Summoner[];
  team2: V3Summoner[];
  interleavedSummoners: V3Summoner[];
  team1Power: number;
  team2Power: number;
  powerDiff: number;
  top2Separated: boolean;
  lanePairings: V3TeamLaneResult[];
};

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
    for (let i = start; i <= n - (k - current.length); i++) {
      current.push(i);
      helper(i + 1, current);
      current.pop();
    }
  }

  helper(0, []);
  return result;
}

/**
 * Calculates power-balanced team assignments for V3.
 *
 * Rules:
 * 1. Default Role & Never On Same Team constraints MUST be satisfied first.
 * 2. Top 2 highest power summoners should NOT be on the same team if possible.
 * 3. Minimal total power score difference between Team 1 and Team 2.
 */
export function calculateV3PowerBalancedTeams(
  activeSummoners: V3Summoner[],
  defaultRoles: DefaultRoleConfig,
  neverSameTeam: ExclusionPair | null,
): V3PowerBalancedResult | null {
  if (activeSummoners.length < 2) {
    return null;
  }

  const trimmed = activeSummoners.slice(0, 10);
  const totalCount = trimmed.length;
  const team1Size = Math.ceil(totalCount / 2);

  // Identify top 2 highest power summoners among active list
  const sortedByPower = [...trimmed].sort((a, b) => b.powerScore - a.powerScore);
  const top1Id = sortedByPower[0]?.id;
  const top2Id = sortedByPower[1]?.id;

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
  };

  const candidates: PartitionCandidate[] = [];

  for (const t1Indices of team1Combinations) {
    const t1IndexSet = new Set(t1Indices);
    const team1 = t1Indices.map((index) => trimmed[index]);
    const team2 = trimmed.filter((_, index) => !t1IndexSet.has(index));

    const team1NameSet = new Set(team1.map((s) => s.name));
    const team2NameSet = new Set(team2.map((s) => s.name));

    // 1. Check Never Same Team constraint
    let violatesExclusions = false;
    if (neverSameTeam && neverSameTeam.a && neverSameTeam.b) {
      const a = neverSameTeam.a;
      const b = neverSameTeam.b;
      if (
        (team1NameSet.has(a) && team1NameSet.has(b)) ||
        (team2NameSet.has(a) && team2NameSet.has(b))
      ) {
        violatesExclusions = true;
      }
    }

    // 2. Check Default Role compatibility
    let violatesDefaultRoles = false;
    for (const role of ROLES_ORDER) {
      const roleConfig = defaultRoles[role];
      if (!roleConfig) continue;
      const { p1, p2 } = roleConfig;

      // If both p1 and p2 are assigned to this role, they cannot be on the same team
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

    // 3. Check top 2 separation
    const top1InT1 = team1.some((s) => s.id === top1Id);
    const top2InT1 = team1.some((s) => s.id === top2Id);
    const top2Separated = Boolean(
      top1Id && top2Id && ((top1InT1 && !top2InT1) || (!top1InT1 && top2InT1)),
    );

    const team1Power = team1.reduce((acc, s) => acc + s.powerScore, 0);
    const team2Power = team2.reduce((acc, s) => acc + s.powerScore, 0);
    const powerDiff = Math.abs(team1Power - team2Power);

    candidates.push({
      team1,
      team2,
      team1Power,
      team2Power,
      powerDiff,
      top2Separated,
      violatesExclusions,
      violatesDefaultRoles,
    });
  }

  // Priority 1: Filter candidates that violate NO constraints
  let validCandidates = candidates.filter((c) => !c.violatesExclusions && !c.violatesDefaultRoles);

  // Fallback if constraints cannot be satisfied simultaneously
  if (validCandidates.length === 0) {
    validCandidates = candidates.filter((c) => !c.violatesExclusions);
  }
  if (validCandidates.length === 0) {
    validCandidates = candidates;
  }

  // Priority 2: Prefer partitions where top 2 power summoners are separated
  const separatedCandidates = validCandidates.filter((c) => c.top2Separated);
  const poolToUse = separatedCandidates.length > 0 ? separatedCandidates : validCandidates;

  // Priority 3: Minimal total power difference
  let minDiff = Infinity;
  for (const item of poolToUse) {
    if (item.powerDiff < minDiff) {
      minDiff = item.powerDiff;
    }
  }

  const bestCandidates = poolToUse.filter((item) => item.powerDiff === minDiff);
  const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];

  if (!chosen) {
    return null;
  }

  // Build lane pairings matching ROLES_ORDER
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

  // Clean list of non-nulls for final result
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
  };
}
