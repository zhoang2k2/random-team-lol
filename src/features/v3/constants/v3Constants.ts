import { EMPTY_DEFAULT_ROLES } from "@/components/DefaultRolePicker";
import type { V3Settings, V3PersistedState } from "@/features/v3/types/v3Types";

export const V3_STORAGE_KEY = "v3-store-v1";
export const V3_MAX_ACTIVE_SUMMONERS = 10;
export const V3_DEFAULT_POWER_SCORE = 1;

export const V3_DEFAULT_SETTINGS: V3Settings = {
  isEvaluatePowerEnabled: false,
  isShuffleTeamEnabled: false,
  isSkipAnimationEnabled: false,
  animationDurationSeconds: 2,
  defaultRoles: EMPTY_DEFAULT_ROLES,
  neverSameTeam: null,
};

export const V3_DEFAULT_PERSISTED_STATE: V3PersistedState = {
  summonerList: [],
  settings: V3_DEFAULT_SETTINGS,
  laneResults: [],
  matchResults: [],
};

export const V3_INITIAL_SAMPLE_SUMMONERS = [
  {
    id: "sample-summoner-1",
    name: "Faker",
    powerScore: 10,
  },
  {
    id: "sample-summoner-2",
    name: "Chovy",
    powerScore: 10,
  },
  {
    id: "sample-summoner-3",
    name: "Zeus",
    powerScore: 9,
  },
  {
    id: "sample-summoner-4",
    name: "Keria",
    powerScore: 8,
  },
  {
    id: "sample-summoner-5",
    name: "Oner",
    powerScore: 8,
  },
  {
    id: "sample-summoner-6",
    name: "Deft",
    powerScore: 7,
  },
  {
    id: "sample-summoner-7",
    name: "ShowMaker",
    powerScore: 9,
  },
  {
    id: "sample-summoner-8",
    name: "Canyon",
    powerScore: 9,
  },
  {
    id: "sample-summoner-9",
    name: "Ruler",
    powerScore: 9,
  },
  {
    id: "sample-summoner-10",
    name: "Viper",
    powerScore: 8,
  },
];
