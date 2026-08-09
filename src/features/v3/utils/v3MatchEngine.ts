import type { Champion, Role } from "@/lib/lol-api";
import { ROLES_ORDER } from "@/lib/lol-api";
import type {
  V3Summoner,
  V3Settings,
  V3MatchResult,
  V3MatchLaneResult,
  V3PlayerMatchInfo,
} from "@/features/v3/types/v3Types";
import { calculateV3PowerBalancedTeams } from "@/features/v3/utils/v3PowerBalance";
import { buildLanePairings } from "@/lib/randomize";

export type CreateMatchOutcome = {
  matchResult: V3MatchResult;
  updatedActiveSummoners?: V3Summoner[];
};

function getRandomChampion(pool: Champion[]): Champion | null {
  if (!pool || pool.length === 0) return null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function createV3MatchResult(
  summonerList: V3Summoner[],
  settings: V3Settings,
  championPool: Champion[],
): CreateMatchOutcome | null {
  const activeSummoners = summonerList.slice(0, 10);
  if (activeSummoners.length === 0) {
    return null;
  }

  let lanePlayerNames: { role: Role; blueName: string | null; redName: string | null }[] = [];
  let updatedActiveSummoners: V3Summoner[] | undefined = undefined;

  if (settings.isShuffleTeamEnabled) {
    if (settings.isEvaluatePowerEnabled) {
      // Power Evaluate enabled
      const balanced = calculateV3PowerBalancedTeams(
        activeSummoners,
        settings.defaultRoles,
        settings.neverSameTeam,
      );

      if (balanced) {
        updatedActiveSummoners = balanced.interleavedSummoners;
        lanePlayerNames = balanced.lanePairings.map((pairing) => ({
          role: pairing.roleName as Role,
          blueName: pairing.teamOneSummonerName,
          redName: pairing.teamTwoSummonerName,
        }));
      }
    } else {
      // Standard Shuffle Team
      const activeNames = activeSummoners.map((s) => s.name);
      const exclusions = settings.neverSameTeam ? [settings.neverSameTeam] : [];
      const pairings = buildLanePairings(
        activeNames,
        5,
        false,
        true,
        exclusions,
        settings.defaultRoles,
      );

      // Re-map active list order
      const map = new Map(activeSummoners.map((s) => [s.name, s]));
      const newActive: V3Summoner[] = [];
      pairings.forEach((pair) => {
        if (pair.alpha && map.has(pair.alpha)) newActive.push(map.get(pair.alpha)!);
        if (pair.beta && map.has(pair.beta)) newActive.push(map.get(pair.beta)!);
      });
      activeSummoners.forEach((s) => {
        if (!newActive.some((item) => item.id === s.id)) {
          newActive.push(s);
        }
      });
      updatedActiveSummoners = newActive;

      lanePlayerNames = pairings.map((pair) => ({
        role: pair.role as Role,
        blueName: pair.alpha,
        redName: pair.beta,
      }));
    }
  }

  // Fallback or Shuffle Team = false: Keep current grid split (even = Blue, odd = Red)
  if (lanePlayerNames.length === 0) {
    const blueTeamMembers = activeSummoners.filter((_, idx) => idx % 2 === 0);
    const redTeamMembers = activeSummoners.filter((_, idx) => idx % 2 === 1);

    lanePlayerNames = ROLES_ORDER.map((role, idx) => ({
      role,
      blueName: blueTeamMembers[idx]?.name || null,
      redName: redTeamMembers[idx]?.name || null,
    }));
  }

  // Create lanes and assign fresh random champions independently for each player
  const activeMap = new Map(activeSummoners.map((s) => [s.name, s]));
  const lanes: V3MatchLaneResult[] = [];

  let blueTotalPower = 0;
  let redTotalPower = 0;

  for (const item of lanePlayerNames) {
    let bluePlayer: V3PlayerMatchInfo | null = null;
    let redPlayer: V3PlayerMatchInfo | null = null;

    if (item.blueName && activeMap.has(item.blueName)) {
      const summoner = activeMap.get(item.blueName)!;
      bluePlayer = {
        name: summoner.name,
        powerScore: summoner.powerScore,
        champion: getRandomChampion(championPool),
      };
      blueTotalPower += summoner.powerScore;
    }

    if (item.redName && activeMap.has(item.redName)) {
      const summoner = activeMap.get(item.redName)!;
      redPlayer = {
        name: summoner.name,
        powerScore: summoner.powerScore,
        champion: getRandomChampion(championPool),
      };
      redTotalPower += summoner.powerScore;
    }

    lanes.push({
      role: item.role,
      bluePlayer,
      redPlayer,
    });
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const matchResult: V3MatchResult = {
    id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: timeString,
    lanes,
    blueTotalPower,
    redTotalPower,
    powerDiff: Math.abs(blueTotalPower - redTotalPower),
    isPowerEvaluateActive: settings.isEvaluatePowerEnabled,
  };

  return {
    matchResult,
    updatedActiveSummoners,
  };
}
