import type { Role } from "@/lib/lol-api";

export const MAX_SUMMONERS = 10;
export const V2_STORAGE_KEY = "v2-store-v1";

export type Summoner = {
  id: string;
  name: string;
  power: number;
};

export type DefaultRoleSlot = { p1: string; p2: string };
export type DefaultRoles = Record<Role, DefaultRoleSlot>;

export const EMPTY_DEFAULT_ROLES: DefaultRoles = {
  TOP: { p1: "", p2: "" },
  JUNGLE: { p1: "", p2: "" },
  MID: { p1: "", p2: "" },
  ADC: { p1: "", p2: "" },
  SUPPORT: { p1: "", p2: "" },
};

export type ExclusionPair = { a: string; b: string };

export type LaneResult = {
  role: Role;
  alphaName: string | null;
  betaName: string | null;
};

export type V2Settings = {
  shuffleTeam: boolean;
  skipAnimation: boolean;
  animationSeconds: number;
  evaluatePower: boolean;
  defaultRoles: DefaultRoles;
  exclusion: ExclusionPair | null;
};

export const DEFAULT_SETTINGS: V2Settings = {
  shuffleTeam: false,
  skipAnimation: false,
  animationSeconds: 2,
  evaluatePower: false,
  defaultRoles: EMPTY_DEFAULT_ROLES,
  exclusion: null,
};

export type V2PersistedState = {
  summoners: Summoner[];
  settings: V2Settings;
  results: LaneResult[];
};

export const DEFAULT_PERSISTED_STATE: V2PersistedState = {
  summoners: [],
  settings: DEFAULT_SETTINGS,
  results: [],
};
