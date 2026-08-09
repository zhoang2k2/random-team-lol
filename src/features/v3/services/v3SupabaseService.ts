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
  // 1. Fetch Settings
  const { data: settingsData, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) {
    console.error("Error fetching settings from Supabase:", settingsError);
    throw settingsError;
  }

  let settings: V3Settings = V3_DEFAULT_SETTINGS;

  if (!settingsData) {
    // Insert default settings for new user
    const { data: newSettings, error: insertError } = await supabase
      .from("settings")
      .insert({
        user_id: userId,
        is_evaluate_power_enabled: V3_DEFAULT_SETTINGS.isEvaluatePowerEnabled,
        is_shuffle_team_enabled: V3_DEFAULT_SETTINGS.isShuffleTeamEnabled,
        is_skip_animation_enabled: V3_DEFAULT_SETTINGS.isSkipAnimationEnabled,
        animation_duration: V3_DEFAULT_SETTINGS.animationDurationSeconds,
        default_roles: V3_DEFAULT_SETTINGS.defaultRoles,
        never_same_team: V3_DEFAULT_SETTINGS.neverSameTeam,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Error creating default settings in Supabase:", insertError);
    } else if (newSettings) {
      settings = {
        isEvaluatePowerEnabled: newSettings.is_evaluate_power_enabled ?? false,
        isShuffleTeamEnabled: newSettings.is_shuffle_team_enabled ?? false,
        isSkipAnimationEnabled: newSettings.is_skip_animation_enabled ?? false,
        animationDurationSeconds: Number(newSettings.animation_duration) || 2,
        defaultRoles: newSettings.default_roles || V3_DEFAULT_SETTINGS.defaultRoles,
        neverSameTeam: newSettings.never_same_team || null,
      };
    }
  } else {
    settings = {
      isEvaluatePowerEnabled: settingsData.is_evaluate_power_enabled ?? false,
      isShuffleTeamEnabled: settingsData.is_shuffle_team_enabled ?? false,
      isSkipAnimationEnabled: settingsData.is_skip_animation_enabled ?? false,
      animationDurationSeconds: Number(settingsData.animation_duration) || 2,
      defaultRoles: settingsData.default_roles || V3_DEFAULT_SETTINGS.defaultRoles,
      neverSameTeam: settingsData.never_same_team || null,
    };
  }

  // 2. Fetch Summoners (ordered by sort_order ASC, max 20)
  const { data: summonersData, error: summonersError } = await supabase
    .from("summoners")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .limit(20);

  if (summonersError) {
    console.error("Error fetching summoners from Supabase:", summonersError);
    throw summonersError;
  }

  const summonerList: V3Summoner[] = (summonersData || []).map((row) => ({
    id: row.id,
    name: row.name,
    powerScore: row.power_score ?? 100,
  }));

  // 3. Fetch Match Results
  const { data: matchData, error: matchError } = await supabase
    .from("match_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (matchError) {
    console.error("Error fetching match_results from Supabase:", matchError);
    throw matchError;
  }

  const matchResults: V3MatchResult[] = (matchData || []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    lanes: [],
    blueTotalPower: row.blue_total_power ?? 0,
    redTotalPower: row.red_total_power ?? 0,
    powerDiff: row.power_diff ?? 0,
    isPowerEvaluate: row.is_power_evaluate ?? false,
  }));

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
    const { error } = await supabase.from("settings").upsert(
      {
        user_id: userId,
        is_evaluate_power_enabled: settings.isEvaluatePowerEnabled,
        is_shuffle_team_enabled: settings.isShuffleTeamEnabled,
        is_skip_animation_enabled: settings.isSkipAnimationEnabled,
        animation_duration: settings.animationDurationSeconds,
        default_roles: settings.defaultRoles,
        never_same_team: settings.neverSameTeam,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("Error saving settings to Supabase:", error);
      return false;
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
    const { data, error } = await supabase
      .from("match_results")
      .insert({
        id,
        user_id: userId,
        blue_total_power: matchResult.blueTotalPower,
        red_total_power: matchResult.redTotalPower,
        power_diff: matchResult.powerDiff,
        is_power_evaluate: matchResult.isPowerEvaluate,
        created_at: matchResult.createdAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error adding match result to Supabase:", error);
      return null;
    }

    return {
      id: data.id,
      createdAt: data.created_at,
      lanes: matchResult.lanes || [],
      blueTotalPower: data.blue_total_power ?? 0,
      redTotalPower: data.red_total_power ?? 0,
      powerDiff: data.power_diff ?? 0,
      isPowerEvaluate: data.is_power_evaluate ?? false,
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
