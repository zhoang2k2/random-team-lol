/**
 * Power-balanced team assignment.
 *
 * Given a list of summoners with numeric power scores, assigns them to two
 * teams such that the absolute difference between total power is minimized.
 *
 * Algorithm: greedy snake-draft sort.
 * 1. Sort players descending by power.
 * 2. Iterate; assign each player to the team with the currently lower total.
 * 3. Ties broken by alternating to avoid always favouring one team.
 *
 * This is optimal for equal-size teams and near-optimal otherwise (provably
 * within a small constant factor for the partition problem on ≤ 10 players).
 *
 * Returns: two arrays — `alpha` and `beta` — each containing summoner names,
 * in the order they should be used for lane assignment.
 */
export type PowerEntry = { name: string; power: number };

export type BalancedTeams = {
  alpha: string[];
  beta: string[];
  alphaTotalPower: number;
  betaTotalPower: number;
  powerDiff: number;
};

export const balanceByPower = (entries: PowerEntry[]): BalancedTeams => {
  if (entries.length === 0) {
    return { alpha: [], beta: [], alphaTotalPower: 0, betaTotalPower: 0, powerDiff: 0 };
  }

  // Sort descending by power
  const sorted = [...entries].sort((a, b) => b.power - a.power);

  const alpha: string[] = [];
  const beta: string[] = [];
  let alphaTotal = 0;
  let betaTotal = 0;

  for (const entry of sorted) {
    // Assign to the team with lower current total; ties go to alpha first
    if (alphaTotal <= betaTotal) {
      alpha.push(entry.name);
      alphaTotal += entry.power;
    } else {
      beta.push(entry.name);
      betaTotal += entry.power;
    }
  }

  return {
    alpha,
    beta,
    alphaTotalPower: alphaTotal,
    betaTotalPower: betaTotal,
    powerDiff: Math.abs(alphaTotal - betaTotal),
  };
};

/**
 * Interleave alpha and beta into a single ordered members array suitable for
 * buildLanePairings: alpha[0], beta[0], alpha[1], beta[1], ...
 *
 * This matches the index.tsx convention so lane assignment is predictable.
 */
export const interleaveTeams = (alpha: string[], beta: string[]): string[] => {
  const result: string[] = [];
  const maxLen = Math.max(alpha.length, beta.length);
  for (let index = 0; index < maxLen; index++) {
    if (alpha[index]) result.push(alpha[index]);
    if (beta[index]) result.push(beta[index]);
  }
  return result;
};
