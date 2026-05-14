# Antigravity Agent Rules (project-wide)

> Purpose: rules the code-editor agent MUST follow while editing, creating, or reviewing code in this repository.

---

## 1. Agent identity & behavior

- Treat yourself as a **Senior-Frontend-engineer** for this specific Next.js project. Provide concrete code changes, not vague suggestions.
- **Do not** make arbitrary structural changes to the project layout. Propose them only when you include a migration plan and exact file diffs.
- Always produce ready-to-apply code snippets or patch suggestions (file path + full file content or unified diff).
- When asked for step instructions, return **no more than two steps** (project preference).
- Use English for all code comments, commit messages templates, and inline explanations inside PR patches.

## 2. Filename & placement rules

- Use `.antigravity/rules.md` as the canonical rules file.
- Agent must **never** create files at repo root starting with a dot except where project policy allows (e.g., `.env.example`, `.antigravity/*`).
- Examples of accepted page files (App Router):
  - `app/<route>/page.tsx`
  - `app/<route>/layout.tsx` _(only if needed)_
  - `app/<route>/loading.tsx` _(only if needed)_
- Never add extra top-level page files beyond `page.tsx`/`layout.tsx`/`loading.tsx`.

## 3. Pages & \_components conventions (strict)

- Main pages must have _only_ the main files in their folder: `page.tsx`, optional `layout.tsx`, optional `loading.tsx`.
  - Example: `app/about/page.tsx` and optionally `app/about/layout.tsx`.
- Shared UI components live in `app/_components`.
  - Example: `app/_components/Button.tsx`, `app/_components/Card/`.
- Each main page may have a single folder named with a leading underscore equal to the page name:
  - `app/_home/` or `app/_about/` — these are **page-scoped** component folders.
  - If a section is complex, deeper nested folders inside that folder are allowed:
    - `app/_home/_contact/input.tsx`
- The agent must preserve this underscored-folder convention when creating/moving page-scoped components.

## 4. Localization & translations

- Translations live at root: `@translations/` (directory).
  - Use JSON files like `@translations/en.json`, `@translations/ar.json`.
- No third-party i18n libraries — follow existing pattern:
  - Client hook: `app/hooks/useLocale.ts` and `app/hooks/useTranslation.tsx` (or similar).
  - Server helper: `app/helpers/getServerTranslation.ts`.
- Agent must:
  - Never inline static UI text into components. Always add keys to `@translations/*` and reference via `useTranslation` or `getServerTranslation`.
  - Preserve translation key patterns. If creating keys, follow concise namespaced keys: `pageName.section.element`.
  - Add missing translation keys to **both** languages with placeholder `"TODO - translate"` for the new locale if translator content not provided.

## 5. Client vs Server rules

- Respect Next.js App Router semantics:
  - Files that use `use client` may import client-only hooks (e.g., `useLocale`, `useTranslation`) and browser APIs.
  - Server components must not import client hooks or browser-only modules.
- When creating components, the agent must mark them `use client` only if they actually require client-side behavior (state, effects, event handlers, framer-motion animation on mount, DnD).
- Data fetching:
  - Use server-side fetching in server components when possible.
  - For client interactions requiring optimistic UI or forms, use client components that call backend endpoints.

## 6. Tech stack & dependency awareness

- Known stack (do not change unless requested): React 19, Next 16 (App Router), TypeScript, TailwindCSS v4, Framer Motion, Redux Toolkit, react-hook-form, axios, zod, etc.
- Agent must avoid suggesting incompatible library versions with the declared `package.json` unless user asks to upgrade and provides consent.
- When suggesting code examples, prefer idioms compatible with this stack (Tailwind classes, Framer Motion API, react-hook-form).

## 7. UI / animation / layout specifics

- For fixed/sticky guidance: prefer `position: sticky` over `position: fixed` where appropriate (user preference).
- When animating, use Framer Motion primitives when available and prefer composable hooks for scroll-based animation inside a single component (do not add global scroll listeners).
- Keep Tailwind utility classes tidy; prefer extracting repeated patterns into small components in `app/_components`.

## 8. Code style & linting

- Comments in code: **English only**.
- Use TypeScript strictness — prefer typed props and avoid `any`.
- Keep files small and focused: max ~300 lines per React component file (recommendation).
- Respect existing eslint / `eslint-config-next` rules. Do not disable lints globally unless necessary and justified in the PR description.

## 9. Security & secrets

- Never commit secrets or `.env` values. If the agent needs to add example env keys, create `.env.example` with descriptive placeholders.
- For API tokens and auth flows follow backend contract (ask nothing in the code that would require storing secrets in the repo).

## 10. PR & commit guidance for agent-generated patches

- When producing a patch, include:
  1. File path(s) changed.
  2. Unified diff or full file contents.
  3. Short PR description in English with:
     - What changed.
     - Why (one sentence).
     - Migration steps (max two).
- Commit message template:
## 11. Implementation Plan Structure (Phase-Based Requirement)

All implementation plans produced by the agent must follow a structured **phase-based approach**. The agent is not allowed to provide bulk, unstructured change dumps for multi-file or architectural tasks.

The objective is to ensure incremental delivery, safer reviews, and production stability.

---

### 11.1 Mandatory Phase Format

Every implementation plan must be divided into clearly numbered phases:

- **Phase 1 — <Title>**
- **Phase 2 — <Title>**
- **Phase 3 — <Title>**
- (Continue as needed)

Each phase must contain:

1. **Objective**  
   A short explanation (1–2 lines) describing what this phase achieves.

2. **Files Affected**  
   Explicit file paths that will be created or modified.

3. **Exact Code Changes**  
   - Full file content OR  
   - Unified diff format  
   No pseudo-code. No partial fragments.

4. **Verification Checklist**  
   Clear steps to confirm the phase works correctly.

Each phase must be independently testable and must not break the application state.

---

### 11.2 Phase Design Constraints

- A single phase must focus on **one responsibility only**.
- Structural refactors must be isolated in their own phase.
- UI changes must not be mixed with data-layer refactors.
- API integration must not be mixed with visual polishing.
- If database or structural migration is required, include:
  - Rollback instructions
  - Migration notes
  - Backward compatibility considerations

The agent must avoid silent cross-cutting changes.

---

### 11.3 Frontend-Specific Planning Rules (Next.js App Router)

For this project specifically:

- Separate **UI layout work** from **state management logic**.
- Separate **API integration** from **presentation components**.
- Translation key additions must be grouped into a dedicated phase when non-trivial.
- Any change affecting client/server boundaries must be isolated.
- New page-scoped components must respect the underscore-folder convention.

---

### 11.4 Recommended Phase Flow Pattern

When implementing a new feature, follow this logical order where applicable:

1. Phase 1 — Contract / Types / Data Shape Alignment  
2. Phase 2 — Data Layer Integration (Redux / hooks / services)  
3. Phase 3 — UI Structure  
4. Phase 4 — Interaction Logic  
5. Phase 5 — Animation & UX Polish  
6. Phase 6 — Cleanup & Refactor  

The number of phases depends on complexity, but collapsing everything into one phase is not allowed.

---

### 11.5 Automatic Enforcement Rule

If a request involves:

- Multiple files
- Cross-layer changes
- Architecture adjustments
- New feature implementation

The agent must automatically switch to **phased planning mode**, even if the user does not explicitly request it.

Single trivial file edits are exempt.