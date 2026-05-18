Analyze the integration plan in plans/PROCESS_INTEGRATION_PLAN.md and the current implementation of the Process section components, then build a structured, phased implementation plan and save it as a .md file in the workPlans/ folder.
The plan must:

1. Identify ALL architectural and data flow issues between the current frontend code and the backend contract specified in the integration plan
2. Cover types, API layer, hooks/state management, UI components, and translations
3. Include dedicated Playwright E2E testing phases (auth setup, Page Object Models, fixture creation, test scenarios)
4. Be organized in numbered phases where each phase is independently testable
5. List all affected files with exact changes needed per phase
6. Note missing backend endpoints or assumptions
7. Include a risks/blockers section
   Focus specifically on Process section admin control and public display only — do not scope-creep into other sections.
The output MUST be a work plan saved as a .md file in workPlans/ named after the integration plan (e.g., workPlans/PROCESS_SECTION_PLAN.md).
Files for reference:

- Integration plan: plans/PROCESS_INTEGRATION_PLAN.md
- Current admin component: app/_components/website/_admin/AdminProcessSectionControl.tsx
- Current public component: app/_components/website/_home/ProcessSection.tsx
- Related types: app/types/website/admin.types.ts
- Related API: app/helpers/api/adminApi.ts
