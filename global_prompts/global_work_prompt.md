Analyze the plan in workPlans/STATS_SECTION_ADMIN_REFACTOR_PLAN.md and implement ALL phases sequentially.
Implementation requirements:

- Follow the phase order strictly (Phase 1 → 2 → 3 → ... → 9)
- Each phase must be independently testable and not break the app
- Use `pnpm lint` after each phase to verify
- Add `data-testid` attributes on key interactive elements (stat cards, add button, delete button, form fields, confirmation dialogs, save bar, popups)
- Use the existing project patterns (Tailwind v4, framer-motion if needed, sonner toasts, existing i18n hook)
- For drag-and-drop reorder, use [decision from earlier - replace with up/down arrows OR @dnd-kit]
- For Playwright setup (Phase 7), install @playwright/test and configure for chromium only
- Do NOT commit changes at any point
  Files provided for reference:
- The plan: workPlans/STATS_SECTION_ADMIN_REFACTOR_PLAN.md
- The current AdminStatsSectionControl: app/\_components/website/\_admin/AdminStatsSectionControl.tsx
- The integration spec: plans/STATS_INTEFRATION_PLAN.md
