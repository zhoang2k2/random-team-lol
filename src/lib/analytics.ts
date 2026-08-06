/**
 * Type-safe Google Analytics 4 wrapper.
 *
 * Usage:
 *   import { trackEvent, trackPageView } from "@/lib/analytics";
 *   trackEvent("shuffle_team", { version: "v2", member_count: 6 });
 */

const GA_ID = "G-RCE35Y29CN";

// ── gtag type declaration ─────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ── Safe gtag caller — no-ops if gtag hasn't loaded yet ───────────────────────

const gtag = (...args: unknown[]): void => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
};

// ── Page view ─────────────────────────────────────────────────────────────────

export const trackPageView = (path: string, title?: string): void => {
  gtag("config", GA_ID, {
    page_path: path,
    page_title: title,
    send_page_view: true,
  });
};

// ── Event definitions ─────────────────────────────────────────────────────────

type EventParams = Record<string, string | number | boolean | undefined>;

export const trackEvent = (eventName: AppEvent, params?: EventParams): void => {
  gtag("event", eventName, params);
};

/**
 * All custom events tracked across the app.
 * Add new events here — one place to document what we track.
 */
export type AppEvent =
  // ── Shuffle ──────────────────────────────────────────────────────────────
  | "shuffle_team"          // user clicks Shuffle
  | "shuffle_stop"          // user clicks Stop during animation
  | "shuffle_clear"         // user clicks Clear results
  | "shuffle_delete_round"  // user deletes a single round
  | "shuffle_screenshot"    // user captures screenshot
  // ── Summoners ────────────────────────────────────────────────────────────
  | "summoner_add"          // summoner added
  | "summoner_remove"       // summoner removed
  | "summoner_rename"       // summoner name changed
  // ── Settings ─────────────────────────────────────────────────────────────
  | "setting_toggle"        // any toggle changed
  // ── Navigation ───────────────────────────────────────────────────────────
  | "page_view";            // used internally by trackPageView; listed for completeness

// ── Convenience helpers ───────────────────────────────────────────────────────

export const analytics = {
  // Shuffle
  shuffleTeam: (params: { version: "v1" | "v2"; member_count: number; skip_animation: boolean }) =>
    trackEvent("shuffle_team", params),

  shuffleStop: (params: { version: "v1" | "v2" }) =>
    trackEvent("shuffle_stop", params),

  shuffleClear: (params: { version: "v1" | "v2" }) =>
    trackEvent("shuffle_clear", params),

  deleteRound: (params: { version: "v1" | "v2"; round_number: number }) =>
    trackEvent("shuffle_delete_round", params),

  screenshot: (params: { version: "v1" | "v2" }) =>
    trackEvent("shuffle_screenshot", params),

  // Summoners
  summonerAdd: (params: { version: "v1" | "v2"; total: number }) =>
    trackEvent("summoner_add", params),

  summonerRemove: (params: { version: "v1" | "v2"; total: number }) =>
    trackEvent("summoner_remove", params),

  summonerRename: (params: { version: "v2" }) =>
    trackEvent("summoner_rename", params),

  // Settings
  settingToggle: (params: { version: "v1" | "v2"; setting: string; value: boolean }) =>
    trackEvent("setting_toggle", params),
} as const;
