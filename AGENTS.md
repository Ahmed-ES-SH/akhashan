IMPORTANT: All AI agents operating in this repository MUST load and follow the rules in `.agents/rules.md` before making any change.

## Overview

This repository is a Next.js frontend application using modern React and TypeScript tooling. The purpose of this `AGENTS.md` is to summarize the project's technologies, developer workflows, and minimal rules for automated agents working in the codebase.

## Tech Summary

- Framework: Next.js (v16.x)
- UI library: React (v19)
- Language: TypeScript
- Styling: Tailwind CSS (v4) + PostCSS
- Icons : React-icons 
- Animations : framer-motion  
- Linting: ESLint (with `eslint-config-next`)
- Package manager: pnpm (project contains `pnpm-lock.yaml`) — npm/yarn are supported but prefer `pnpm`.
- i18n: JSON translation files under `translations/` (e.g., `en.json`, `ar.json`) with custom hooks to display the content in client side (@app/hooks/useTranslation) in server side (@app/helpers/getServerTranslation)
- Routing: App Router (`app/` directory) with locale-aware routes (`[locale]/`)
- Other libs: `slugify` (used in project)



## in every task or order have realtion with desing must be check @DESIGN.md file first 



## Structure Files 
- `app/{pageName}`
    - `page.tsx`
    - `loading.tsx` (if the page have fetch data logic)
    - `error.tsx` (if there is a reason to crash the page like error when fetch data or send request)

- `app/helpers`
    -`{componentName}`
        -`{featureName}`

- `app/hooks`
    -`{componentName}`
        -`{hookfeatureName}`

- `app/_components`
    -`website/{_pageName}` or `dashboard/{_pageName}` 
        -`{component}`

- `app/types`
    -`website/{pageName.types.ts}` or `dashboard/{pageName.types.ts}` 
                        

## The page.tsx will have the components only and if there is fetching data it will done in the page.tsx and will pass to the other components in the props 

## the page.tsx must have generateMetadata function and will use this pattern in the code write code 
`export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale, "layoutMeta");
  const sharedMetaData = getSharedMetadata(locale, t.title, t.description);

  return {
    title: t.title,
    description: t.description,
    ...sharedMetaData,
  };
}`

## no page or component will have a function logic , you can make a helper or hook to serve the logic what you want create 


## The comments will write in english only and on the important points only with this style 

///////////////////////////////////////////////////////////////////////
/////////////// comment content ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////


## All the static content must be in the translations files in ar.json and en.json , the files like (page.tsx or component file or toast messsages) must be don`t have any static texts


## Important files & folders

- `app/` — application root (layouts, pages, locale-aware routes)
- `public/` — static assets
- `translations/` — locale JSON files
- `helpers/`, `hooks/`, `constants/` — project utilities
- `next.config.ts` — Next configuration
- `postcss.config.mjs` & `tailwind.config.*` — Tailwind/PostCSS config (if present)
- `package.json` — scripts: `dev`, `build`, `start`, `lint`

## Developer commands

Preferred (pnpm):

```bash
pnpm install
pnpm dev   # starts Next.js dev server
pnpm build
pnpm start
pnpm lint
```

Fallback (npm):

```bash
npm install
npm run dev
```

## Agent Rules (short)

1. Mandatory rules file: Always load and follow `.agents/rules.md` before making any edits.
2. Use the project's package manager (`pnpm`) for install/run tasks where possible.
3. Do not upgrade major framework versions (Next/React/TypeScript/Tailwind) without explicit human approval.
4. Run `pnpm lint` before committing changes that touch JS/TS/X files.
5. Preserve existing folder structure and i18n files; prefer additive changes (new helpers/components) over large refactors.
6. When adding or modifying public-facing strings, update `translations/` accordingly.
7. For any changes that affect build or runtime behavior, include a short rationale in the PR description.

## Agent Workflow Recommendations

- For code edits: create a small, focused change, run lint, and ensure TypeScript types are satisfied.
- For new pages/components: follow the `app/` layout conventions and export server/client component semantics explicitly.
- For style changes: prefer Tailwind utility classes and follow existing spacing/token patterns.
- For tests or CI: there are no tests detected; if you add tests, include instructions in `README.md`.

If you need more detail about a specific area (build, i18n workflow, or conventions for components), ask for a focused update and I will expand this document.



ANTI-GOALS / ANTI-ORDERS

1. Mandatory rules violation
- Ignoring .agents/rules.md before making changes

2. i18n system violations
- Using hardcoded UI strings inside code (pages/components/toasts)
- Not using translations/en.json or translations/ar.json

3. Business logic in UI layer
- Writing logic inside page.tsx or React components
- Not using hooks or helpers for logic separation

4. Folder structure violations
- Creating files outside the defined structure
- Ignoring app/helpers, app/hooks, app/types conventions
- Mixing website and dashboard structures incorrectly

5. App Router misuse
- Not following app/{pageName}/page.tsx structure
- Using Pages Router or inconsistent routing patterns

6. Metadata system violations
- Missing generateMetadata in page.tsx
- Not following the required metadata pattern

7. Data fetching misplacement
- Fetching data inside components instead of page.tsx
- Mixing data fetching with presentation logic incorrectly

8. TypeScript misuse
- Overusing `any` without justification
- Not defining proper types in app/types

9. Comment style violations
- Writing comments in non-English languages
- Using inconsistent or unstructured comment formats

10. Package manager misuse
- Using npm/yarn instead of pnpm without reason

11. Unauthorized dependency upgrades
- Upgrading Next.js, React, TypeScript, or Tailwind without approval

12. Over-refactoring
- Performing large structural changes instead of small additive updates

13. Linting omission
- Skipping pnpm lint before commits

14. Hardcoded UI content
- Adding UI text directly in components instead of translations

15. Separation of concerns violations
- Mixing UI, logic, and data fetching in the same layer