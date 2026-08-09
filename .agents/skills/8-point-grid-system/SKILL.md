---
name: 8-point-grid-system
description: Use this skill whenever creating, reviewing, or auditing spacing, sizing, or layout for any UI — web, mobile, or design files (Figma, Sketch, CSS, Tailwind, React, Vue). Trigger for tasks like defining a spacing scale, setting padding/margin/gap values, sizing buttons/icons/cards, building design tokens, fixing "messy" or inconsistent spacing, setting up a Tailwind theme, or auditing an existing UI for spacing consistency — even if the user never says "8 point grid" or "8pt" explicitly (e.g. "chuẩn hóa spacing", "khoảng cách bị lộn xộn", "set up design tokens", "tighten up this layout", "what padding should I use here"). Do not use for typography scale, color systems, or breakpoints unless spacing is also involved.
---

# 8-Point Grid System

A spatial design system where every padding, margin, gap, and component dimension is a multiple of 8px (with an optional 4px half-step). The goal is not decoration — it's removing arbitrary decisions so spacing stays consistent across a whole product and translates cleanly into code.

## Why this matters (so you apply it with judgment, not just as a rule)

- Most common screen resolutions and viewport widths (320, 360, 375, 414, 768, 1024, 1280, 1440, 1920) divide evenly by 8. Multiples of 8 render crisp at 1x/1.5x/2x/3x pixel densities — no sub-pixel blur.
- It's a shared language between design and code: a developer can eyeball "that's 24px" instead of measuring, and a spacing token like `space-3` means the same thing everywhere.
- The value isn't pixel-perfection for its own sake — it's fewer decisions and less drift. Treat it as the default, not an inviolable law; know when and why to break it (see Exceptions below).

## Core scale

Base unit: 8px. Half-step: 4px (for icons, tight text spacing, small components).

| Token       | px    | Typical use                                             |
| ----------- | ----- | ------------------------------------------------------- |
| `space-0.5` | 4px   | icon-to-text gap, tight inline spacing, dense list rows |
| `space-1`   | 8px   | related element spacing, small component padding        |
| `space-2`   | 16px  | default component padding, gap between related items    |
| `space-3`   | 24px  | spacing between distinct component groups               |
| `space-4`   | 32px  | section-internal spacing                                |
| `space-5`   | 40px  | large component padding                                 |
| `space-6`   | 48px  | spacing between major sections                          |
| `space-8`   | 64px  | large section spacing, hero padding                     |
| `space-10`  | 80px  | page-level spacing                                      |
| `space-12`  | 96px+ | large layout blocks                                     |

Extend beyond 96px in the same +8 (or round) increments as needed — don't invent a new base.

## Decision: hard grid vs soft grid

Always default to **soft grid** for digital product work unless the user is doing print/editorial layout:

- **Soft grid** (default): don't build a visible underlying grid — just make sure the _distance between_ elements is always a multiple of 8 (or 4 for the half-step). Maps directly to CSS/Tailwind spacing props. Works with irregular platform UI (iOS system elements, responsive reflow).
- **Hard grid**: elements snapped into a visible, system-wide 8px grid using container/frame structures. Comes from print design; use only when the user explicitly wants a rigid, brick-like layout structure (e.g. a strict editorial grid) — it adds overhead in Figma/Sketch and doesn't map to how CSS actually lays things out.

If unsure which the user wants, default to soft grid and mention the choice briefly rather than asking — it's the right default for nearly all web/app work.

## 4pt vs 8pt: which base to recommend

- **8pt base**: the default recommendation for most product UI. Large enough to visually distinguish steps (12px vs 16px is hard to eyeball reliably; 16px vs 24px is not), small enough to stay flexible. Use for general layout, section spacing, component padding.
- **4pt half-step**: layer it in for icons, dense data UI (tables, dashboards), small text-adjacent spacing, or line-heights — anywhere 8px would feel too coarse.
- **Never recommend odd bases** (5pt, 10pt, etc.) for a from-scratch system — they cause split-pixel centering issues (e.g. centering an icon in a 25px-tall button) and don't scale cleanly across 1.5x/2x/3x pixel densities.
- If the user already has an established scale (e.g. Tailwind's default 4-based scale, or a Material/Carbon-based system), work within it rather than replacing it — see `references/framework-implementation.md`.

## What the grid applies to (and what it doesn't)

**Apply the grid to:** padding, margin, gap, component width/height, icon sizes, border-radius (loosely), touch target sizing.

**Do NOT force onto the grid:**

- **Font sizes** — these follow their own type scale (often a modular ratio), not the spacing grid. A 14px body or 18px heading is fine.
- **Fluid/percentage-based containers** — when a card or container must flex to fill available space, its _total_ dimension can land on an odd number; what matters is that the padding/margin/gap _inside and around_ it stay on-grid.
- **Line-height** — often pairs better with the 4pt half-step than the 8pt base.

## Implementation

For concrete code — Tailwind config/theme setup, CSS custom properties, Figma variable setup — read `references/framework-implementation.md` before writing config or token files. It covers Tailwind v3 and v4 (CSS-first `@theme`), raw CSS variables, and Style Dictionary/token-pipeline patterns.

## Auditing existing UI for spacing consistency

When asked to review, clean up, or "fix" spacing in an existing project:

1. Grep/scan for hardcoded pixel/rem values in CSS, inline styles, or Tailwind arbitrary values (e.g. `p-[13px]`, `margin: 15px`).
2. Flag any value that isn't a multiple of 8 (or 4 for the half-step) — list them out rather than silently changing everything, since some may be intentional (icon-text fine-tuning, fluid containers).
3. Propose the nearest on-grid replacement for each flagged value, grouped by whether it's spacing (snap freely) vs. a case from the "do NOT force" list above (leave alone, or explain why).
4. Recommend a lint/enforcement mechanism if the codebase is Tailwind-based and drift is recurring (e.g. disabling arbitrary values via `tailwindcss/no-arbitrary-value`, or a stylelint rule) — see `references/framework-implementation.md`.

## Communicating this to the user

Explain _why_ a value is being changed ("24px keeps this on the 8pt scale and matches the group spacing used elsewhere"), not just that it violates the rule. If a value the user wants breaks the grid, say so plainly and give the on-grid alternative — but if they have a deliberate reason (e.g. 6px between an icon and label because 4px felt cramped and 8px felt loose), respect it as a documented exception rather than overriding it.
