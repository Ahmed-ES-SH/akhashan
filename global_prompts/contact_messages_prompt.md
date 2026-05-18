Analyze the integration plan in plans/CONTACT_MESSAGES_INTEGRATION_PLAN.md and the current implementation of the Contact section components, then build a structured, phased implementation plan and save it as a .md file in the workPlans/ folder.
The plan must:

1. Identify ALL architectural and data flow issues between the current frontend code and the backend contract specified in the integration plan
2. Cover types, API layer, hooks/state management, UI components, and translations
3. Include dedicated Playwright E2E testing phases (auth setup, Page Object Models, fixture creation, test scenarios)
4. Be organized in numbered phases where each phase is independently testable
5. List all affected files with exact changes needed per phase
6. Note missing backend endpoints or assumptions
7. Include a risks/blockers section
   Focus specifically on Contact Messages public form submission and admin inbox management only — do not scope-creep into other sections.
The output MUST be a work plan saved as a .md file in workPlans/ named after the integration plan (e.g., workPlans/CONTACT_MESSAGES_PLAN.md).
Files for reference:

- Integration plan: plans/CONTACT_MESSAGES_INTEGRATION_PLAN.md
- Current public component: app/_components/website/_home/ContactSection.tsx
- Current hook: app/hooks/home/useContactForm.ts
- Related types: app/types/website/admin.types.ts
- Related API: app/helpers/api/adminApi.ts
