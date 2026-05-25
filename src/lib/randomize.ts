import type { Role } from "./lol-api";
import { ROLES_ORDER } from "./lol-api";

export type ExclusionPair = { a: string; b: string };

export type LanePairing = {
  role: Role;
  alpha: string | null;
  beta: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function violates(team: string[], exclusions: ExclusionPair[]): boolean {
  const set = new Set(team);
  return exclusions.some((p) => set.has(p.a) && set.has(p.b));
}

export function buildLanePairings(
  members: string[],
  teamSize: number,
  randomRole: boolean,
  randomMembers: boolean,
  exclusions: ExclusionPair[],
  defaultRoles?: Record<Role, { p1: string; p2: string }>,
): LanePairing[] {
  const trimmed = members.slice(0, teamSize * 2);
  const half = Math.ceil(trimmed.length / 2);
  const alphaSize = half;
  const betaSize = trimmed.length - half;
  const lanesNeeded = Math.max(alphaSize, betaSize);

  const rolesPool: Role[] = randomRole
    ? shuffle(ROLES_ORDER).slice(0, lanesNeeded)
    : ROLES_ORDER.slice(0, lanesNeeded);

  let bestPairings: LanePairing[] | null = null;

  for (let attempt = 0; attempt < 1000; attempt++) {
    const alphaTeam: (string | null)[] = Array(lanesNeeded).fill(null);
    const betaTeam: (string | null)[] = Array(lanesNeeded).fill(null);

    const assignedInThisAttempt = new Set<string>();
    const alphaAvailable = Array.from({ length: alphaSize }, (_, i) => i);
    const betaAvailable = Array.from({ length: betaSize }, (_, i) => i);

    // 1. Assign default players to their respective roles first
    for (let i = 0; i < lanesNeeded; i++) {
      const role = rolesPool[i];
      const config = defaultRoles?.[role];
      const dp1 = config?.p1 && trimmed.includes(config.p1) ? config.p1 : null;
      const dp2 = config?.p2 && trimmed.includes(config.p2) ? config.p2 : null;

      const alphaCanPlace = alphaAvailable.includes(i);
      const betaCanPlace = betaAvailable.includes(i);

      if (dp1 && dp2) {
        if (alphaCanPlace && betaCanPlace) {
          if (Math.random() < 0.5) {
            alphaTeam[i] = dp1;
            betaTeam[i] = dp2;
          } else {
            alphaTeam[i] = dp2;
            betaTeam[i] = dp1;
          }
          assignedInThisAttempt.add(dp1);
          assignedInThisAttempt.add(dp2);
          alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
          betaAvailable.splice(betaAvailable.indexOf(i), 1);
        } else if (alphaCanPlace) {
          const chosen = Math.random() < 0.5 ? dp1 : dp2;
          alphaTeam[i] = chosen;
          assignedInThisAttempt.add(chosen);
          alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
        } else if (betaCanPlace) {
          const chosen = Math.random() < 0.5 ? dp1 : dp2;
          betaTeam[i] = chosen;
          assignedInThisAttempt.add(chosen);
          betaAvailable.splice(betaAvailable.indexOf(i), 1);
        }
      } else if (dp1) {
        if (alphaCanPlace && betaCanPlace) {
          if (Math.random() < 0.5) {
            alphaTeam[i] = dp1;
            alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
          } else {
            betaTeam[i] = dp1;
            betaAvailable.splice(betaAvailable.indexOf(i), 1);
          }
          assignedInThisAttempt.add(dp1);
        } else if (alphaCanPlace) {
          alphaTeam[i] = dp1;
          assignedInThisAttempt.add(dp1);
          alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
        } else if (betaCanPlace) {
          betaTeam[i] = dp1;
          assignedInThisAttempt.add(dp1);
          betaAvailable.splice(betaAvailable.indexOf(i), 1);
        }
      } else if (dp2) {
        if (alphaCanPlace && betaCanPlace) {
          if (Math.random() < 0.5) {
            alphaTeam[i] = dp2;
            alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
          } else {
            betaTeam[i] = dp2;
            betaAvailable.splice(betaAvailable.indexOf(i), 1);
          }
          assignedInThisAttempt.add(dp2);
        } else if (alphaCanPlace) {
          alphaTeam[i] = dp2;
          assignedInThisAttempt.add(dp2);
          alphaAvailable.splice(alphaAvailable.indexOf(i), 1);
        } else if (betaCanPlace) {
          betaTeam[i] = dp2;
          assignedInThisAttempt.add(dp2);
          betaAvailable.splice(betaAvailable.indexOf(i), 1);
        }
      }
    }

    // 2. Distribute remaining players to empty slots
    const unassignedPlayers = trimmed.filter((p) => !assignedInThisAttempt.has(p));
    const remainingPlayersPool = randomMembers
      ? shuffle(unassignedPlayers)
      : [...unassignedPlayers];

    let cursor = 0;
    for (const idx of alphaAvailable) {
      if (cursor < remainingPlayersPool.length) {
        alphaTeam[idx] = remainingPlayersPool[cursor++];
      }
    }
    for (const idx of betaAvailable) {
      if (cursor < remainingPlayersPool.length) {
        betaTeam[idx] = remainingPlayersPool[cursor++];
      }
    }

    // 3. Check for exclusions
    const alphaPlayers = alphaTeam.filter(Boolean) as string[];
    const betaPlayers = betaTeam.filter(Boolean) as string[];

    const violatesExclusions =
      violates(alphaPlayers, exclusions) || violates(betaPlayers, exclusions);

    const currentPairings: LanePairing[] = [];
    for (let i = 0; i < lanesNeeded; i++) {
      currentPairings.push({
        role: rolesPool[i],
        alpha: alphaTeam[i],
        beta: betaTeam[i],
      });
    }

    if (!violatesExclusions) {
      return currentPairings;
    }

    if (!bestPairings) {
      bestPairings = currentPairings;
    }
  }

  return bestPairings || [];
}
