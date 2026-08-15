import { supabase } from "@/utils/supabase";
import type { V3Summoner, V3Settings, V3MatchResult } from "@/features/v3/types/v3Types";
import { V3_DEFAULT_SETTINGS } from "@/features/v3/constants/v3Constants";

export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function fetchV3DataFromSupabase(userId: string): Promise<{
  settings: V3Settings;
  summonerList: V3Summoner[];
  matchResults: V3MatchResult[];
}> {
  let settings: V3Settings = V3_DEFAULT_SETTINGS;
  let summonerList: V3Summoner[] = [];
  let matchResults: V3MatchResult[] = [];

  // 1. Fetch Settings
  try {
    const { data: settingsRows, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    const settingsData = settingsRows && settingsRows.length > 0 ? settingsRows[0] : null;

    if (settingsError) {
      console.error("Error fetching settings from Supabase:", settingsError);
    } else if (!settingsData) {
      // Insert default settings for new user
      const defaultPayload: Record<string, any> = {
        id: crypto.randomUUID(),
        user_id: userId,
        is_evaluate_power_enabled: V3_DEFAULT_SETTINGS.isEvaluatePowerEnabled,
        is_shuffle_team_enabled: V3_DEFAULT_SETTINGS.isShuffleTeamEnabled,
        is_skip_animation_enabled: V3_DEFAULT_SETTINGS.isSkipAnimationEnabled,
        animation_duration: V3_DEFAULT_SETTINGS.animationDurationSeconds,
        default_roles: V3_DEFAULT_SETTINGS.defaultRoles,
        never_same_team: V3_DEFAULT_SETTINGS.neverSameTeam,
      };

      let { data: newSettings, error: insertError } = await supabase
        .from("settings")
        .insert(defaultPayload)
        .select()
        .maybeSingle();

      if (insertError && insertError.message?.includes("column")) {
        delete defaultPayload.animation_duration;
        const retry = await supabase.from("settings").insert(defaultPayload).select().maybeSingle();
        newSettings = retry.data;
        insertError = retry.error;
      }

      if (insertError) {
        console.error("Error creating default settings in Supabase:", insertError);
      } else if (newSettings) {
        const animDuration =
          typeof newSettings.animation_duration === "number"
            ? newSettings.animation_duration
            : typeof newSettings.animation_duration_seconds === "number"
              ? newSettings.animation_duration_seconds
              : typeof newSettings.animation_seconds === "number"
                ? newSettings.animation_seconds
                : 2;

        settings = {
          isEvaluatePowerEnabled: newSettings.is_evaluate_power_enabled ?? false,
          isShuffleTeamEnabled: newSettings.is_shuffle_team_enabled ?? false,
          isSkipAnimationEnabled: newSettings.is_skip_animation_enabled ?? false,
          animationDurationSeconds: animDuration,
          defaultRoles: newSettings.default_roles || V3_DEFAULT_SETTINGS.defaultRoles,
          neverSameTeam: newSettings.never_same_team || null,
        };
      }
    } else {
      const animDuration =
        typeof settingsData.animation_duration === "number"
          ? settingsData.animation_duration
          : typeof settingsData.animation_duration_seconds === "number"
            ? settingsData.animation_duration_seconds
            : typeof settingsData.animation_seconds === "number"
              ? settingsData.animation_seconds
              : 2;

      settings = {
        isEvaluatePowerEnabled: settingsData.is_evaluate_power_enabled ?? false,
        isShuffleTeamEnabled: settingsData.is_shuffle_team_enabled ?? false,
        isSkipAnimationEnabled: settingsData.is_skip_animation_enabled ?? false,
        animationDurationSeconds: animDuration,
        defaultRoles: settingsData.default_roles || V3_DEFAULT_SETTINGS.defaultRoles,
        neverSameTeam: settingsData.never_same_team || null,
      };
    }
  } catch (err) {
    console.error("Failed to fetch/initialize settings from Supabase:", err);
  }

  // 2. Fetch Summoners (ordered by sort_order ASC, max 20)
  try {
    const { data: summonersData, error: summonersError } = await supabase
      .from("summoners")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .limit(20);

    if (summonersError) {
      console.error("Error fetching summoners from Supabase:", summonersError);
    } else if (summonersData) {
      summonerList = summonersData.map((row) => ({
        id: row.id,
        name: row.name,
        powerScore: row.power_score ?? 5,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch summoners from Supabase:", err);
  }

  // 3. Fetch Match Results
  try {
    const { data: matchData, error: matchError } = await supabase
      .from("match_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (matchError) {
      console.error("Error fetching match_results from Supabase:", matchError);
    } else if (matchData) {
      matchResults = matchData.map((row) => {
        let createdAtDisplay = row.created_at;
        try {
          const date = new Date(row.created_at);
          if (!isNaN(date.getTime())) {
            createdAtDisplay = date.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          }
        } catch {
          // ignore
        }
        return {
          id: row.id,
          createdAt: createdAtDisplay,
          lanes: row.lanes ?? [],
          blueTotalPower: row.blue_total_power ?? 0,
          redTotalPower: row.red_total_power ?? 0,
          powerDiff: row.power_diff ?? 0,
          isPowerEvaluateActive:
            row.is_power_evaluate ?? row.is_evaluate_power ?? row.is_power_evaluate_active ?? false,
        };
      });
    }
  } catch (err) {
    console.error("Failed to fetch match_results from Supabase:", err);
  }

  return {
    settings,
    summonerList,
    matchResults,
  };
}

export async function saveV3SettingsToSupabase(
  userId: string,
  settings: V3Settings,
): Promise<boolean> {
  try {
    const { data: existingRows } = await supabase
      .from("settings")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    const payload: Record<string, any> = {
      user_id: userId,
      is_evaluate_power_enabled: settings.isEvaluatePowerEnabled,
      is_shuffle_team_enabled: settings.isShuffleTeamEnabled,
      is_skip_animation_enabled: settings.isSkipAnimationEnabled,
      animation_duration: settings.animationDurationSeconds,
      default_roles: settings.defaultRoles,
      never_same_team: settings.neverSameTeam,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      let { error } = await supabase.from("settings").update(payload).eq("id", existing.id);
      if (error && error.message?.includes("column")) {
        if (error.message.includes("animation_duration")) {
          delete payload.animation_duration;
        }
        const retry = await supabase.from("settings").update(payload).eq("id", existing.id);
        error = retry.error;
      }
      if (error) {
        console.error("Error updating settings in Supabase:", error);
        return false;
      }
    } else {
      let { error } = await supabase.from("settings").insert({
        id: crypto.randomUUID(),
        ...payload,
      });
      if (error && error.message?.includes("column")) {
        if (error.message.includes("animation_duration")) {
          delete payload.animation_duration;
        }
        const retry = await supabase.from("settings").insert({
          id: crypto.randomUUID(),
          ...payload,
        });
        error = retry.error;
      }
      if (error) {
        console.error("Error inserting settings in Supabase:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to save settings to Supabase:", err);
    return false;
  }
}

export async function addV3SummonerToSupabase(
  userId: string,
  id: string,
  name: string,
  powerScore: number,
  sortOrder: number,
): Promise<V3Summoner | null> {
  try {
    const { data, error } = await supabase
      .from("summoners")
      .insert({
        id,
        user_id: userId,
        name,
        power_score: powerScore,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error adding summoner to Supabase:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      powerScore: data.power_score ?? 100,
    };
  } catch (err) {
    console.error("Failed to add summoner to Supabase:", err);
    return null;
  }
}

export async function updateV3SummonerInSupabase(
  userId: string,
  targetId: string,
  name: string,
  powerScore: number,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("summoners")
      .update({
        name,
        power_score: powerScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating summoner in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to update summoner in Supabase:", err);
    return false;
  }
}

export async function deleteV3SummonerFromSupabase(
  userId: string,
  targetId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("summoners")
      .delete()
      .eq("id", targetId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting summoner from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to delete summoner from Supabase:", err);
    return false;
  }
}

export async function clearAllV3SummonersFromSupabase(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("summoners").delete().eq("user_id", userId);
    if (error) {
      console.error("Error clearing summoners from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to clear summoners from Supabase:", err);
    return false;
  }
}

export async function syncV3SummonersOrderToSupabase(
  userId: string,
  summoners: V3Summoner[],
): Promise<boolean> {
  try {
    const limitedSummoners = summoners.slice(0, 20);
    const rows = limitedSummoners.map((s, index) => ({
      id: isValidUuid(s.id) ? s.id : crypto.randomUUID(),
      user_id: userId,
      name: s.name,
      power_score: s.powerScore,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("summoners").upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Error syncing summoners order to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to sync summoners order to Supabase:", err);
    return false;
  }
}

export async function addV3MatchResultToSupabase(
  userId: string,
  matchResult: V3MatchResult,
): Promise<V3MatchResult | null> {
  try {
    const id = isValidUuid(matchResult.id) ? matchResult.id : crypto.randomUUID();
    const payload: Record<string, any> = {
      id,
      user_id: userId,
      lanes: matchResult.lanes,
      blue_total_power: matchResult.blueTotalPower,
      red_total_power: matchResult.redTotalPower,
      power_diff: matchResult.powerDiff,
      is_power_evaluate: matchResult.isPowerEvaluateActive,
      created_at: new Date().toISOString(),
    };

    let { data, error } = await supabase.from("match_results").insert(payload).select().single();

    if (error && error.message?.includes("column")) {
      if (error.message.includes("lanes")) {
        delete payload.lanes;
      }
      if (error.message.includes("is_power_evaluate")) {
        delete payload.is_power_evaluate;
        payload.is_evaluate_power = matchResult.isPowerEvaluateActive;
      }
      const retry = await supabase.from("match_results").insert(payload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.error("Error adding match result to Supabase:", error);
      return null;
    }

    return {
      id: data.id,
      createdAt: data.created_at,
      lanes: data.lanes || matchResult.lanes || [],
      blueTotalPower: data.blue_total_power ?? 0,
      redTotalPower: data.red_total_power ?? 0,
      powerDiff: data.power_diff ?? 0,
      isPowerEvaluateActive:
        data.is_power_evaluate ?? data.is_evaluate_power ?? matchResult.isPowerEvaluateActive,
    };
  } catch (err) {
    console.error("Failed to add match result to Supabase:", err);
    return null;
  }
}

export async function deleteV3MatchResultFromSupabase(
  userId: string,
  targetMatchId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("match_results")
      .delete()
      .eq("id", targetMatchId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting match result from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to delete match result from Supabase:", err);
    return false;
  }
}

export async function clearAllV3MatchResultsFromSupabase(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("match_results").delete().eq("user_id", userId);
    if (error) {
      console.error("Error clearing match results from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to clear match results from Supabase:", err);
    return false;
  }
}
