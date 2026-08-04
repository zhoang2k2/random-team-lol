// Champion class tags as defined by Riot Data Dragon
export const CHAMPION_TAGS = [
  "Tank",
  "Fighter",
  "Mage",
  "Assassin",
  "Marksman",
  "Support",
] as const;

export type ChampionTag = (typeof CHAMPION_TAGS)[number];
