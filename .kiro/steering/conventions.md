---
inclusion: always
---

# Coding Conventions — Always Enforced

These rules apply to **every** code change in this project without exception.

## 1. Import Order

Group imports separated by a single empty line:

1. Frameworks: `next` / `react` and related packages
2. 3rd parties: external libraries
3. Internal core: `libs`, `utils`, `services`, `hooks`, `stores`
4. Components: page components, shared UI

## 2. Component & Variable Style

- **Arrow components only**: `const ComponentName = () => { ... }` — never `function ComponentName()`
- **Meaningful names**: no single-letter or obscure abbreviations (`e` → `event`, `v` → `value`, `res` → `response`, `idx` → `index`, `el` → `element`, `cb` → `callback`)
- **try-catch format**:
  ```ts
  try {
    // logic
  } catch (error) {
    // handling
  } finally {
    // cleanup
  }
  ```
- **File naming**: PascalCase for components (`TeamMemberCard.tsx`), camelCase for everything else (`useJobs.ts`, `constants.ts`)
- **No inline enums/constants**: all enums and option arrays go in `constants.ts` files
- **DRY**: reuse existing components, hooks, utilities — never duplicate
- **Multiline objects**: always break each property onto its own line
- **Separation of concerns**: extract complex logic into hooks or helper functions — never mix business logic into JSX

## 3. UI & HTML

- **Semantic HTML**: `<section>`, `<article>`, `<header>`, `<main>`, etc.
- **cn()** for all className management (clsx + tailwind-merge)
- **Icons**: only `@hugeicons/react` + `@hugeicons/core-free-icons` — never Lucide or other icon libraries
- **No hardcoded UI text**: all labels, titles, messages must come from i18n JSON files

## 4. Architecture

- `app/`: routing only — no business logic
- `features/`: feature-based modules, self-contained
- `components/ui/`: reusable atomic UI — must NOT import from `features/`
- `libs/`, `hooks/`: shared utilities

## 5. File Integrity

- Every file ends with a single empty line
- Code must follow Prettier formatting conventions

## 6. Before Writing Code

1. **Read the file first** — never modify code you haven't seen
2. **Run `pnpm run build`** after changes to verify TypeScript and compilation
3. **Match the project's existing patterns** — don't introduce new libraries or architectures without discussion
