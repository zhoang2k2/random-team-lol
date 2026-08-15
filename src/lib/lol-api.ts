// Data Dragon (official Riot static data) — fetched client-side, no key required.
// Docs: https://developer.riotgames.com/docs/lol#data-dragon

import type { ChampionTag } from "./constants";

export type Champion = {
  id: string; // "Aatrox"
  key: string; // "266"
  name: string; // "Aatrox"
  title: string;
  tags: ChampionTag[]; // ["Fighter", "Tank"]
  squareUrl: string; // 120x120 portrait
  splashUrl: string; // loading splash
};
export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export const ROLES_ORDER: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

export const ROLE_META: Record<Role, { label: string; iconUrl: string; color: string }> = {
  TOP: {
    label: "Top",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-top.svg",
    color: "#dd8736",
  },
  JUNGLE: {
    label: "Jungle",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-jungle.svg",
    color: "#43a84c",
  },
  MID: {
    label: "Mid",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-middle.svg",
    color: "#d080e2",
  },
  ADC: {
    label: "ADC",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-bottom.svg",
    color: "#fa6a57",
  },
  SUPPORT: {
    label: "Support",
    iconUrl:
      "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/svg/position-utility.svg",
    color: "#00bac5",
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
  // Strip to only the fields we need — avoids holding blurb/stats/partype/sprite in memory.
  // Also filter out "Jade_*" entries (legacy rework variants, not standard champions).
  const champs: Champion[] = Object.values<{
    id: string;
    key: string;
    name: string;
    title: string;
    tags: string[];
    image: { full: string };
  }>(data.data)
    .filter((c) => !c.id.startsWith("Jade_"))
    .map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      tags: c.tags as ChampionTag[],
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
  // Fisher-Yates — uniform distribution, no duplicates within one call
  const arr = [...filtered];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}
