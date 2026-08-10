import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { V3Summoner, V3PersistedState, V3MatchResult } from "@/features/v3/types/v3Types";
import type { DefaultRoleConfig } from "@/components/DefaultRolePicker";
import type { ExclusionPair } from "@/lib/randomize";
import {
  V3_STORAGE_KEY,
  V3_DEFAULT_PERSISTED_STATE,
  V3_DEFAULT_SETTINGS,
  V3_DEFAULT_POWER_SCORE,
  V3_INITIAL_SAMPLE_SUMMONERS,
} from "@/features/v3/constants/v3Constants";
import { calculateV3PowerBalancedTeams } from "@/features/v3/utils/v3PowerBalance";
import { createV3MatchResult } from "@/features/v3/utils/v3MatchEngine";
import { getAllChampions, type Champion } from "@/lib/lol-api";
import { supabase } from "@/utils/supabase";
import {
  fetchV3DataFromSupabase,
  saveV3SettingsToSupabase,
  addV3SummonerToSupabase,
  updateV3SummonerInSupabase,
  deleteV3SummonerFromSupabase,
  clearAllV3SummonersFromSupabase,
  syncV3SummonersOrderToSupabase,
  addV3MatchResultToSupabase,
  deleteV3MatchResultFromSupabase,
  clearAllV3MatchResultsFromSupabase,
  isValidUuid,
} from "@/features/v3/services/v3SupabaseService";

export const useV3Store = () => {
  const { isLoggedIn, user } = useAuth();
  const [persistedState, setPersistedState] = useState<V3PersistedState>(
    V3_DEFAULT_PERSISTED_STATE,
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const [draggedSourceIndex, setDraggedSourceIndex] = useState<number | null>(null);
  const [previewDropTargetIndex, setPreviewDropTargetIndex] = useState<number | null>(null);
  const [championPool, setChampionPool] = useState<Champion[]>([]);

  // Ref to keep track of previous auth user ID to detect transitions
  const previousUserIdRef = useRef<string | null>(null);
  const isInitialAuthCheckedRef = useRef<boolean>(false);

  // Animation shuffle state
  const [pendingOutcome, setPendingOutcome] = useState<{
    matchResult: V3MatchResult;
    updatedActiveSummoners?: V3Summoner[];
  } | null>(null);
  const [animatingLaneIdx, setAnimatingLaneIdx] = useState<number>(-1);

  const isShufflingAnimation = pendingOutcome !== null;

  // 1. Initial LocalStorage Hydration (Anonymous mode startup)
  useEffect(() => {
    try {
      const storedItem = localStorage.getItem(V3_STORAGE_KEY);
      if (storedItem) {
        const parsedData = JSON.parse(storedItem) as V3PersistedState;
        const clampedSummonerList = (parsedData.summonerList || []).map((summoner) => ({
          ...summoner,
          powerScore: Math.min(10, Math.max(1, Math.round(Number(summoner.powerScore) || 5))),
        }));
        setPersistedState({
          ...V3_DEFAULT_PERSISTED_STATE,
          ...parsedData,
          summonerList: clampedSummonerList,
          settings: {
            ...V3_DEFAULT_SETTINGS,
            ...(parsedData.settings || {}),
          },
          matchResults: parsedData.matchResults || [],
        });
      }
    } catch (error) {
      console.error("Failed to parse V3 persisted state from localStorage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Champion Pool Loading
  useEffect(() => {
    let isMounted = true;
    getAllChampions()
      .then((champs) => {
        if (isMounted) setChampionPool(champs);
      })
      .catch((error) => {
        console.error("Failed to fetch champion pool:", error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Auth Transitions & Data Loading
  useEffect(() => {
    const currentUserId = user?.id ?? null;

    // Detect LOGIN transition (or initial mount with logged-in user)
    if (isLoggedIn && currentUserId) {
      if (previousUserIdRef.current !== currentUserId || !isInitialAuthCheckedRef.current) {
        previousUserIdRef.current = currentUserId;
        isInitialAuthCheckedRef.current = true;

        // Requirement 2: Clear LocalStorage upon successful login
        try {
          localStorage.removeItem(V3_STORAGE_KEY);
        } catch (e) {
          console.error("Failed to clear LocalStorage on login", e);
        }

        // Fetch user data from Supabase
        fetchV3DataFromSupabase(currentUserId)
          .then((data) => {
            const clampedSummonerList = (data.summonerList || []).map((summoner) => ({
              ...summoner,
              powerScore: Math.min(10, Math.max(1, Math.round(Number(summoner.powerScore) || 5))),
            }));
            setPersistedState((prev) => ({
              ...prev,
              settings: data.settings,
              summonerList: clampedSummonerList,
              matchResults: data.matchResults,
            }));
          })
          .catch((err) => {
            console.error("Failed to load user data from Supabase:", err);
            // Requirement 10: Do not silently overwrite app state with empty data if fetch fails
          });
      }
    } else {
      // Detect LOGOUT transition
      if (previousUserIdRef.current !== null) {
        previousUserIdRef.current = null;
        // In anonymous mode now, state will be saved to LocalStorage via the persistence effect
      }
      isInitialAuthCheckedRef.current = true;
    }
  }, [isLoggedIn, user?.id]);

  // 4. Persistence to LocalStorage (ANONYMOUS MODE ONLY)
  useEffect(() => {
    if (!isHydrated || isLoggedIn) return;
    try {
      localStorage.setItem(V3_STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error("Failed to save V3 state to localStorage", error);
    }
  }, [persistedState, isHydrated, isLoggedIn]);

  // Actions
  const handleAddSummoner = useCallback(
    (summonerName: string, initialPowerScore?: number) => {
      const trimmedName = summonerName.trim();
      if (!trimmedName) {
        return false;
      }

      // Guest max: 10, Auth max: 20
      const maxAllowed = isLoggedIn ? 20 : 10;
      if (persistedState.summonerList.length >= maxAllowed) {
        return false;
      }

      const powerScoreToUse = Math.min(
        10,
        Math.max(1, Math.round(Number(initialPowerScore ?? V3_DEFAULT_POWER_SCORE) || 5)),
      );
      const newId = crypto.randomUUID();

      const newSummonerItem: V3Summoner = {
        id: newId,
        name: trimmedName,
        powerScore: powerScoreToUse,
      };

      setPersistedState((previousState) => {
        if (previousState.summonerList.length >= maxAllowed) {
          return previousState;
        }
        const updatedList = [...previousState.summonerList, newSummonerItem];

        // Persist to Supabase if logged in
        if (isLoggedIn && user?.id) {
          addV3SummonerToSupabase(
            user.id,
            newId,
            trimmedName,
            powerScoreToUse,
            previousState.summonerList.length,
          ).catch((err) => console.error("Error adding summoner to Supabase:", err));
        }

        return {
          ...previousState,
          summonerList: updatedList,
        };
      });

      return true;
    },
    [isLoggedIn, user?.id, persistedState.summonerList.length],
  );

  const handleUpdateSummoner = useCallback(
    (targetId: string, updatedName: string, updatedPowerScore: number) => {
      const trimmedName = updatedName.trim();
      if (!trimmedName) {
        return;
      }

      const clampedPowerScore = Math.min(
        10,
        Math.max(1, Math.round(Number(updatedPowerScore) || 5)),
      );

      setPersistedState((previousState) => {
        const updatedList = previousState.summonerList.map((summonerItem) => {
          if (summonerItem.id === targetId) {
            return {
              ...summonerItem,
              name: trimmedName,
              powerScore: clampedPowerScore,
            };
          }
          return summonerItem;
        });

        if (isLoggedIn && user?.id) {
          updateV3SummonerInSupabase(user.id, targetId, trimmedName, clampedPowerScore).catch(
            (err) => console.error("Error updating summoner in Supabase:", err),
          );
        }

        return {
          ...previousState,
          summonerList: updatedList,
        };
      });
    },
    [isLoggedIn, user?.id],
  );

  const handleDeleteSummoner = useCallback(
    (targetId: string) => {
      setPersistedState((previousState) => {
        const filteredList = previousState.summonerList.filter((summonerItem) => {
          return summonerItem.id !== targetId;
        });

        if (isLoggedIn && user?.id) {
          deleteV3SummonerFromSupabase(user.id, targetId)
            .then(() => syncV3SummonersOrderToSupabase(user.id, filteredList))
            .catch((err) => console.error("Error deleting summoner from Supabase:", err));
        }

        return {
          ...previousState,
          summonerList: filteredList,
        };
      });
    },
    [isLoggedIn, user?.id],
  );

  const handleClearAllSummoners = useCallback(() => {
    setPersistedState((previousState) => {
      if (isLoggedIn && user?.id) {
        clearAllV3SummonersFromSupabase(user.id).catch((err) =>
          console.error("Error clearing summoners from Supabase:", err),
        );
      }
      return {
        ...previousState,
        summonerList: [],
      };
    });
  }, [isLoggedIn, user?.id]);

  const handleResetSampleSummoners = useCallback(() => {
    setPersistedState((previousState) => {
      if (isLoggedIn && user?.id) {
        clearAllV3SummonersFromSupabase(user.id)
          .then(() => syncV3SummonersOrderToSupabase(user.id, V3_INITIAL_SAMPLE_SUMMONERS))
          .catch((err) => console.error("Error resetting sample summoners in Supabase:", err));
      }
      return {
        ...previousState,
        summonerList: V3_INITIAL_SAMPLE_SUMMONERS,
      };
    });
  }, [isLoggedIn, user?.id]);

  // Primary Shuffle Team & Match creation execution logic
  const commitMatchOutcome = useCallback(
    (outcome: { matchResult: V3MatchResult; updatedActiveSummoners?: V3Summoner[] }) => {
      setPersistedState((previousState) => {
        if (isLoggedIn && user?.id) {
          addV3MatchResultToSupabase(user.id, outcome.matchResult).catch((err) =>
            console.error("Error adding match result to Supabase:", err),
          );
        }
        return {
          ...previousState,
          matchResults: [...previousState.matchResults, outcome.matchResult],
        };
      });
    },
    [isLoggedIn, user?.id],
  );

  const handleShuffleTeams = useCallback(() => {
    if (persistedState.summonerList.length === 0) return;

    const outcome = createV3MatchResult(
      persistedState.summonerList,
      persistedState.settings,
      championPool,
    );

    if (!outcome) return;

    // Find the first lane index that has at least 1 player assigned
    const firstActiveLaneIndex = outcome.matchResult.lanes.findIndex(
      (lane) => lane.bluePlayer !== null || lane.redPlayer !== null,
    );

    if (
      persistedState.settings.isSkipAnimationEnabled ||
      persistedState.settings.animationDurationSeconds <= 0 ||
      firstActiveLaneIndex === -1
    ) {
      commitMatchOutcome(outcome);
    } else {
      setPendingOutcome(outcome);
      setAnimatingLaneIdx(firstActiveLaneIndex);
    }
  }, [persistedState.summonerList, persistedState.settings, championPool, commitMatchOutcome]);

  const handleLaneComplete = useCallback(() => {
    if (!pendingOutcome) return;

    const lanes = pendingOutcome.matchResult.lanes;
    // Find the next lane index after animatingLaneIdx that has at least 1 player assigned
    let nextActiveIndex = -1;
    for (let index = animatingLaneIdx + 1; index < lanes.length; index++) {
      if (lanes[index].bluePlayer !== null || lanes[index].redPlayer !== null) {
        nextActiveIndex = index;
        break;
      }
    }

    if (nextActiveIndex !== -1) {
      setAnimatingLaneIdx(nextActiveIndex);
    } else {
      commitMatchOutcome(pendingOutcome);
      setPendingOutcome(null);
      setAnimatingLaneIdx(-1);
    }
  }, [pendingOutcome, animatingLaneIdx, commitMatchOutcome]);

  const handleStopShuffle = useCallback(() => {
    setPendingOutcome(null);
    setAnimatingLaneIdx(-1);
  }, []);

  const handleDeleteMatchResult = useCallback(
    (targetMatchId: string) => {
      setPersistedState((previousState) => {
        if (isLoggedIn && user?.id) {
          deleteV3MatchResultFromSupabase(user.id, targetMatchId).catch((err) =>
            console.error("Error deleting match result from Supabase:", err),
          );
        }
        return {
          ...previousState,
          matchResults: previousState.matchResults.filter((item) => item.id !== targetMatchId),
        };
      });
    },
    [isLoggedIn, user?.id],
  );

  const handleClearAllMatchResults = useCallback(() => {
    setPersistedState((previousState) => {
      if (isLoggedIn && user?.id) {
        clearAllV3MatchResultsFromSupabase(user.id).catch((err) =>
          console.error("Error clearing match results from Supabase:", err),
        );
      }
      return {
        ...previousState,
        matchResults: [],
      };
    });
  }, [isLoggedIn, user?.id]);

  // Settings Handlers & Dependency Rules
  const saveSettingsHelper = useCallback(
    (nextSettings: V3Settings) => {
      if (isLoggedIn && user?.id) {
        saveV3SettingsToSupabase(user.id, nextSettings).catch((err) =>
          console.error("Error saving settings to Supabase:", err),
        );
      }
    },
    [isLoggedIn, user?.id],
  );

  const handleTogglePowerEvaluate = useCallback(
    (isEnabled: boolean) => {
      setPersistedState((previousState) => {
        const nextSettings = {
          ...previousState.settings,
          isEvaluatePowerEnabled: isEnabled,
          isShuffleTeamEnabled: isEnabled ? true : previousState.settings.isShuffleTeamEnabled,
        };

        saveSettingsHelper(nextSettings);

        if (isEnabled && previousState.summonerList.length >= 2) {
          const activeSummoners = previousState.summonerList.slice(0, 10);
          const inactiveSummoners = previousState.summonerList.slice(10);
          const balancedResult = calculateV3PowerBalancedTeams(
            activeSummoners,
            nextSettings.defaultRoles,
            nextSettings.neverSameTeam,
          );

          if (balancedResult) {
            const nextSummonerList = [...balancedResult.interleavedSummoners, ...inactiveSummoners];

            if (isLoggedIn && user?.id) {
              syncV3SummonersOrderToSupabase(user.id, nextSummonerList).catch((err) =>
                console.error("Error syncing summoner order to Supabase:", err),
              );
            }

            return {
              ...previousState,
              settings: nextSettings,
              summonerList: nextSummonerList,
              laneResults: balancedResult.lanePairings,
            };
          }
        }

        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper, isLoggedIn, user?.id],
  );

  const handleToggleShuffleTeam = useCallback(
    (isEnabled: boolean) => {
      setPersistedState((previousState) => {
        if (previousState.settings.isEvaluatePowerEnabled) {
          return previousState;
        }
        const nextSettings = {
          ...previousState.settings,
          isShuffleTeamEnabled: isEnabled,
        };
        saveSettingsHelper(nextSettings);
        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper],
  );

  const handleToggleSkipAnimation = useCallback(
    (isEnabled: boolean) => {
      setPersistedState((previousState) => {
        const nextSettings = {
          ...previousState.settings,
          isSkipAnimationEnabled: isEnabled,
          animationDurationSeconds: isEnabled
            ? 0
            : previousState.settings.animationDurationSeconds || 2,
        };
        saveSettingsHelper(nextSettings);
        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper],
  );

  const handleChangeAnimationDurationSeconds = useCallback(
    (seconds: number) => {
      const clampedSeconds = Math.min(2.5, Math.max(0, seconds));
      setPersistedState((previousState) => {
        const nextSettings = {
          ...previousState.settings,
          animationDurationSeconds: clampedSeconds,
          isSkipAnimationEnabled: clampedSeconds === 0,
        };
        saveSettingsHelper(nextSettings);
        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper],
  );

  const handleChangeDefaultRoles = useCallback(
    (nextDefaultRoles: DefaultRoleConfig) => {
      setPersistedState((previousState) => {
        const nextSettings = {
          ...previousState.settings,
          defaultRoles: nextDefaultRoles,
        };
        saveSettingsHelper(nextSettings);
        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper],
  );

  const handleChangeNeverSameTeam = useCallback(
    (pair: ExclusionPair | null) => {
      setPersistedState((previousState) => {
        const nextSettings = {
          ...previousState.settings,
          neverSameTeam: pair,
        };
        saveSettingsHelper(nextSettings);
        return {
          ...previousState,
          settings: nextSettings,
        };
      });
    },
    [saveSettingsHelper],
  );

  const handleSwapSummonerPositions = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) {
        return;
      }

      setPersistedState((previousState) => {
        const newList = [...previousState.summonerList];
        const sourceItem = newList[sourceIndex];
        const targetItem = newList[targetIndex];

        if (!sourceItem) {
          return previousState;
        }

        if (!targetItem) {
          newList.splice(sourceIndex, 1);
          newList.splice(targetIndex, 0, sourceItem);
        } else {
          newList[sourceIndex] = targetItem;
          newList[targetIndex] = sourceItem;
        }

        if (isLoggedIn && user?.id) {
          syncV3SummonersOrderToSupabase(user.id, newList).catch((err) =>
            console.error("Error syncing summoners order to Supabase:", err),
          );
        }

        return {
          ...previousState,
          summonerList: newList,
        };
      });
    },
    [isLoggedIn, user?.id],
  );

  const handleDragStart = useCallback((sourceIndex: number) => {
    setDraggedSourceIndex(sourceIndex);
  }, []);

  const handleDragOverTarget = useCallback((targetIndex: number) => {
    setPreviewDropTargetIndex(targetIndex);
  }, []);

  const handleDragEndOrLeave = useCallback(() => {
    setPreviewDropTargetIndex(null);
  }, []);

  const handleDropOnTarget = useCallback(
    (targetIndex: number) => {
      if (draggedSourceIndex !== null && draggedSourceIndex !== targetIndex) {
        handleSwapSummonerPositions(draggedSourceIndex, targetIndex);
      }
      setDraggedSourceIndex(null);
      setPreviewDropTargetIndex(null);
    },
    [draggedSourceIndex, handleSwapSummonerPositions],
  );

  // Requirement 3: Logout Flow helper
  const handleLogout = useCallback(async () => {
    try {
      // 1. Save current state to LocalStorage
      localStorage.setItem(V3_STORAGE_KEY, JSON.stringify(persistedState));
      // 2. Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }, [persistedState]);

  return {
    isLoggedIn: isLoggedIn,
    user: user,
    summonerList: persistedState.summonerList,
    settings: persistedState.settings,
    laneResults: persistedState.laneResults,
    matchResults: persistedState.matchResults,
    draggedSourceIndex: draggedSourceIndex,
    previewDropTargetIndex: previewDropTargetIndex,
    isShufflingAnimation: isShufflingAnimation,
    pendingOutcome: pendingOutcome,
    animatingLaneIdx: animatingLaneIdx,
    championPool: championPool,
    handleAddSummoner: handleAddSummoner,
    handleUpdateSummoner: handleUpdateSummoner,
    handleDeleteSummoner: handleDeleteSummoner,
    handleClearAllSummoners: handleClearAllSummoners,
    handleResetSampleSummoners: handleResetSampleSummoners,
    handleShuffleTeams: handleShuffleTeams,
    handleLaneComplete: handleLaneComplete,
    handleStopShuffle: handleStopShuffle,
    handleDeleteMatchResult: handleDeleteMatchResult,
    handleClearAllMatchResults: handleClearAllMatchResults,
    handleTogglePowerEvaluate: handleTogglePowerEvaluate,
    handleToggleShuffleTeam: handleToggleShuffleTeam,
    handleToggleSkipAnimation: handleToggleSkipAnimation,
    handleChangeAnimationDurationSeconds: handleChangeAnimationDurationSeconds,
    handleChangeDefaultRoles: handleChangeDefaultRoles,
    handleChangeNeverSameTeam: handleChangeNeverSameTeam,
    handleDragStart: handleDragStart,
    handleDragOverTarget: handleDragOverTarget,
    handleDragEndOrLeave: handleDragEndOrLeave,
    handleDropOnTarget: handleDropOnTarget,
    handleLogout: handleLogout,
  };
};
