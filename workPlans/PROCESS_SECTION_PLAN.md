# Process Section — Admin Control & Public Display Integration Plan

> **Scope**: Process section only — section header (label, heading, description) + individual process steps (step_number, bilingual title/desc, sort_order, CRUD, reorder).
> **Date**: 2026-05-17
> **Status**: Draft

---

## Overview

Focus: Integrate the **Process Section** admin control (`AdminProcessSectionControl.tsx`) and public display (`ProcessSection.tsx`) with the backend API contract defined in `plans/PROCESS_INTEGRATION_PLAN.md`.

**Current Problems**:

1. **No child item CRUD API** — `adminApi.ts` has zero functions for process-steps endpoints (`GET/POST/PUT/DELETE /api/admin/process-steps`, `PATCH /api/admin/process-steps/reorder`, `PATCH /api/admin/process-steps/:id/reorder`)
2. **Wrong data flow for steps** — Steps are passed as `ProcessSectionApiResponse` (public shape with no `id`, `sort_order`, `createdAt`) to the admin component; admin needs full entity shape
3. **No add/delete/reorder** — Only inline editing of `title` and `desc` via `openChildItemEditor`; no creation, deletion, or reordering of steps
4. **Single-field-only child editing** — `openChildItemEditor(fieldKey, currentValue)` accepts a single string; process steps have bilingual `title_en`/`title_ar` and `desc_en`/`desc_ar` that need paired editing
5. **Type safety gaps** — `processSteps: unknown[]` in `AdminHomePageContent`; `ProcessStepApiResponse` lacks admin fields (`id`, `sort_order`, `homePageContentId`, `createdAt`, `updatedAt`)
6. **Section header editing works but is coupled** — Label/heading/description use the existing `EditableText` + `PROCESS_FIELD_API_MAP` flow correctly, but step editing is bolted on with the wrong pattern
7. **No E2E tests** — zero coverage for process admin flows
8. **Public section has no loading/error states** — `ProcessSection.tsx` assumes data is always present; no skeleton, empty state, or error handling

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for process steps admin CRUD that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminProcessStep`, `AdminCreateProcessStepPayload`, `AdminUpdateProcessStepPayload`, `AdminProcessStepListResponse`, `AdminReorderPayload`, `AdminSingleReorderPayload` types. Fix `AdminHomePageContent.processSteps` from `unknown[]` to `AdminProcessStep[]`. |
| `app/types/website/home.types.ts` | Add `AdminProcessStepApiResponse` (admin shape with id, sort_order, etc.) — keep existing `ProcessStepApiResponse` for public. |

### Key Type Additions

```typescript
// app/types/website/admin.types.ts

// Process Step — admin API response shape (full entity)
export interface AdminProcessStep {
  id: number;
  step_number: number;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// Create payload
export interface AdminCreateProcessStepPayload {
  step_number: number;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

// Update payload (all optional except id in URL)
export type AdminUpdateProcessStepPayload = Partial<AdminCreateProcessStepPayload>;

// Bulk reorder payload
export interface AdminReorderPayload {
  ids: number[];
}

// Single step reorder payload
export interface AdminSingleReorderPayload {
  sort_order: number;
}

// Fix: AdminHomePageContent
// processSteps: unknown[]  →  processSteps: AdminProcessStep[]
```

```typescript
// app/types/website/home.types.ts

// Admin shape — includes id, sort_order, timestamps
export interface AdminProcessStepApiResponse {
  id: number;
  step_number: number;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// Public shape — already exists as ProcessStepApiResponse (step_number, title, desc)
// No changes needed to ProcessStepApiResponse
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types

---

## Phase 2 — Admin API Layer

**Objective**: Add process-steps CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetProcessSteps()`, `adminCreateProcessStep()`, `adminUpdateProcessStep()`, `adminDeleteProcessStep()`, `adminReorderProcessSteps()`, `adminSingleReorderProcessStep()` |

### Key API Functions

```typescript
// GET /api/admin/process-steps
export async function adminGetProcessSteps(): Promise<AdminProcessStep[]>

// POST /api/admin/process-steps
export async function adminCreateProcessStep(
  data: AdminCreateProcessStepPayload
): Promise<AdminProcessStep>

// PUT /api/admin/process-steps/:id
export async function adminUpdateProcessStep(
  id: number,
  data: AdminUpdateProcessStepPayload
): Promise<AdminProcessStep>

// DELETE /api/admin/process-steps/:id
export async function adminDeleteProcessStep(id: number): Promise<void>

// PATCH /api/admin/process-steps/reorder — bulk reorder
export async function adminReorderProcessSteps(
  ids: number[]
): Promise<AdminProcessStep[]>

// PATCH /api/admin/process-steps/:id/reorder — single step reorder
export async function adminSingleReorderProcessStep(
  id: number,
  sort_order: number
): Promise<AdminProcessStep>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/post/put/delete/patch` with `withCredentials: true`
- `delete` returns `void` (204 No Content)

---

## Phase 3 — New Hook: `useProcessSteps`

**Objective**: Create a dedicated hook for process steps CRUD with its own state management, separate from section-level text editing.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/admin/useProcessSteps.ts` | **Create** — process steps state hook |

### Hook Structure

```typescript
export function useProcessSteps() {
  // State
  const [items, setItems] = useState<AdminProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  const fetchItems = useCallback(async () => { ... }, []);

  // CRUD operations — each does API call + local state update + toast
  const createItem = async (data: AdminCreateProcessStepPayload) => { ... };
  const updateItem = async (id: number, data: AdminUpdateProcessStepPayload) => { ... };
  const deleteItem = async (id: number) => { ... };
  const reorderItems = async (ids: number[]) => { ... };
  const singleReorderItem = async (id: number, sort_order: number) => { ... };

  return { items, isLoading, error, fetchItems, createItem, updateItem, deleteItem, reorderItems, singleReorderItem };
}
```

### Key Behaviors
- Fetches `GET /api/admin/process-steps` on mount
- Each CRUD operation updates local state optimistically, then reverts on error
- Shows sonner toasts for success/error
- Exposes `isLoading` and `error` for UI states

### Verification
- Hook fetches on mount and makes proper API calls
- CRUD operations update local state correctly
- Error handling with toast messages works
- Loading/error states propagate correctly

---

## Phase 4 — AdminProcessSectionControl Rewrite

**Objective**: Completely rewrite `AdminProcessSectionControl` to:
- Fetch process steps from `GET /api/admin/process-steps` (not from SSR props)
- Allow full CRUD: add, edit (bilingual), delete, reorder
- Show loading skeleton, empty state, error state
- Keep section-level text editing (label, heading, description) via existing flow

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminProcessSectionControl.tsx` | **Full rewrite** |
| `app/_components/website/_admin/AdminProcessStepForm.tsx` | **Create** — form modal for creating/editing process steps |
| `app/_components/website/_admin/AdminProcessStepCard.tsx` | **Create** — single step card with edit/delete/drag actions |

### Component Architecture

```
AdminProcessSectionControl
├── Section-level text (label, heading, description) — via existing EditableText + context
├── Loading skeleton (when fetching process steps)
├── Empty state with "Add First Process Step" button
├── Error state with retry button
├── Process steps grid
│   └── AdminProcessStepCard (per step)
│       ├── Step number badge (editable inline)
│       ├── Title (editable inline — bilingual popup)
│       ├── Description (editable inline — bilingual popup)
│       ├── Edit button → opens AdminProcessStepForm
│       ├── Delete button → confirmation → DELETE
│       └── Drag handle → reorder
├── "Add Process Step" button → opens AdminProcessStepForm (create mode)
└── AdminProcessStepForm (modal)
    ├── Step Number (number input, required, min 1)
    ├── Title EN (text input, max 200 chars)
    ├── Title AR (text input, max 200 chars)
    ├── Description EN (textarea, max 2000 chars, character counter)
    ├── Description AR (textarea, max 2000 chars, character counter)
    └── Save button → POST or PUT
```

### AdminProcessStepForm Props

```typescript
interface AdminProcessStepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateProcessStepPayload | AdminUpdateProcessStepPayload) => Promise<void>;
  initialData?: AdminProcessStep; // undefined = create mode, defined = edit mode
  isSaving: boolean;
}
```

### Key Behaviors
- **Create**: `POST /api/admin/process-steps` → add to local state → toast success
- **Edit**: `PUT /api/admin/process-steps/:id` → update in local state → toast success
- **Delete**: confirmation dialog → `DELETE /api/admin/process-steps/:id` → remove from local state → toast success
- **Reorder**: drag drop → `PATCH /api/admin/process-steps/reorder` with `{ ids: [...] }` → reorder local state → toast
- **Section-level text**: unchanged — still uses `EditableText` + `PROCESS_FIELD_API_MAP` + `AdminEditorContext`

### Verification
- Add a process step → appears in grid
- Edit any field of a step (including bilingual title/desc) → updates correctly
- Delete a step → removed from grid
- Reorder steps → order persists on re-fetch
- Section-level text (label, heading, description) still works via existing flow
- Empty state shown when no steps
- Error state shown when fetch fails, with retry button
- Loading skeleton during initial fetch

---

## Phase 5 — InlineEditPopup & AdminEditPopup Adjustments

**Objective**: Minor adjustments to reusable popup components to support process step editing patterns.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/InlineEditPopup.tsx` | Add `type="number"` support for step_number field. Add support for bilingual child item fields (show EN/AR inputs when field is bilingual). |
| `app/_components/website/_admin/AdminEditPopup.tsx` | Update `FIELD_LABELS` to include process step fields. Support child item bilingual editing. |
| `app/_components/website/_admin/AdminSaveBar.tsx` | Update copy for process step changes saved immediately vs section-level queued. Move translations to i18n files. |

### Verification
- Single-field popup works for step_number
- Bilingual popup works for title and description (EN + AR)
- Save bar correctly shows only section-level unsaved changes (process steps save immediately)

---

## Phase 6 — Public ProcessSection Improvements

**Objective**: Add loading, error, and empty states to the public `ProcessSection.tsx`.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/ProcessSection.tsx` | Add empty state handling. Add graceful null/undefined field handling. Ensure RTL support via `dir` attribute. |

### Key Changes
- If `process.items` is empty array → hide the entire section (or show subtle empty state)
- If any field is null/undefined → hide that element or show fallback
- Ensure `dir={locale === "ar" ? "rtl" : "ltr"}` is applied (currently missing in public component)
- Keep existing scroll reveal animation

### Verification
- Empty items array → section hidden or shows fallback
- Null fields → elements hidden gracefully
- Arabic locale → RTL layout applied
- Scroll reveal animation still works

---

## Phase 7 — Translations

**Objective**: Add all process-section-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.processSection.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "processSection": {
      "title": "Process Section",
      "addStep": "Add Process Step",
      "editStep": "Edit Process Step",
      "deleteStep": "Delete Step",
      "confirmDelete": "Are you sure you want to delete this process step?",
      "noSteps": "No process steps yet. Click \"Add Process Step\" to create one.",
      "fieldLabels": {
        "stepNumber": "Step Number",
        "titleEn": "Title (English)",
        "titleAr": "Title (Arabic)",
        "descEn": "Description (English)",
        "descAr": "Description (Arabic)"
      },
      "placeholders": {
        "stepNumber": "e.g. 1",
        "titleEn": "e.g. Submit Application",
        "titleAr": "e.g. تقديم الطلب",
        "descEn": "Describe this step...",
        "descAr": "صف هذه الخطوة..."
      },
      "toasts": {
        "created": "Process step created successfully",
        "updated": "Process step updated successfully",
        "deleted": "Process step deleted successfully",
        "reordered": "Process steps reordered successfully",
        "createError": "Failed to create process step",
        "updateError": "Failed to update process step",
        "deleteError": "Failed to delete process step",
        "reorderError": "Failed to reorder process steps",
        "fetchError": "Failed to load process steps"
      },
      "emptyState": "No process steps configured",
      "loading": "Loading process steps...",
      "validation": {
        "stepNumberRequired": "Step number is required",
        "stepNumberMin": "Step number must be at least 1",
        "titleMax": "Title must be 200 characters or less",
        "descMax": "Description must be 2000 characters or less"
      }
    }
  }
}
```

### Verification
- All admin UI text in process section is pulled from translation files
- Both EN and AR locales have all keys
- Toast messages use translation keys

---

## Phase 8 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for the process admin section.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminDashboardPage.ts` | **Create** — POM for admin dashboard (process section focused) |
| `.env.test.example` | **Create** — template for test env vars |
| `.gitignore` | **Modify** — add `playwright/.auth/`, `playwright-report/`, `test-results/` |

### Playwright Config

```typescript
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Page Object Models

**AdminLoginPage**:
```typescript
export class AdminLoginPage {
  async goto() { await this.page.goto("/en/admin"); }
  async login(email: string, password: string) { ... }
  async expectErrorMessage(message: string) { ... }
}
```

**AdminDashboardPage** (process section focused):
```typescript
export class AdminDashboardPage {
  async goto() { await this.page.goto("/en/admin"); }
  async addProcessStep(data: ProcessStepFormData) { ... }
  async editProcessStep(id: number, data: Partial<ProcessStepFormData>) { ... }
  async deleteProcessStep(id: number) { ... }
  async reorderProcessSteps(orderedIds: number[]) { ... }
  async getProcessStepsCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 9 — Playwright Process Section E2E Tests

**Objective**: Write comprehensive E2E tests for the process admin section.

### Files Affected

| File | Action |
|---|---|
| `tests/process-admin.spec.ts` | **Create** — all process admin E2E tests |

### Test Scenarios

```typescript
test.describe("Process Section — Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays process steps list when steps exist", async ({ adminPage }) => {
    // Mock GET /api/admin/process-steps to return 3 steps
    // Assert grid shows 3 cards
    // Assert each card shows step_number badge, title, desc
  });

  test("shows empty state when no process steps", async ({ adminPage }) => {
    // Mock GET /api/admin/process-steps to return []
    // Assert empty state message is visible
    // Assert "Add Process Step" button is visible
  });

  test("creates a new process step", async ({ adminPage }) => {
    // Click "Add Process Step"
    // Fill form: step_number, title_en, title_ar, desc_en, desc_ar
    // Submit
    // Assert POST called with correct payload
    // Assert new card appears in grid
    // Assert success toast
  });

  test("edits an existing process step", async ({ adminPage }) => {
    // Mock GET returning 1 step
    // Click edit on card
    // Change step_number, title_en, desc_en
    // Submit
    // Assert PUT /api/admin/process-steps/:id called with correct payload
    // Assert updated values in card
    // Assert success toast
  });

  test("edits bilingual title and description (EN + AR)", async ({ adminPage }) => {
    // Open edit for a process step
    // Change title_en, title_ar, desc_en, desc_ar
    // Submit
    // Assert PUT payload has all four fields
  });

  test("deletes a process step with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 steps
    // Click delete on first card
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/process-steps/:id called
    // Assert card removed from grid
    // Assert success toast
  });

  test("cancels delete of a process step", async ({ adminPage }) => {
    // Click delete on a card
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert card still visible
  });

  test("reorders process steps via drag and drop", async ({ adminPage }) => {
    // Mock GET returning [step1, step2] with sort_order 1, 2
    // Drag step2 above step1
    // Assert PATCH /api/admin/process-steps/reorder called with [2, 1]
    // Assert new order reflected in UI
  });

  test("shows loading state during fetch", async ({ adminPage, page }) => {
    // Intercept GET with delayed response
    // Assert loading skeleton visible
    // Wait for response
    // Assert grid visible, skeleton hidden
  });

  test("shows error state on fetch failure", async ({ adminPage, page }) => {
    // Mock GET to return 500
    // Assert error message visible
    // Assert retry button visible
    // Click retry
    // Assert GET called again
  });

  test("shows validation errors on create form", async ({ adminPage }) => {
    // Click "Add Process Step"
    // Submit empty form (step_number required)
    // Assert validation message for step_number
  });

  test("character counter on description fields", async ({ adminPage }) => {
    // Open create form
    // Type in desc_en
    // Assert character counter updates
    // Assert max 2000 chars enforced
  });

  test("section-level text (label/heading/description) still editable", async ({ adminPage }) => {
    // Click on process label text
    // Edit in popup
    // Save
    // Assert PUT /api/admin/home-page-content called with process_label_en/ar
  });

  test("persists process steps after page reload", async ({ adminPage, page }) => {
    // Create a process step
    // Reload page
    // Assert step still displayed (GET returns the created step)
  });

  test("handles 404 on update of deleted step", async ({ adminPage }) => {
    // Mock PUT to return 404
    // Assert error toast "Step no longer exists"
    // Assert list refreshes
  });

  test("handles 401 redirect on expired session", async ({ adminPage, page }) => {
    // Mock auth check to return 401
    // Assert redirected to login page
  });

  test("bulk reorder with 4+ steps", async ({ adminPage }) => {
    // Mock GET returning 4 steps
    // Reorder to [3, 1, 4, 2]
    // Assert PATCH called with correct ids array
    // Assert new order in UI
  });
});
```

### Testing Strategy
- **API Mocking**: Use `page.route("**/api/admin/**"` to intercept all process steps API calls and return controlled responses.
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate, then mock the process-steps endpoints independently.
- **Data isolation**: Each test mocks its own API responses — no shared state.
- **Locators**: Use `data-testid` attributes on key elements (add button, step cards, form fields, delete button, confirmation dialog).

### Verification
- `npx playwright test tests/process-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API
- Tests are stable (no flakiness from real API)

---

## Phase 10 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all process step operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminProcessStepForm.tsx` | Add field-level validation (step_number required/min 1, title max 200 chars, desc max 2000 chars with counter) |
| `app/hooks/admin/useProcessSteps.ts` | Add proper error handling, retry logic, and toast messages |

### Validation Rules

| Field | Rules |
|---|---|
| `step_number` | Required, integer, min 1 |
| `title_en` | Optional, max 200 chars |
| `title_ar` | Optional, max 200 chars |
| `desc_en` | Optional, max 2000 chars — show character counter |
| `desc_ar` | Optional, max 2000 chars — show character counter |

### Verification
- Invalid inputs show field-level error messages
- "Step Number" field only accepts integers
- Max lengths enforced with visual feedback
- Backend 400 errors surface as toast messages with field details

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add process step types + fix `processSteps: unknown[]` |
| 2 | `app/types/website/home.types.ts` | P1 | Add `AdminProcessStepApiResponse` type |
| 3 | `app/helpers/api/adminApi.ts` | P2 | Add process steps CRUD functions |
| 4 | `app/hooks/admin/useProcessSteps.ts` | P3 | **Create** — process steps state hook |
| 5 | `app/_components/website/_admin/AdminProcessSectionControl.tsx` | P4 | **Rewrite** — full CRUD UI |
| 6 | `app/_components/website/_admin/AdminProcessStepForm.tsx` | P4 | **Create** — add/edit form modal |
| 7 | `app/_components/website/_admin/AdminProcessStepCard.tsx` | P4 | **Create** — step card with actions |
| 8 | `app/_components/website/_admin/InlineEditPopup.tsx` | P5 | Add number type + bilingual support |
| 9 | `app/_components/website/_admin/AdminEditPopup.tsx` | P5 | Update field labels for process steps |
| 10 | `app/_components/website/_admin/AdminSaveBar.tsx` | P5 | Minor copy updates |
| 11 | `app/_components/website/_home/ProcessSection.tsx` | P6 | Add empty state + RTL support |
| 12 | `translations/en.json` | P7 | Add process section keys |
| 13 | `translations/ar.json` | P7 | Add process section keys |
| 14 | `playwright.config.ts` | P8 | **Create** — playwright config |
| 15 | `tests/auth.setup.ts` | P8 | **Create** — admin auth setup |
| 16 | `tests/pages/AdminLoginPage.ts` | P8 | **Create** — login POM |
| 17 | `tests/pages/AdminDashboardPage.ts` | P8 | **Create** — dashboard POM |
| 18 | `tests/fixtures/index.ts` | P8 | **Create** — test fixtures |
| 19 | `tests/process-admin.spec.ts` | P9 | **Create** — all process E2E tests |
| 20 | `app/_components/website/_admin/AdminProcessStepForm.tsx` | P10 | Add validation |
| 21 | `app/hooks/admin/useProcessSteps.ts` | P10 | Add error handling polish |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET/POST/PUT/DELETE /api/admin/process-steps`, `PATCH /api/admin/process-steps/reorder`, `PATCH /api/admin/process-steps/:id/reorder`. **Must verify with backend team** before Phase 2. The integration plan (`plans/PROCESS_INTEGRATION_PLAN.md`) specifies these endpoints but they may not be implemented yet.

2. **No drag-and-drop library installed** — `@dnd-kit/core` or similar not in `package.json`. Two options:
   - **Option A**: Install `@dnd-kit/core` + `@dnd-kit/sortable` for true drag-and-drop
   - **Option B**: Use up/down arrow buttons for reorder (simpler, no extra dependency)
   - **Decision needed** before Phase 4.

3. **`data-testid` additions** — existing components may need `data-testid` attributes added for Playwright locators. These must be added before or during Phase 8.

4. **Auth setup for tests** — assumes the login API (`POST /auth/login`) is working and the test credentials are valid. Need `.env.test` with real test credentials.

5. **Existing `AdminPageClient` uses `data: any`** — not in scope but worth noting as a follow-up. The process section data passed via SSR props will be superseded by the `useProcessSteps` hook fetching from admin API.

6. **Section header update is shared across all sections** — `PUT /api/admin/home-page-content` updates ALL sections at once. The frontend should:
   - First `GET /api/admin/home-page-content` to get current state (done by `useAdminHomeContent`)
   - Modify only the process header fields
   - `PUT` with the full object (or just the changed fields — partial update works)
   - This is already the pattern used by `useAdminHomeContent` — no change needed.

7. **Public endpoint returns 404 if no seed** — If `home_page_content` row does not exist, the public endpoint returns `404`. The public `ProcessSection` should handle this gracefully (Phase 6).

8. **Character encoding for Arabic text** — Ensure all textarea inputs properly handle Arabic RTL text input and display. Test with actual Arabic content before Phase 10.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 8:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 9:
npx playwright test tests/process-admin.spec.ts --project=chromium

# Full check:
pnpm build  # ensures build doesn't break
```
