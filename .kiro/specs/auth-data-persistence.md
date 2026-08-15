# Auth & Data Persistence Specification

## 1. Overview & Goal

Implement authentication-aware data persistence for Version 3 (V3) of Random LOL.
The system dynamically switches persistence layer based on user authentication state:

- **Anonymous Mode**: `localStorage` as sole source of truth (`v3-store-v1`).
- **Authenticated Mode**: Supabase database as sole source of truth (`summoners`, `settings`, `match_results`).

## 2. Persistence Modes & Data Rules

### Anonymous User (Unauthenticated)

- **Source of Truth**: `localStorage` (`v3-store-v1`).
- **Scope**: Summoner list, settings, match results.
- **Rules**:
  - No database calls to Supabase.
  - Maximum 10 summoners allowed in guest/anonymous mode.

### Authenticated User (Logged In)

- **Source of Truth**: Supabase PostgreSQL database.
- **Scope**:
  - `public.summoners` (max 20 per user)
  - `public.settings` (1 row per user)
  - `public.match_results` (history logs per user)
- **Rules**:
  - `localStorage` (`v3-store-v1`) is cleared immediately upon successful login.
  - No automatic bidirectional merging between `localStorage` and Supabase.
  - All read and write operations query/update Supabase directly using `auth.uid()`.

## 3. Auth Lifecycle & Flow

### Login Flow

1. User completes login via Supabase Auth (e.g. Google OAuth).
2. Upon `SIGNED_IN` or active auth state detection:
   - Clear `v3-store-v1` from `localStorage`.
   - Load user records from Supabase (`summoners`, `settings`, `match_results`).
   - If user has no existing `settings` in Supabase: insert default settings record.
   - If user has no existing `summoners`: initialize with empty array.
   - If user has no existing `match_results`: initialize with empty array.
   - Initialize application state with Supabase data.
3. Subsequent state mutations persist directly to Supabase.

### Logout Flow

1. Capture current in-memory application state (`summonerList`, `settings`, `matchResults`).
2. Save current state to `localStorage` under key `v3-store-v1`.
3. Execute `supabase.auth.signOut()`.
4. Switch application state to anonymous mode (relying on `localStorage`).

## 4. Supabase Schema Mapping

| App State      | Supabase Table         | Key Fields / Columns                                                                                                                                                                                                              |
| :------------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `summonerList` | `public.summoners`     | `id` (uuid), `user_id` (uuid), `name` (text), `power_score` (int4), `sort_order` (int4)                                                                                                                                           |
| `settings`     | `public.settings`      | `id` (uuid), `user_id` (uuid, unique), `is_evaluate_power_enabled` (bool), `is_shuffle_team_enabled` (bool), `is_skip_animation_enabled` (bool), `animation_duration` (numeric), `default_roles` (json), `never_same_team` (json) |
| `matchResults` | `public.match_results` | `id` (uuid), `user_id` (uuid), `blue_total_power` (int4), `red_total_power` (int4), `power_diff` (int4), `is_power_evaluate` (bool)                                                                                               |

_Note: `laneResults` remains in-memory only and is not persisted to Supabase in this phase._

## 5. Constraints & Error Handling

- **Summoner Limit**: Maximum 20 summoners per authenticated user (`sort_order` preserved).
- **RLS**: Row-Level Security enforced via `auth.uid() = user_id`.
- **Failure Resilience**: If database fetch fails, do not overwrite state with empty data. Maintain current state and surface error notifications if available.
