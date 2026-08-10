---
inclusion: always
---

# Coding Conventions — Always Enforced

These rules apply to **every** code change in this project without exception.

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
- **Long Function Formatting**: When writing long or multi-statement functions, prefer explicit arrow functions with block bodies `{ ... }` for clarity.
- **Try-Catch-Finally Formatting**: Always format `try-catch-finally` blocks cleanly across separate lines for readability.
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
- **ClassName Management**: Always use `cn()` (from `clsx` and `tailwind-merge`).
- **Icons**: Only use icons from `@hugeicons/react` and `@hugeicons/core-free-icons`. Never use Lucide Icons or any other icon library.
- **8-Point Grid System**: Follow the 8-Point Grid System for all spacing, padding, margins, and component dimensions.

## 4. Internationalization (i18n) Readiness

- **No Hardcoded Text**: Section titles, labels, or any UI text must be imported from JSON files or locale files.
- **Directory**: Store these in `/locales/` or `/lib/i18n/`.

## 5. File Integrity

- Every file must end with a single empty line.
- Code must follow Prettier formatting conventions.
