Analyze the integration plan in [path to plan] and the current implementation of [section component path], then build a structured, phased implementation plan and save it as a .md file in the workPlans/ folder.
The plan must:

1. Identify ALL architectural and data flow issues between the current frontend code and the backend contract specified in the integration plan
2. Cover types, API layer, hooks/state management, UI components, and translations
3. Include dedicated Playwright E2E testing phases (auth setup, Page Object Models, fixture creation, test scenarios)
4. Be organized in numbered phases where each phase is independently testable
5. List all affected files with exact changes needed per phase
6. Note missing backend endpoints or assumptions
7. Include a risks/blockers section
   Focus specifically on: [section name] admin control only — do not scope-creep into other sections.
   Files for reference:

- Integration plan: [path to plan file]
- Current component: [path to component file]
- Related types: [path to types]
- Related API: [path to API file]
  Replace the bracketed placeholders with your actual file paths. For your current task it would be:
- Integration plan: plans/STATS_INTEFRATION_PLAN.md
- Current component: app/\_components/website/\_admin/AdminStatsSectionControl.tsx
- Related types: app/types/website/admin.types.ts
- Related API: app/helpers/api/adminApi.ts
