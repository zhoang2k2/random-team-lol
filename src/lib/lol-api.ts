// Data Dragon (official Riot static data) — fetched client-side, no key required.
// Docs: https://developer.riotgames.com/docs/lol#data-dragon

export type Champion = {
  id: string; // "Aatrox"
  key: string; // "266"
  name: string; // "Aatrox"
  title: string;
  squareUrl: string; // 120x120 portrait
  splashUrl: string; // loading splash
};

export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export const ROLES_ORDER: Role[] = ["ADC", "SUPPORT", "JUNGLE", "MID", "TOP"];

export const ROLE_META: Record<Role, { label: string; iconUrl: string; color: string }> = {
  TOP: {
    label: "Top",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-top.svg",
    color: "oklch(0.70 0.14 60)",
  },
  JUNGLE: {
    label: "Jungle",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-jungle.svg",
    color: "oklch(0.65 0.16 145)",
  },
  MID: {
    label: "Mid",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-middle.svg",
    color: "oklch(0.72 0.16 320)",
  },
  ADC: {
    label: "ADC",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-bottom.svg",
    color: "oklch(0.70 0.18 30)",
  },
  SUPPORT: {
    label: "Support",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-utility.svg",
    color: "oklch(0.70 0.16 200)",
  },
};

let cachedVersion: string | null = null;
let cachedChampions: Champion[] | null = null;

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  const versions: string[] = await res.json();
  cachedVersion = versions[0];
  return cachedVersion;
}

export async function getAllChampions(): Promise<Champion[]> {
  if (cachedChampions) return cachedChampions;
  const version = await getLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  );
  const data = await res.json();
  const champs: Champion[] = Object.values<{
    id: string;
    key: string;
    name: string;
    title: string;
    image: { full: string };
  }>(data.data).map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    title: c.title,
    squareUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
    splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${c.id}_0.jpg`,
  }));
  champs.sort((a, b) => a.name.localeCompare(b.name));
  cachedChampions = champs;
  return champs;
}

export function pickRandomChampions(
  pool: Champion[],
  n: number,
  excludeIds?: Set<string>,
): Champion[] {
  const filtered =
    excludeIds && excludeIds.size > 0 ? pool.filter((c) => !excludeIds.has(c.id)) : pool;
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
