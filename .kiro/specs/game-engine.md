# Game Engine Spec — Random Team LOL

> **Mục đích:** Nguồn sự thật duy nhất cho logic, tính năng, và kiến trúc của app.  
> Dùng file này để remind AI khi làm V3 hoặc bất kỳ version mới nào.  
> **Không overwrite — chỉ append thêm version mới bên dưới.**

---

## 0. Toàn bộ tính năng hiện tại (checklist)

Danh sách **tất cả tính năng đang hoạt động**. Khi làm version mới, dùng checklist này để không bỏ sót.

### 0.1 Summoner Management

- [x] Add summoner — input text + Enter hoặc button Add
- [x] Max 10 summoners — disable input khi đạt max
- [x] Duplicate check — không cho thêm tên trùng
- [x] Remove summoner — xoá single summoner, auto-clean exclusions + defaultRoles liên quan
- [x] Clear all summoners — confirm dialog trước khi xoá hết
- [x] Rename summoner — inline edit tên (V2 only; auto-sync exclusion pair)
- [x] Team column assignment — auto-assign alpha/beta khi add (V1); flat list + reorder (V2)
- [x] Drag & drop reorder — @dnd-kit/sortable 2-col grid (V2); @dnd-kit/core swap alpha/beta slots (V1)
- [x] Summoner skeleton — loading placeholder 600ms khi hydrate từ localStorage (V1 only)
- [x] Hide/show summoner list — toggle visibility (V1 only)
- [x] Power scoring — mỗi summoner có số điểm 0–1000 (V2 only)
- [x] Power input subitem — input ngay dưới item, hiện khi Evaluate Power bật (V2 only)

### 0.2 Settings

- [x] Shuffle team toggle — random thứ tự summoner khi shuffle
- [x] Skip animation toggle — hiện kết quả ngay, bỏ qua lane animation
- [x] Animation speed — V1: laneSeconds 2–30s (commented); V2: animationSeconds 0–2.5s
- [x] Default role picker — gán vai trò mặc định (TOP/JG/MID/ADC/SUP)
  - [x] Auto-fill: còn 1 slot trống + 1 người chưa assign → tự điền
  - [x] Conflict prevention: không cho chọn người đã assigned ở slot khác
  - [x] Max lanes guard: disable role khi đủ số lane
  - [x] Clear button
- [x] Never on the same team / Exclusion pairs
  - [x] V1: multiple pairs (N cặp), button + để thêm, list hiển thị tất cả
  - [x] V2: single pair (1 cặp), không có button thêm
  - [x] Auto-remove khi xoá summoner liên quan
- [x] Evaluate Power (V2 only)
  - [x] Bật → force Shuffle Team = true, disable toggle Shuffle Team
  - [x] Power balance preview: alpha/beta teams + tổng điểm + diff
  - [x] Diff color: xanh=0, vàng≤2, đỏ>2
  - [x] Algorithm: greedy snake-draft (sort desc power, assign to lower-total team)

### 0.3 Shuffle Engine

- [x] Team pairing — buildLanePairings() với exclusions, defaultRoles, up to 1000 attempts
- [x] Interleave order — alpha[0], beta[0], alpha[1], beta[1]... cho manual order (V1)
- [x] Power-balanced order — balanceByPower() + interleaveTeams() (V2)
- [x] Lane animation — LaneRow reveal từng lane, gap 1000ms giữa các lane
- [x] Champion dedup — không pick lại champion đã dùng cross-rounds; reset khi pool cạn
- [x] Champion fetch — getAllChampions() từ Riot Data Dragon, module-level cache
- [x] Skip animation mode — revealed = lanes.length ngay khi tạo round
- [x] Stop shuffle — cancel mid-animation, xoá round chưa hoàn thành khỏi list
- [x] Multiple rounds — mỗi Shuffle tạo thêm Round mới, không overwrite
- [x] Round counter display — "Shuffle — Round N" trên button
- [x] canShuffle guard — members >= 2 && champions loaded && !shuffling
- [x] isTeamEmpty guard — validate alpha + beta không rỗng khi shuffleTeam=false (V1 only)
- [x] teamSize auto-calc — min(5, ceil(members/2)), auto-bump khi dưới minimum (V1)
- [x] Scroll behavior — scroll đến arena khi bắt đầu, scroll đến results khi xong (V1 only)
- [x] Jade*\* filter — lọc bỏ champion variants với prefix "Jade*" trong Data Dragon response

### 0.4 Result Display

- [x] Per-round table — mỗi Round là bảng riêng với header "Round N"
- [x] Champion portrait — ảnh 48x48 avatar
- [x] Champion name + title — tên và title champion
- [x] Role icon — SVG với glow effect
- [x] Team color + glow — Alpha (--team-alpha) / Beta (--team-beta) với text-shadow
- [x] Progressive reveal — chỉ hiện lanes đã revealed
- [x] "Drafting lane X/N" — indicator khi animation đang chạy
- [x] Delete round — xoá từng round, confirm dialog
- [x] Clear all results — xoá toàn bộ rounds + reset champion dedup pool
- [x] Empty state — "Awaiting the draft" khi chưa có round
- [x] Results skeleton — loading placeholder khi hydrate (V1 only)

### 0.5 Screenshot

- [x] Capture all rounds — stitch tất cả rounds thành 1 PNG
- [x] Select mode — chọn từng round để chụp (V1 only)
  - [x] Click round để toggle select
  - [x] Checkbox overlay + highlight border vàng
  - [x] Sticky bottom bar: Cancel + Capture Selected
- [x] Preview dialog — xem ảnh trước khi lưu/bỏ
- [x] Copy to clipboard — navigator.clipboard.write, "Copied! ✓" 2s
- [x] Save to device — download PNG, filename xom-ngheo-YYYY-MM-DD_HH-MM.png
- [x] Save + auto-copy — copy clipboard đồng thời khi Save (silent fail)
- [x] Canvas stitch — ghép nhiều element vertically, GAP=16px, bg=#1a2335, scale=2

### 0.6 Persist / Hydrate (localStorage)

V1 — key summoners-draft-state-v1:

- [x] summoners[] { id, name, team }
- [x] teamSize, randomRole, randomMembers
- [x] exclusions[] multiple pairs
- [x] laneSeconds, skipAnimation
- [x] rounds[] — lịch sử shuffle persist ✅
- [x] usedChampionIds[] — champion dedup persist ✅
- [x] roundIdSeed — round counter persist ✅
- [x] defaultRoles
- [x] Hydration guard (hydrated=true trước khi persist)
- [x] Legacy migration: members[] → summoners[] via distributeEqually()

V2 — key v2-store-v1:

- [x] summoners[] { id, name, power }
- [x] settings { shuffleTeam, skipAnimation, animationSeconds, evaluatePower, defaultRoles, exclusion }
- [x] results[] LaneResult[] — DEAD CODE, không được update sau shuffle ❌
- [ ] rounds[] — KHÔNG PERSIST ← critical gap
- [ ] usedChampionIds[] — KHÔNG PERSIST ← critical gap
- [ ] roundIdSeed — KHÔNG PERSIST ← gap

### 0.7 UI / Design System

- [x] Hextech CSS classes — hextech-frame, btn-hex, btn-hex-primary, btn-hex-danger, input-hex, gold-divider, text-glow-gold, animate-fade-in
- [x] hextech-frame — corner accents via ::before/::after pseudo-elements
- [x] btn-hex clip-path — polygon(8px 0, 100% 0, 100% calc(100%-8px), calc(100%-8px) 100%, 0 100%, 0 8px)
- [x] CSS variables — --gold, --gold-bright, --gold-deep, --team-alpha, --team-beta
- [x] Accordion — CSS grid-rows-[0fr/1fr] transition (V2)
- [x] Arena section — fixed min-height always visible (V2); conditional show/hide (V1)
- [x] Confirm dialog — reusable modal, danger variant
- [x] Responsive — 1-col mobile / 2-col desktop
- [x] Sticky header — sticky top-0 z-40 backdrop-blur-sm
- [x] Font display — Cinzel/Trajan serif cho UI labels

### 0.8 Navigation & Routes

- [x] / — V1 main (đầy đủ tính năng)
- [x] /v2/random — V2 main
- [x] /v2 — layout wrapper (V2StoreProvider + Outlet)
- [x] /gioi-thieu — Article page (nội dung đầy đủ, FAQ, schema)
- [x] /aram-random — ComingSoon
- [x] /random-lane — ComingSoon
- [x] /custom-game-random — ComingSoon
- [x] /chia-team-lien-minh — ComingSoon
- [x] /cmvn — ComingSoon
- [x] /faq — ComingSoon
- [x] /huong-dan — ComingSoon
- [x] /sitemap.xml — Sitemap route

### 0.9 SEO

- [x] Per-page: title, description, keywords, og:\*, twitter:card, canonical
- [x] Root: charset, viewport, robots, og:site_name, hreflang vi-VN + x-default
- [x] JSON-LD WebApplication (V1) + WebSite (root)
- [x] buildSeoMeta() helper cho các route phụ
- [x] SiteHeader — shared sticky nav, H1 slot (pageHeading prop)
- [x] Đúng 1 H1 per page — brand mark là span, không phải H1
- [x] InternalNav component — hidden (display:none), giữ SEO links

### 0.10 Analytics — GA4 (G-RCE35Y29CN)

- [x] Script inject tại \_\_root.tsx — load trên mọi route
- [x] usePageTracking — auto page view qua router.subscribe("onLoad")
- [x] trackEvent(event, params) — type-safe wrapper
- [x] analytics.shuffleTeam — { version, member_count, skip_animation }
- [x] analytics.shuffleStop — { version }
- [x] analytics.shuffleClear — { version }
- [x] analytics.summonerAdd — { version, total }
- [x] analytics.summonerRemove — { version, total }
- [x] analytics.summonerRename — { version } (V2 only)
- [ ] analytics.deleteRound — defined, CHƯA GỌI trong deleteRound handler
- [ ] analytics.screenshot — defined, CHƯA GỌI trong handleScreenshot
- [ ] analytics.settingToggle — defined, CHƯA GỌI ở bất kỳ đâu

### 0.11 Libs

- analytics.ts — GA4 wrapper, AppEvent union type, analytics.\* helpers
- capture.ts — captureElements() html2canvas-pro, multi-element stitch
- constants.ts — CHAMPION_TAGS array, ChampionTag type
- lol-api.ts — getAllChampions(), pickRandomChampions(), ROLE_META, ROLES_ORDER, Champion type (có tags: ChampionTag[])
- powerBalance.ts — balanceByPower(), interleaveTeams(), PowerEntry, BalancedTeams
- randomize.ts — buildLanePairings(), ExclusionPair, LanePairing
- seo.ts — buildSeoMeta(), SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE
- utils.ts — cn() (clsx + tailwind-merge)
- v2-types.ts — DEAD FILE — duplicate types, không được import ở đâu cả

### 0.12 Hooks

- useLocalStorage.ts — [state, setState, remove], SSR guard, write-on-change useEffect
- useShuffleEngine.ts — champion load + lane animation + shuffle orchestration + power balance + analytics
- usePageTracking.ts — GA4 page view tracking, router.subscribe
- useV2Store.ts — V2 state + CRUD actions + localStorage via useLocalStorage
- use-mobile.tsx — useIsMobile(), breakpoint 768px

### 0.13 Components (shared)

- SiteHeader / V2Header — sticky nav, Version 1/2 tabs, pageHeading slot
- ToggleRow — generic boolean toggle button
- ShuffleTeamToggle — wrapper ToggleRow với label cố định
- DefaultRolePicker — role table với auto-fill, conflict prevention, SummonerSelect dropdown
- ScreenshotChooserDialog — modal All/Select choice
- ScreenshotPreviewDialog — modal preview + copy + save + discard
- LaneRow — lane animation với phases (pre-role, role, pre-members, members, champ-alpha, champ-beta, done)
- ComingSoon — placeholder với h1 + intro text + SiteHeader + InternalNav
- InternalNav — hidden nav links giữa các tools

### 0.14 Components (V2-specific, src/components/v2/)

- PrimaryButton — btn-hex variants (primary/default/danger), sizes (sm/md/lg)
- TextInput — input-hex styled
- NumberInput — no spinner (appearance:textfield), min/max
- SummonerItem — inline edit + delete + power subitem + drag handle icons
- SummonerList — 2-col grid, 10 fixed slots, dnd-sortable với rectSortingStrategy
- ResultList — multiple ShuffleRounds + delete per-round + ConfirmDeleteDialog inline
- NeverSameTeam — fully controlled, 1 pair, native select dropdown
- SkipAnimationToggle — DEPRECATED, không được dùng
- EvaluatePowerToggle — DEPRECATED, không được dùng
- SettingsSidebar — DEPRECATED, sidebar bị remove khỏi V2

---

## 1. Gap Analysis V1 → V2

### 🔴 Critical (ảnh hưởng UX)

1. Rounds không persist → mất kết quả khi reload
2. Champion dedup không persist → có thể pick lại champion sau reload
3. results[] trong V2 store là dead code (không sync với engine)
4. Multiple exclusion pairs → V2 chỉ 1 cặp

### 🟡 Medium

5. Select mode screenshot → V2 chỉ capture all
6. isTeamEmpty guard → V2 không validate trước shuffle
7. Scroll behavior → V2 không auto-scroll
8. Hydrating skeleton → V2 không có
9. v2-types.ts → dead file gây confusion
10. 3 analytics events chưa được fire: deleteRound, screenshot, settingToggle
11. 3 deprecated components chưa dọn: SkipAnimationToggle.tsx, EvaluatePowerToggle.tsx, SettingsSidebar.tsx

### 🟢 V2 tốt hơn V1

- Power balance (evaluatePower + greedy algorithm)
- Summoner rename inline
- Accordion expand/collapse UX
- Settings persist (V1 chỉ persist data)

---

## 2. Architecture Map

```
src/
  lib/          ← pure functions, no React, tái dụng mọi version
  hooks/        ← React hooks, tái dụng mọi version
  contexts/     ← React Context per-version (V2StoreContext, V3StoreContext...)
  components/
    v2/         ← V2-specific UI
    [shared]    ← LaneRow, DefaultRolePicker, ToggleRow, ScreenshotDialogs, SiteHeader...
  routes/
    index.tsx   ← V1 monolith
    v2.tsx      ← V2 layout (StoreProvider + Outlet)
    v2/         ← V2 pages
    v3.tsx      ← V3 layout (tạo khi làm V3)
    v3/         ← V3 pages
    [content]   ← gioi-thieu, faq, huong-dan... (ComingSoon)
```

---

## 3. V3 Spec

### 3.1 Store — useV3Store.ts + key v3-store-v1

```ts
type V3Summoner = {
  id: string;
  name: string;
  team: "alpha" | "beta"; // khôi phục team column như V1
  power: number;
};

type V3Settings = {
  shuffleTeam: boolean;
  skipAnimation: boolean;
  animationSeconds: number; // 0–30s
  evaluatePower: boolean;
  defaultRoles: DefaultRoleConfig;
  exclusions: ExclusionPair[]; // multiple pairs như V1
};

type V3PersistedState = {
  summoners: V3Summoner[];
  settings: V3Settings;
  rounds: ShuffleRound[]; // persist ✅
  usedChampionIds: string[]; // persist ✅
  roundIdSeed: number; // persist ✅
};
```

### 3.2 Engine — extend useShuffleEngine

Thêm vào UseShuffleEngineOptions:

```ts
initialRounds?: ShuffleRound[];
initialRoundIdSeed?: number;
initialUsedChampionIds?: string[];
version?: "v1" | "v2" | "v3";
```

### 3.3 Routes

```
src/routes/v3.tsx
src/routes/v3/random.tsx
src/contexts/V3StoreContext.tsx
```

### 3.4 V3 Feature Checklist

Fixes bắt buộc từ V2:

- [ ] Persist rounds[] + usedChampionIds + roundIdSeed
- [ ] Restore rounds sau reload via initialRounds vào engine
- [ ] Multiple exclusion pairs
- [ ] isTeamEmpty guard trước shuffle
- [ ] Auto-scroll arena + results
- [ ] Hydrating skeleton 600ms
- [ ] Screenshot select mode (per-round)
- [ ] Fire missing analytics: deleteRound, screenshot, settingToggle

Giữ từ V2:

- [ ] Power balance (Evaluate Power + greedy algorithm)
- [ ] Power input 0–1000 per summoner
- [ ] Summoner rename inline
- [ ] Accordion sections (General info + Advanced settings)
- [ ] Settings persist
- [ ] Power balance preview panel
- [ ] Tái dụng useShuffleEngine (không viết lại)

Có thể thêm mới:

- [ ] Team column alpha/beta + drag-to-swap như V1
- [ ] animationSeconds mở rộng 0–30s
- [ ] Champion tags filter (CHAMPION_TAGS đã có trong constants.ts)

---

## 4. Action Items trước V3

### Bắt buộc

1. Xoá src/lib/v2-types.ts — dead file
2. Move shared types ra src/lib/types.ts:
   - DefaultRoleConfig từ DefaultRolePicker.tsx
   - ShuffleRound, ShuffleLane từ useShuffleEngine.ts
   - LaneResult từ ResultLane.tsx
3. useShuffleEngine thêm initialRounds/initialRoundIdSeed/initialUsedChampionIds
4. analytics.ts thêm "v3" vào version union type
5. Fire 3 analytics events còn thiếu

### Nice to have

6. Extract useScreenshot hook (state + handlers đang inline trong v2/random.tsx)
7. Extract useSummonerInput hook (inputValue + handleAdd đang inline)
8. Xoá deprecated: SkipAnimationToggle.tsx, EvaluatePowerToggle.tsx, SettingsSidebar.tsx

---

_Source: V1 index.tsx, V2 v2/random.tsx, useShuffleEngine.ts, useV2Store.ts, tất cả lib/hooks/components/routes_
