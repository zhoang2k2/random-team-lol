import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";
import type { ExclusionPair } from "@/lib/randomize";
import type { Champion, Role } from "@/lib/lol-api";

export type V3Summoner = {
  id: string;
  name: string;
  powerScore: number;
};

export type V3Settings = {
  isEvaluatePowerEnabled: boolean;
  isShuffleTeamEnabled: boolean;
  isSkipAnimationEnabled: boolean;
  animationDurationSeconds: number;
  defaultRoles: DefaultRoleConfig;
  neverSameTeam: ExclusionPair | null;
};

export type V3TeamLaneResult = {
  roleName: string;
  teamOneSummonerName: string | null;
  teamTwoSummonerName: string | null;
};

export type V3PlayerMatchInfo = {
  name: string;
  powerScore: number;
  champion: Champion | null;
};

export type V3MatchLaneResult = {
  role: Role;
  bluePlayer: V3PlayerMatchInfo | null;
  redPlayer: V3PlayerMatchInfo | null;
};

export type V3MatchResult = {
  id: string;
  createdAt: string;
  lanes: V3MatchLaneResult[];
  blueTotalPower: number;
  redTotalPower: number;
  powerDiff: number;
  isPowerEvaluateActive: boolean;
};

export type V3PersistedState = {
  summonerList: V3Summoner[];
  settings: V3Settings;
  laneResults: V3TeamLaneResult[];
  matchResults: V3MatchResult[];
  recentHistorySignatures?: string[];
};
