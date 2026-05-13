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

function splitIntoTeams(
  members: string[],
  teamSize: number,
  randomMembers: boolean,
  exclusions: ExclusionPair[]
): { alpha: string[]; beta: string[] } {
  const trimmed = members.slice(0, teamSize * 2);

  if (!randomMembers) {
    // by entry order: first half Alpha, second half Beta
    const half = Math.ceil(trimmed.length / 2);
    let alpha = trimmed.slice(0, half);
    let beta = trimmed.slice(half);

    // attempt minimal swaps if exclusions violated
    for (let attempt = 0; attempt < 50; attempt++) {
      if (!violates(alpha, exclusions) && !violates(beta, exclusions)) break;
      // swap a random pair
      if (alpha.length && beta.length) {
        const i = Math.floor(Math.random() * alpha.length);
        const j = Math.floor(Math.random() * beta.length);
        [alpha[i], beta[j]] = [beta[j], alpha[i]];
      } else break;
    }
    return { alpha, beta };
  }

  for (let attempt = 0; attempt < 300; attempt++) {
    const s = shuffle(trimmed);
    const half = Math.ceil(s.length / 2);
    const alpha = s.slice(0, half);
    const beta = s.slice(half);
    if (!violates(alpha, exclusions) && !violates(beta, exclusions)) {
      return { alpha, beta };
    }
  }
  // give up: return last shuffle
  const s = shuffle(trimmed);
  const half = Math.ceil(s.length / 2);
  return { alpha: s.slice(0, half), beta: s.slice(half) };
}

export function buildLanePairings(
  members: string[],
  teamSize: number,
  randomRole: boolean,
  randomMembers: boolean,
  exclusions: ExclusionPair[]
): LanePairing[] {
  const { alpha, beta } = splitIntoTeams(members, teamSize, randomMembers, exclusions);
  const lanesNeeded = Math.max(alpha.length, beta.length);

  const rolesPool: Role[] = randomRole
    ? shuffle(ROLES_ORDER).slice(0, lanesNeeded)
    : ROLES_ORDER.slice(0, lanesNeeded);

  // shuffle within-team assignment so members rotate through roles each round
  const alphaShuffled = shuffle(alpha);
  const betaShuffled = shuffle(beta);

  const pairings: LanePairing[] = [];
  for (let i = 0; i < lanesNeeded; i++) {
    pairings.push({
      role: rolesPool[i],
      alpha: alphaShuffled[i] ?? null,
      beta: betaShuffled[i] ?? null,
    });
  }
  return pairings;
}
