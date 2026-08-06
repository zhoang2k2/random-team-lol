import { useCallback } from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { analytics } from "@/lib/analytics";
import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";
import { EMPTY_DEFAULT_ROLES } from "@/components/DefaultRolePicker";
import type { ExclusionPair } from "@/lib/randomize";
import type { LaneResult } from "@/components/v2/ResultLane";

export const MAX_SUMMONERS = 10;
export const V2_STORAGE_KEY = "v2-store-v1";

export type Summoner = {
  id: string;
  name: string;
  power: number;
};

export type V2Settings = {
  shuffleTeam: boolean;
  skipAnimation: boolean;
  animationSeconds: number;
  evaluatePower: boolean;
  defaultRoles: DefaultRoleConfig;
  exclusion: ExclusionPair | null;
};

const DEFAULT_SETTINGS: V2Settings = {
  shuffleTeam: false,
  skipAnimation: false,
  animationSeconds: 2,
  evaluatePower: false,
  defaultRoles: EMPTY_DEFAULT_ROLES,
  exclusion: null,
};

type PersistedState = {
  summoners: Summoner[];
  settings: V2Settings;
  results: LaneResult[];
};

const DEFAULT_STATE: PersistedState = {
  summoners: [],
  settings: DEFAULT_SETTINGS,
  results: [],
};

export const useV2Store = () => {
  const [state, setState] = useLocalStorage<PersistedState>(V2_STORAGE_KEY, DEFAULT_STATE);

  // ── Summoners ─────────────────────────────────────────────────────────────

  const addSummoner = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((prev) => {
        if (prev.summoners.length >= MAX_SUMMONERS) return prev;
        if (prev.summoners.some((s) => s.name === trimmed)) return prev;
        return {
          ...prev,
          summoners: [...prev.summoners, { id: crypto.randomUUID(), name: trimmed, power: 1 }],
        };
      });
      analytics.summonerAdd({ version: "v2", total: state.summoners.length + 1 });
    },
    [setState],
  );

  const removeSummoner = useCallback(
    (id: string) => {
      setState((prev) => {
        const name = prev.summoners.find((s) => s.id === id)?.name;
        const exclusion = prev.settings.exclusion;
        const nextExclusion =
          exclusion && (exclusion.a === name || exclusion.b === name) ? null : exclusion;
        return {
          ...prev,
          summoners: prev.summoners.filter((s) => s.id !== id),
          settings: { ...prev.settings, exclusion: nextExclusion },
        };
      });
      analytics.summonerRemove({ version: "v2", total: Math.max(0, state.summoners.length - 1) });
    },
    [setState],
  );

  const reorderSummoners = useCallback(
    (orderedIds: string[]) => {
      setState((prev) => {
        const map = new Map(prev.summoners.map((s) => [s.id, s]));
        const reordered = orderedIds.flatMap((id) => {
          const s = map.get(id);
          return s ? [s] : [];
        });
        return { ...prev, summoners: reordered };
      });
    },
    [setState],
  );

  const updatePower = useCallback(
    (id: string, power: number) => {
      setState((prev) => ({
        ...prev,
        summoners: prev.summoners.map((s) => (s.id === id ? { ...s, power } : s)),
      }));
    },
    [setState],
  );

  const renameSummoner = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((prev) => {
        if (prev.summoners.some((s) => s.name === trimmed && s.id !== id)) return prev;
        return {
          ...prev,
          summoners: prev.summoners.map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
          settings: {
            ...prev.settings,
            exclusion: prev.settings.exclusion
              ? {
                  a: prev.summoners.find((s) => s.id === id)?.name === prev.settings.exclusion.a
                    ? trimmed
                    : prev.settings.exclusion.a,
                  b: prev.summoners.find((s) => s.id === id)?.name === prev.settings.exclusion.b
                    ? trimmed
                    : prev.settings.exclusion.b,
                }
              : null,
          },
        };
      });
      analytics.summonerRename({ version: "v2" });
    },
    [setState],
  );

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (patch: Partial<V2Settings>) => {
      setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    [setState],
  );

  // ── Results ───────────────────────────────────────────────────────────────

  const setResults = useCallback(
    (results: LaneResult[]) => {
      setState((prev) => ({ ...prev, results }));
    },
    [setState],
  );

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [] }));
  }, [setState]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, [setState]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const { summoners, settings, results } = state;

  return {
    summoners,
    settings,
    results,
    members: summoners.map((s) => s.name),
    canComplete: summoners.length >= 2,
    isAtMax: summoners.length >= MAX_SUMMONERS,
    addSummoner,
    removeSummoner,
    reorderSummoners,
    updatePower,
    renameSummoner,
    updateSettings,
    setResults,
    clearResults,
    resetAll,
  };
};
