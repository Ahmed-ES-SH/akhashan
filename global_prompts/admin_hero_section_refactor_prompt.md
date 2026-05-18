Analyze the refactor plan in plans/ADMIN_HERO_SECTION_REFACTOR.md and the current implementation of the Admin Hero section component, then build a structured, phased implementation plan and save it as a .md file in the workPlans/ folder.
The plan must:

1. Identify ALL architectural and data flow issues between the current frontend code and the backend contract specified in the refactor plan
2. Cover types, API layer, hooks/state management, UI components, and translations
3. Include dedicated Playwright E2E testing phases (auth setup, Page Object Models, fixture creation, test scenarios)
4. Be organized in numbered phases where each phase is independently testable
5. List all affected files with exact changes needed per phase
6. Note missing backend endpoints or assumptions
7. Include a risks/blockers section
   Focus specifically on Admin Hero section control only — do not scope-creep into other sections.
The output MUST be a work plan saved as a .md file in workPlans/ named after the integration plan (e.g., workPlans/ADMIN_HERO_SECTION_REFACTOR_PLAN.md).
Files for reference:

- Refactor plan: plans/ADMIN_HERO_SECTION_REFACTOR.md
- Current component: app/_components/website/_admin/AdminHeroSectionControl.tsx
- Related types: app/types/website/admin.types.ts
- Related API: app/helpers/api/adminApi.ts
