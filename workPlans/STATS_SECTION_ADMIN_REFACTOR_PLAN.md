# Stats Section — Admin Control Refactoring Plan

## Overview

Focus: Refactor the **Stats Section** admin control (`AdminStatsSectionControl.tsx`) to properly integrate with the backend API contract defined in `plans/STATS_INTEFRATION_PLAN.md`.

**Problem**: The current implementation:
1. **No child item CRUD API** — `adminApi.ts` has zero functions for stat-items endpoints (`GET/POST/PUT/DELETE /api/admin/stat-items`, `PATCH /api/admin/stat-items/reorder`)
2. **Wrong save path** — Child items are saved through `setField()` → `dirtyFields` → `PUT /api/admin/home-page-content` instead of dedicated stat-items endpoints
3. **No add/delete/reorder** — Only inline editing; no creation, deletion, or reordering
4. **Bilingual data loss** — `openChildItemEditor(fieldKey, currentValue)` is single-field only; stat items have `label_en`/`label_ar`
5. **Type safety gaps** — `statItems: unknown[]`, `data: any` in AdminPageClient
6. **No E2E tests** — zero coverage for stats admin flows

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for stat items admin CRUD that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminStatItem`, `AdminCreateStatItemPayload`, `AdminUpdateStatItemPayload`, `AdminStatItemListResponse`, `AdminReorderPayload` types. Add `STAT_ITEM_FIELD_API_MAP` as bilingual map. Fix `AdminHomePageContent` (remove `statItems: unknown[]`). Fix `AdminHomeContentUpdatePayload`. |

### Key Type Additions

```typescript
// Stat Item — admin API response shape
export interface AdminStatItem {
  id: number;
  icon: string;
  target: number;
  suffix: string;
  label_en: string;
  label_ar: string;
  sort_order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Create payload
export interface AdminCreateStatItemPayload {
  icon?: string;
  target?: number;
  suffix?: string;
  label_en?: string;
  label_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

// Update payload (all optional, no homePageContentId)
export type AdminUpdateStatItemPayload = Partial<Omit<AdminCreateStatItemPayload, 'homePageContentId'>>;

// Reorder payload
export interface AdminReorderPayload {
  ids: number[];
}

// Fix child item maps to be bilingual
export const STAT_ITEM_FIELD_API_MAP: Record<string, { en: string; ar: string } | string> = {
  icon: "icon",
  target: "target",
  suffix: "suffix",
  label: { en: "label_en", ar: "label_ar" },
};
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types

---

## Phase 2 — Admin API Layer

**Objective**: Add stat-items CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetStatItems()`, `adminCreateStatItem()`, `adminUpdateStatItem()`, `adminDeleteStatItem()`, `adminReorderStatItems()` |

### Key API Functions

```typescript
// GET /api/admin/stat-items
export async function adminGetStatItems(): Promise<AdminStatItem[]>

// POST /api/admin/stat-items
export async function adminCreateStatItem(data: AdminCreateStatItemPayload): Promise<AdminStatItem>

// PUT /api/admin/stat-items/:id
export async function adminUpdateStatItem(id: number, data: AdminUpdateStatItemPayload): Promise<AdminStatItem>

// DELETE /api/admin/stat-items/:id
export async function adminDeleteStatItem(id: number): Promise<void>

// PATCH /api/admin/stat-items/reorder — bulk reorder
export async function adminReorderStatItems(ids: number[]): Promise<AdminStatItem[]>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/post/put/delete/patch` with `withCredentials: true`
- Test with real backend (or mock)

---

## Phase 3 — Admin Editor Context Refactor (Stats Only)

**Objective**: Refactor `useAdminHomeContent` to handle **section-level text** (label, heading, description) only. Add `useStatItems` hook for child item CRUD with its own state management.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/admin/useAdminHomeContent.ts` | **Rewrite** — strip out child item handling. Keep only section-level text dirty tracking. Fix dirty count logic to be explicit. Expose `isLoading`, `fetchError`. |
| `app/contexts/AdminEditorContext.tsx` | **Modify** — expose loading/fetchError from hook. Remove child-item-specific context methods (they move to the section control). |

### New Hook: `useStatItems`

Create `app/hooks/admin/useStatItems.ts`:

```typescript
export function useStatItems() {
  // State
  const [items, setItems] = useState<AdminStatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  const fetchItems = useCallback(async () => { ... }, []);

  // CRUD operations — each does API call + local state update + toast
  const createItem = async (data: AdminCreateStatItemPayload) => { ... };
  const updateItem = async (id: number, data: AdminUpdateStatItemPayload) => { ... };
  const deleteItem = async (id: number) => { ... };
  const reorderItems = async (ids: number[]) => { ... };

  return { items, isLoading, error, fetchItems, createItem, updateItem, deleteItem, reorderItems };
}
```

### Verification
- Section-level text still editable and saves via `PUT /api/admin/home-page-content`
- `useStatItems` fetches on mount and makes proper API calls
- Loading/error states propagate correctly

---

## Phase 4 — AdminStatsSectionControl Rewrite

**Objective**: Completely rewrite `AdminStatsSectionControl` to:
- Fetch stat items from `GET /api/admin/stat-items` (not from SSR props)
- Allow full CRUD: add, edit (bilingual), delete, reorder
- Show loading skeleton, empty state, error state
- Keep section-level text editing (label, heading, description) via existing flow

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminStatsSectionControl.tsx` | **Full rewrite** |
| `app/_components/website/_admin/AdminStatItemForm.tsx` | **Create** — form modal for creating/editing stat items |
| `app/_components/website/_admin/AdminStatCard.tsx` | **Create** — single stat card with edit/delete actions |

### Component Architecture

```
AdminStatsSectionControl
├── Section-level text (label, heading, description) — via existing EditableText + context
├── Loading skeleton (when fetching stat items)
├── Empty state with "Add First Stat Item" button
├── Error state with retry button
├── Stat items grid
│   └── AdminStatCard (per item)
│       ├── Icon preview
│       ├── Target + suffix (editable inline via popup)
│       ├── Label (editable inline — bilingual)
│       ├── Edit button → opens AdminStatItemForm
│       ├── Delete button → confirmation → DELETE
│       └── Drag handle → reorder
├── "Add Stat Item" button → opens AdminStatItemForm (create mode)
└── AdminStatItemForm (modal)
    ├── Icon field (text input)
    ├── Target field (number input)
    ├── Suffix field (text input)
    ├── Label EN (text input)
    ├── Label AR (text input)
    └── Save button → POST or PUT
```

### AdminStatItemForm Props

```typescript
interface AdminStatItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateStatItemPayload | AdminUpdateStatItemPayload) => Promise<void>;
  initialData?: AdminStatItem; // undefined = create mode, defined = edit mode
  isSaving: boolean;
}
```

### Key Behaviors
- **Create**: `POST /api/admin/stat-items` → add to local state → toast success
- **Edit**: `PUT /api/admin/stat-items/:id` → update in local state → toast success
- **Delete**: confirmation dialog → `DELETE /api/admin/stat-items/:id` → remove from local state → toast success
- **Reorder**: drag drop → `PATCH /api/admin/stat-items/reorder` with `{ ids: [...] }` → reorder local state → toast

### Verification
- Add a stat item → appears in grid
- Edit any field of a stat item (including bilingual label) → updates correctly
- Delete a stat item → removed from grid
- Reorder stat items → order persists on re-fetch
- Section-level text (label, heading, description) still works via existing flow
- Empty state shown when no items
- Error state shown when fetch fails, with retry button
- Loading skeleton during initial fetch

---

## Phase 5 — InlineEditPopup & SaveBar Adjustments

**Objective**: Minor adjustments to reusable popup/save-bar components to support stat item editing patterns.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/InlineEditPopup.tsx` | Add `type="number"` support for target field. Add support for bilingual child item fields (show EN/AR inputs when field is bilingual). |
| `app/_components/website/_admin/AdminEditPopup.tsx` | Update `FIELD_LABELS` to include stat item fields. Support child item bilingual editing. |
| `app/_components/website/_admin/AdminSaveBar.tsx` | Update copy for stat item changes saved immediately vs section-level queued. Move translations to i18n files. |

### Verification
- Single-field popup works for target, suffix, icon
- Bilingual popup works for label (EN + AR)
- Save bar correctly shows only section-level unsaved changes (stat items save immediately)

---

## Phase 6 — Translations

**Objective**: Add all stat-section-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.statsSection.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "statsSection": {
      "title": "Statistics Section",
      "addItem": "Add Stat Item",
      "editItem": "Edit Stat Item",
      "deleteItem": "Delete Item",
      "confirmDelete": "Are you sure you want to delete this stat item?",
      "noItems": "No stat items yet. Click \"Add Stat Item\" to create one.",
      "fieldLabels": {
        "icon": "Icon",
        "target": "Target Number",
        "suffix": "Suffix",
        "labelEn": "Label (English)",
        "labelAr": "Label (Arabic)"
      },
      "toasts": {
        "created": "Stat item created successfully",
        "updated": "Stat item updated successfully",
        "deleted": "Stat item deleted successfully",
        "reordered": "Stat items reordered successfully",
        "createError": "Failed to create stat item",
        "updateError": "Failed to update stat item",
        "deleteError": "Failed to delete stat item",
        "reorderError": "Failed to reorder stat items",
        "fetchError": "Failed to load stat items"
      },
      "emptyState": "No statistics items yet",
      "loading": "Loading stat items..."
    }
  }
}
```

### Verification
- All admin UI text in stats section is pulled from translation files
- Both EN and AR locales have all keys

---

## Phase 7 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for the stats admin section.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminDashboardPage.ts` | **Create** — POM for admin dashboard (stats section) |
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
  workers: 1, // serial for auth state
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
  // emailInput, passwordInput, submitButton, errorMessage
  async goto() { await this.page.goto("/en/admin"); }
  async login(email: string, password: string) { ... }
  async expectErrorMessage(message: string) { ... }
}
```

**AdminDashboardPage** (stats section focused):
```typescript
export class AdminDashboardPage {
  // statsSection, statCards, addItemButton, statItemForm, etc.
  async goto() { await this.page.goto("/en/admin"); }
  async addStatItem(data: StatItemFormData) { ... }
  async editStatItem(id: number, data: Partial<StatItemFormData>) { ... }
  async deleteStatItem(id: number) { ... }
  async getStatItemsCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 8 — Playwright Stats Section E2E Tests

**Objective**: Write comprehensive E2E tests for the stats admin section.

### Files Affected

| File | Action |
|---|---|
| `tests/stats-admin.spec.ts` | **Create** — all stats admin E2E tests |

### Test Scenarios

```typescript
test.describe("Stats Section — Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays stat items list when items exist", async ({ adminPage }) => {
    // Mock GET /api/admin/stat-items to return 2 items
    // Assert grid shows 2 cards
    // Assert each card shows target, suffix, label
  });

  test("shows empty state when no stat items", async ({ adminPage }) => {
    // Mock GET /api/admin/stat-items to return []
    // Assert empty state message is visible
    // Assert "Add Stat Item" button is visible
  });

  test("creates a new stat item", async ({ adminPage }) => {
    // Click "Add Stat Item"
    // Fill form: icon, target, suffix, label_en, label_ar
    // Submit
    // Assert POST called with correct payload
    // Assert new card appears in grid
    // Assert success toast
  });

  test("edits an existing stat item", async ({ adminPage }) => {
    // Mock GET returning 1 item
    // Click edit on card
    // Change target, label_en
    // Submit
    // Assert PUT /api/admin/stat-items/:id called with correct payload
    // Assert updated values in card
    // Assert success toast
  });

  test("edits bilingual label (EN + AR)", async ({ adminPage }) => {
    // Open edit for a stat item
    // Change label_en and label_ar
    // Submit
    // Assert PUT payload has both label_en and label_ar
  });

  test("deletes a stat item with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 items
    // Click delete on first card
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/stat-items/:id called
    // Assert card removed from grid
    // Assert success toast
  });

  test("cancels delete of a stat item", async ({ adminPage }) => {
    // Click delete on a card
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert card still visible
  });

  test("reorders stat items via drag and drop", async ({ adminPage }) => {
    // Mock GET returning [item1, item2] with sort_order 1, 2
    // Drag item2 above item1
    // Assert PATCH /api/admin/stat-items/reorder called with [2, 1]
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
    // Assert GET called again (or mock updated to succeed)
  });

  test("shows validation errors on create form", async ({ adminPage }) => {
    // Click "Add Stat Item"
    // Submit empty form
    // Assert validation messages for required fields
  });

  test("section-level text (label/heading/description) still editable", async ({ adminPage }) => {
    // Click on stats label text
    // Edit in popup
    // Save
    // Assert PUT /api/admin/home-page-content called with stats_label_en/ar
  });

  test("persists stat items after page reload", async ({ adminPage, page }) => {
    // Create a stat item
    // Reload page
    // Assert item still displayed (GET returns the created item)
  });

  test("handles 404 on update of deleted item", async ({ adminPage }) => {
    // Mock PUT to return 404
    // Assert error toast "Item no longer exists"
    // Assert list refreshes
  });

  test("handles 401 redirect on expired session", async ({ adminPage, page }) => {
    // Mock auth check to return 401
    // Assert redirected to login page
  });
});
```

### Testing Strategy

- **API Mocking**: Use `page.route("**/api/admin/**"` to intercept all stat items API calls and return controlled responses. This isolates tests from backend dependencies.
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate, then mock the stat-items endpoints independently.
- **Data isolation**: Each test mocks its own API responses — no shared state.
- **Locators**: Use `data-testid` attributes on key elements (add button, stat cards, form fields, delete button, confirmation dialog).

### Verification
- `npx playwright test tests/stats-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API
- Tests are stable (no flakiness from real API)

---

## Phase 9 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all stat item operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminStatItemForm.tsx` | Add field-level validation (target min 0, icon max 100 chars, suffix max 20 chars, label max 200 chars) |
| `app/hooks/admin/useStatItems.ts` | Add proper error handling, retry logic, and toast messages |

### Validation Rules

| Field | Rules |
|---|---|
| `icon` | Optional, max 100 chars |
| `target` | Optional, integer, min 0 |
| `suffix` | Optional, max 20 chars |
| `label_en` | Optional, max 200 chars |
| `label_ar` | Optional, max 200 chars |

### Verification
- Invalid inputs show field-level error messages
- "Target" field only accepts numbers
- Max lengths enforced
- Backend 400 errors surface as toast messages

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add stat item types + fix maps |
| 2 | `app/helpers/api/adminApi.ts` | P2 | Add stat items CRUD |
| 3 | `app/hooks/admin/useAdminHomeContent.ts` | P3 | Strip child item logic |
| 4 | `app/hooks/admin/useStatItems.ts` | P3 | **Create** — stat items state hook |
| 5 | `app/contexts/AdminEditorContext.tsx` | P3 | Expose loading/fetchError |
| 6 | `app/_components/website/_admin/AdminStatsSectionControl.tsx` | P4 | **Rewrite** — full CRUD UI |
| 7 | `app/_components/website/_admin/AdminStatItemForm.tsx` | P4 | **Create** — add/edit form modal |
| 8 | `app/_components/website/_admin/AdminStatCard.tsx` | P4 | **Create** — stat card with actions |
| 9 | `app/_components/website/_admin/InlineEditPopup.tsx` | P5 | Add number type + bilingual support |
| 10 | `app/_components/website/_admin/AdminEditPopup.tsx` | P5 | Update field labels |
| 11 | `app/_components/website/_admin/AdminSaveBar.tsx` | P5 | Minor copy updates |
| 12 | `translations/en.json` | P6 | Add stats section keys |
| 13 | `translations/ar.json` | P6 | Add stats section keys |
| 14 | `playwright.config.ts` | P7 | **Create** — playwright config |
| 15 | `tests/auth.setup.ts` | P7 | **Create** — admin auth setup |
| 16 | `tests/pages/AdminLoginPage.ts` | P7 | **Create** — login POM |
| 17 | `tests/pages/AdminDashboardPage.ts` | P7 | **Create** — dashboard POM |
| 18 | `tests/fixtures/index.ts` | P7 | **Create** — test fixtures |
| 19 | `tests/stats-admin.spec.ts` | P8 | **Create** — all stats E2E tests |
| 20 | `app/_components/website/_admin/AdminStatItemForm.tsx` | P9 | Add validation |
| 21 | `app/hooks/admin/useStatItems.ts` | P9 | Add error handling |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET/POST/PUT/DELETE /api/admin/stat-items` and `PATCH /api/admin/stat-items/reorder`. **Must verify with backend team** before Phase 2.
2. **No drag-and-drop library installed** — `@dnd-kit/core` or similar not in `package.json`. Two options:
   - **Option A**: Install `@dnd-kit/core` + `@dnd-kit/sortable` for true drag-and-drop
   - **Option B**: Use up/down arrow buttons for reorder (simpler, no extra dependency)
   - **Decision needed** before Phase 4.
3. **`data-testid` additions** — existing components may need `data-testid` attributes added for Playwright locators. These must be added before or during Phase 7.
4. **Auth setup for tests** — assumes the login API (`POST /auth/login`) is working and the test credentials are valid. Need `.env.test` with real test credentials.
5. **Existing `AdminPageClient` uses `data: any`** — not in scope but worth noting as a follow-up.
6. **`useAdminHomeContent` still uses per-section SSR data maps** — currently resolves SSR fallback by checking `apiKey.startsWith("stats_")`. This heuristic works for section text but may cause edge cases. Suggested simplification: replace SSR data map with a flat `Record<string, string>` fallback directly from the admin API response.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 7:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 8:
npx playwright test tests/stats-admin.spec.ts --project=chromium

# Full check:
pnpm build  # ensures build doesn't break
```
