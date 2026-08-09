---
name: coding-conventions
description: Enforces project-specific coding standards, architectural patterns, and UI/UX best practices. Use this whenever writing or refactoring code.
---

# Coding Conventions

Follow these rules strictly for every code change in this project.

## 0. Spec-Driven Development

- Always prioritize and follow technical specifications located in the `/.agents/specs/` folder.
- Coding tasks (UI components, features, business logic) must align with the corresponding spec file rather than relying solely on chat prompts.
- If a spec is outdated or missing, request clarification or an update before proceeding with complex logic.

## 1. Import Order

Group imports in the following order, separated by a single empty line:

1. Frameworks: `next/react` and related packages.
2. 3rd parties: External libraries and dependencies.
3. Internal Core: `libs`, `utils`, `services`, `hooks`, `stores`.
4. Components: Page components, shared UI components.

## 2. Component & Variable Styles

- **Arrow Components Only**: Use `const ComponentName = () => { ... }`. Do not use `function ComponentName()`.
- **Long Function Formatting**: When writing long or multi-statement functions, prefer explicit arrow functions with block bodies `{ ... }` for clarity:
  ```ts
  const functionName = () => {
    statementOne;
    statementTwo;
  };
  ```
- **Try-Catch-Finally Formatting**: Always format `try-catch-finally` blocks cleanly across separate lines for readability:
  ```ts
  try {
    // execution logic
  } catch (error) {
    // error handling
  } finally {
    // cleanup logic
  }
  ```
- **Meaningful Naming (No Short Abbreviations)**: Every variable, function parameter, event, and component prop MUST be explicitly and meaningfully named. Single-letter or obscure abbreviations like `e`, `v`, `el`, `idx`, `res`, `req`, `cb`, `item` (when ambiguous) are strictly prohibited. For example, use `event` instead of `e`, `value` instead of `v`, `element` instead of `el`, `index` instead of `idx`.
- **File Naming — No Kebab-Case**: Never use dashes (`-`) in file names. Component files use **PascalCase** (e.g., `DesktopNav.tsx`, `Header.tsx`). All other files (hooks, utils, services, constants, types) use **camelCase** (e.g., `useMobileMenu.ts`, `constants.ts`, `utils.ts`).
- **Enums & Constants Separation**: All enums, constants, and option arrays MUST be stored in dedicated files (e.g., `features/<feature>/constants.ts` or `libs/constants.ts`). Never bloat page (`page.tsx`) or component files with inline enums, options objects, or magic strings.
- **DRY (Don't Repeat Yourself)**: Always reuse components, hooks, and utilities. Avoid duplicate UI blocks, inline constants, or re-implementing existing functionality across pages.
- **Multiline Object Property Formatting**: When declaring objects (especially maps or items in a list), ALWAYS break each property onto its own new line (multiline object formatting). Never keep object properties inline on a single line (e.g. `{ icon: null, title: "" }`), and NEVER use artificial spaces to align columns (`key:      value`).
- **Separation of Logic**: Keep UI (JSX and TSX) and complex logic separated. Use hooks or helper functions.

## 3. UI & HTML Standards

- **Font Family**: Use the default setup: `'Inter', 'Noto Sans JP', sans-serif`. For components or sections specifically displaying Japanese content that require only Noto Sans JP, use the `.jp-text` class helper (equivalent to `font-family: var(--font-jp)`).
- **Semantic HTML**: Always use HTML5 semantic tags (`<main>`, `<section>`, `<article>`, `<header>`, etc.).
- **Tag Attribute Order**:
  - For standard tags: `className`, `id`, `[events]`, `[booleans]`, `[others]`.
  - For custom components: Props first, then others.
- **ClassName Management**:
  - Always use `cn()` (from `clsx` and `tailwind-merge`).
  - Order: BEM-style base class → Tailwind classes.
  - Organization: Group Tailwind classes by screen sizes/utility types.
  - Multi-line: List classes on separate lines for readability in `cn()`.
- **Icons**: Only use icons from `@hugeicons/react` and `@hugeicons/core-free-icons`. Never use Lucide Icons or any other icon library.
- **Design System**: Follow the design-system skill for all UI styling decisions (colors, shadows, borders, rounded corners, spacing).

## 4. Internationalization (i18n) Readiness

- **No Hardcoded Text**: Section titles, labels, or any UI text must be imported from JSON files.
- **Directory**: Store these in `/locales/` or `/lib/i18n/`.
- Even if English is the only language now, we must use this structure to support future translation.

## 5. Directory & Architecture Structure

### Top-level folders

- `app/`: Routing layer ONLY (pages, layouts, metadata). No business logic.
- `features/`: Feature-based modules (business domains).
- `components/ui/`: Reusable, atomic UI components (shadcn-like).
- `libs/`, `utils/`, `hooks/`: Shared helper logic and global hooks.

### Feature-Based Architecture (`features/`)

Each feature must be self-contained:

- `features/<feature-name>/`:
  - `components/`: Feature-specific UI components.
  - `hooks/`: Feature-specific hooks.
  - `services/`: API calls or business logic.
  - `types.ts`: Feature-specific type definitions.
- **Rules**:
  - Folders must be **singular** and **kebab-case** (e.g., `product`, `user-profile`).
  - Do NOT place feature logic outside its folder.
  - Maintain isolation between features.

### Component Placement & Imports

- **Reusable UI** → `components/ui/`.
- **Feature-specific UI** → `features/*/components/`.
- **Import flow**:
  - Features can import from `components/ui`, `libs`, `utils`, `hooks`.
  - `components/ui` **MUST NOT** import from `features`.
  - Avoid cross-feature imports (keep features isolated).

## 6. Next.js Conventions

### Routing Files

Use the following special files within `app/`:

- `layout.tsx`: Shared UI (header, nav, footer).
- `template.tsx`: Re-rendered layout.
- `page.tsx`: Route entry point.
- `loading.tsx`: Skeleton/loading UI (React Suspense).
- `not-found.tsx`: 404 UI.
- `error.tsx`: Route-level error boundary.
- `global-error.tsx`: Root-level error boundary.
- `route.ts`: API endpoints.
- `default.tsx`: Parallel route fallback.

### Metadata & SEO

Follow file-based metadata conventions:

- **Icons**: `favicon.ico`, `icon.png`, `apple-icon.png`.
- **Social**: `opengraph-image.png`, `twitter-image.png`.
- **SEO**: `sitemap.xml` (or `sitemap.ts`), `robots.txt` (or `robots.ts`).

## 7. File Integrity

- **Empty Line**: Every file must end with a single empty line.
- **Prettier**: Ensure code is formatted using Prettier conventions.
