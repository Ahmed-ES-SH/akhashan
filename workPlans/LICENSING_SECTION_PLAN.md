# Licensing Section — Admin Control & Public Display Integration Plan

> **Scope**: Licensing section only — section header (label, heading, description) + individual licensing items (icon, bilingual title/desc/tag, sort_order, CRUD, reorder).
> **Date**: 2026-05-17
> **Status**: Draft

---

## Overview

Focus: Integrate the **Licensing Section** admin control (`AdminLicensingSectionControl.tsx`) and public display (`LicensingSection.tsx`) with the backend API contract defined in `plans/LICENSING_INTEGRATION_PLAN.md`.

**Current Problems**:

1. **No child item CRUD API** — `adminApi.ts` has zero functions for licensing-items endpoints (`GET/POST/PUT/DELETE /api/admin/licensing-items`, `PATCH /api/admin/licensing-items/reorder`, `PATCH /api/admin/licensing-items/:id/reorder`)
2. **Wrong data flow for items** — Items are passed as `LicensingItemApiResponse` (public shape with no `id`, `sort_order`, `createdAt`) to the admin component; admin needs full entity shape
3. **No add/delete/reorder** — Only inline editing of `title`, `desc`, `tag` via `openChildItemEditor`; no creation, deletion, or reordering of items
4. **Single-field-only child editing** — `openChildItemEditor(fieldKey, currentValue)` accepts a single string; licensing items have bilingual `title_en`/`title_ar`, `desc_en`/`desc_ar`, and `tag_en`/`tag_ar` that need paired editing
5. **Type safety gaps** — `licensingItems: unknown[]` in `AdminHomePageContent`; `LicensingItemApiResponse` lacks admin fields (`id`, `sort_order`, `homePageContentId`, `createdAt`, `updatedAt`)
6. **`LICENSING_ITEM_FIELD_API_MAP` is wrong** — Maps to single-field names (`title`, `desc`, `tag`) instead of bilingual (`title_en`, `title_ar`, etc.)
7. **Key stability issue** — `key={item.icon ?? i}` uses icon or index; should use `item.id`
8. **Tag always rendered** — Public component renders tag badge even when empty/null; should be conditional
9. **No E2E tests** — zero coverage for licensing admin flows
10. **Public section has no loading/error states** — `LicensingSection.tsx` assumes data is always present; no skeleton, empty state, or error handling

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for licensing items admin CRUD that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminLicensingItem`, `AdminCreateLicensingItemPayload`, `AdminUpdateLicensingItemPayload`, `AdminLicensingItemListResponse`, `AdminReorderPayload`, `AdminSingleReorderPayload` types. Fix `AdminHomePageContent.licensingItems` from `unknown[]` to `AdminLicensingItem[]`. Fix `LICENSING_ITEM_FIELD_API_MAP` to use bilingual keys. |
| `app/types/website/home.types.ts` | Add `AdminLicensingItemApiResponse` (admin shape with id, sort_order, etc.) — keep existing `LicensingItemApiResponse` for public. |

### Key Type Additions

```typescript
// app/types/website/admin.types.ts

// Licensing Item — admin API response shape (full entity)
export interface AdminLicensingItem {
  id: number;
  icon: string | null;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  tag_en: string | null;
  tag_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// Create payload
export interface AdminCreateLicensingItemPayload {
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  tag_en?: string;
  tag_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

// Update payload (all optional except id in URL)
export type AdminUpdateLicensingItemPayload = Partial<AdminCreateLicensingItemPayload>;

// Bulk reorder payload
export interface AdminReorderPayload {
  ids: number[];
}

// Single item reorder payload
export interface AdminSingleReorderPayload {
  sort_order: number;
}

// Fix: AdminHomePageContent
// licensingItems: unknown[]  →  licensingItems: AdminLicensingItem[]

// Fix: LICENSING_ITEM_FIELD_API_MAP — bilingual mapping
export const LICENSING_ITEM_FIELD_API_MAP: Record<string, { en: string; ar: string }> = {
  title: { en: "title_en", ar: "title_ar" },
  desc: { en: "desc_en", ar: "desc_ar" },
  tag: { en: "tag_en", ar: "tag_ar" },
  icon: { en: "icon", ar: "icon" }, // icon is not bilingual but keep consistent
};
```

```typescript
// app/types/website/home.types.ts

// Admin shape — includes id, sort_order, timestamps, bilingual fields
export interface AdminLicensingItemApiResponse {
  id: number;
  icon: string | null;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  tag_en: string | null;
  tag_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// Public shape — already exists as LicensingItemApiResponse (icon, title, desc, tag)
// No changes needed to LicensingItemApiResponse
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types

---

## Phase 2 — Admin API Layer

**Objective**: Add licensing-items CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetLicensingItems()`, `adminCreateLicensingItem()`, `adminUpdateLicensingItem()`, `adminDeleteLicensingItem()`, `adminReorderLicensingItems()`, `adminSingleReorderLicensingItem()` |

### Key API Functions

```typescript
// GET /api/admin/licensing-items
export async function adminGetLicensingItems(): Promise<AdminLicensingItem[]>

// POST /api/admin/licensing-items
export async function adminCreateLicensingItem(
  data: AdminCreateLicensingItemPayload
): Promise<AdminLicensingItem>

// PUT /api/admin/licensing-items/:id
export async function adminUpdateLicensingItem(
  id: number,
  data: AdminUpdateLicensingItemPayload
): Promise<AdminLicensingItem>

// DELETE /api/admin/licensing-items/:id
export async function adminDeleteLicensingItem(id: number): Promise<void>

// PATCH /api/admin/licensing-items/reorder — bulk reorder
export async function adminReorderLicensingItems(
  ids: number[]
): Promise<AdminLicensingItem[]>

// PATCH /api/admin/licensing-items/:id/reorder — single item reorder
export async function adminSingleReorderLicensingItem(
  id: number,
  sort_order: number
): Promise<AdminLicensingItem>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/post/put/delete/patch` with `withCredentials: true`
- `delete` returns `void` (204 No Content)

---

## Phase 3 — New Hook: `useLicensingItems`

**Objective**: Create a dedicated hook for licensing items CRUD with its own state management, separate from section-level text editing.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/admin/useLicensingItems.ts` | **Create** — licensing items state hook |

### Hook Structure

```typescript
export function useLicensingItems() {
  // State
  const [items, setItems] = useState<AdminLicensingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount
  const fetchItems = useCallback(async () => { ... }, []);

  // CRUD operations — each does API call + local state update + toast
  const createItem = async (data: AdminCreateLicensingItemPayload) => { ... };
  const updateItem = async (id: number, data: AdminUpdateLicensingItemPayload) => { ... };
  const deleteItem = async (id: number) => { ... };
  const reorderItems = async (ids: number[]) => { ... };
  const singleReorderItem = async (id: number, sort_order: number) => { ... };

  return { items, isLoading, error, fetchItems, createItem, updateItem, deleteItem, reorderItems, singleReorderItem };
}
```

### Key Behaviors
- Fetches `GET /api/admin/licensing-items` on mount
- Each CRUD operation updates local state optimistically, then reverts on error
- Shows sonner toasts for success/error
- Exposes `isLoading` and `error` for UI states

### Verification
- Hook fetches on mount and makes proper API calls
- CRUD operations update local state correctly
- Error handling with toast messages works
- Loading/error states propagate correctly

---

## Phase 4 — AdminLicensingSectionControl Rewrite

**Objective**: Completely rewrite `AdminLicensingSectionControl` to:
- Fetch licensing items from `GET /api/admin/licensing-items` (not from SSR props)
- Allow full CRUD: add, edit (bilingual), delete, reorder
- Show loading skeleton, empty state, error state
- Keep section-level text editing (label, heading, description) via existing flow

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminLicensingSectionControl.tsx` | **Full rewrite** |
| `app/_components/website/_admin/AdminLicensingItemForm.tsx` | **Create** — form modal for creating/editing licensing items |
| `app/_components/website/_admin/AdminLicensingItemCard.tsx` | **Create** — single item card with edit/delete/drag actions |

### Component Architecture

```
AdminLicensingSectionControl
├── Section-level text (label, heading, description) — via existing EditableText + context
├── Loading skeleton (when fetching licensing items)
├── Empty state with "Add First Licensing Item" button
├── Error state with retry button
├── Licensing items grid
│   └── AdminLicensingItemCard (per item)
│       ├── Icon preview (editable)
│       ├── Title (editable inline — bilingual popup)
│       ├── Description preview (editable inline — bilingual popup)
│       ├── Tag badge (editable inline — bilingual popup)
│       ├── Edit button → opens AdminLicensingItemForm
│       ├── Delete button → confirmation → DELETE
│       └── Drag handle → reorder
├── "Add Licensing Item" button → opens AdminLicensingItemForm (create mode)
└── AdminLicensingItemForm (modal)
    ├── Icon (text input, max 100 chars, optional — SVG filename or class)
    ├── Title EN (text input, max 200 chars)
    ├── Title AR (text input, max 200 chars)
    ├── Description EN (textarea, max 2000 chars, character counter)
    ├── Description AR (textarea, max 2000 chars, character counter)
    ├── Tag EN (text input, max 100 chars, optional — badge text)
    ├── Tag AR (text input, max 100 chars, optional — badge text)
    └── Save button → POST or PUT
```

### AdminLicensingItemForm Props

```typescript
interface AdminLicensingItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateLicensingItemPayload | AdminUpdateLicensingItemPayload) => Promise<void>;
  initialData?: AdminLicensingItem; // undefined = create mode, defined = edit mode
  isSaving: boolean;
}
```

### Key Behaviors
- **Create**: `POST /api/admin/licensing-items` → add to local state → toast success
- **Edit**: `PUT /api/admin/licensing-items/:id` → update in local state → toast success
- **Delete**: confirmation dialog → `DELETE /api/admin/licensing-items/:id` → remove from local state → toast success
- **Reorder**: drag drop → `PATCH /api/admin/licensing-items/reorder` with `{ ids: [...] }` → reorder local state → toast
- **Section-level text**: unchanged — still uses `EditableText` + `LICENSING_FIELD_API_MAP` + `AdminEditorContext`

### Verification
- Add a licensing item → appears in grid
- Edit any field of an item (including bilingual title/desc/tag) → updates correctly
- Delete an item → removed from grid
- Reorder items → order persists on re-fetch
- Section-level text (label, heading, description) still works via existing flow
- Empty state shown when no items
- Error state shown when fetch fails, with retry button
- Loading skeleton during initial fetch

---

## Phase 5 — InlineEditPopup & AdminEditPopup Adjustments

**Objective**: Minor adjustments to reusable popup components to support licensing item editing patterns.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/InlineEditPopup.tsx` | Add support for bilingual child item fields (show EN/AR inputs when field is bilingual). Add icon field support (text input with preview). |
| `app/_components/website/_admin/AdminEditPopup.tsx` | Update `FIELD_LABELS` to include licensing item fields. Support child item bilingual editing. |
| `app/_components/website/_admin/AdminSaveBar.tsx` | Update copy for licensing item changes saved immediately vs section-level queued. Move translations to i18n files. |

### Verification
- Bilingual popup works for title, description, and tag (EN + AR)
- Icon field editable with text input
- Save bar correctly shows only section-level unsaved changes (licensing items save immediately)

---

## Phase 6 — Public LicensingSection Improvements

**Objective**: Add loading, error, and empty states to the public `LicensingSection.tsx`.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/LicensingSection.tsx` | Add empty state handling. Add graceful null/undefined field handling. Ensure RTL support via `dir` attribute. Make tag rendering conditional. Fix key to use item.id or stable index. |

### Key Changes
- If `licensing.items` is empty array → hide the entire section (per integration plan recommendation)
- If any field is null/undefined → hide that element or show fallback
- Tag badge: only render if `item.tag` is present and non-empty
- Ensure `dir={locale === "ar" ? "rtl" : "ltr"}` is applied (currently missing in public component)
- Fix `key={item.icon ?? ""}` → use stable index or add `id` to public response type
- Keep existing scroll reveal animation

### Verification
- Empty items array → section hidden
- Null fields → elements hidden gracefully
- Tag with empty value → badge not rendered
- Arabic locale → RTL layout applied
- Scroll reveal animation still works

---

## Phase 7 — Translations

**Objective**: Add all licensing-section-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.licensingSection.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "licensingSection": {
      "title": "Licensing Section",
      "addItem": "Add Licensing Item",
      "editItem": "Edit Licensing Item",
      "deleteItem": "Delete Item",
      "confirmDelete": "Are you sure you want to delete this licensing item?",
      "noItems": "No licensing items yet. Click \"Add Licensing Item\" to create one.",
      "fieldLabels": {
        "icon": "Icon",
        "titleEn": "Title (English)",
        "titleAr": "Title (Arabic)",
        "descEn": "Description (English)",
        "descAr": "Description (Arabic)",
        "tagEn": "Tag (English)",
        "tagAr": "Tag (Arabic)"
      },
      "placeholders": {
        "icon": "e.g. icon-commercial.svg",
        "titleEn": "e.g. Commercial License",
        "titleAr": "e.g. ترخيص تجاري",
        "descEn": "Describe this licensing service...",
        "descAr": "صف خدمة الترخيص هذه...",
        "tagEn": "e.g. Popular",
        "tagAr": "e.g. شائع"
      },
      "toasts": {
        "created": "Licensing item created successfully",
        "updated": "Licensing item updated successfully",
        "deleted": "Licensing item deleted successfully",
        "reordered": "Licensing items reordered successfully",
        "createError": "Failed to create licensing item",
        "updateError": "Failed to update licensing item",
        "deleteError": "Failed to delete licensing item",
        "reorderError": "Failed to reorder licensing items",
        "fetchError": "Failed to load licensing items"
      },
      "emptyState": "No licensing items configured",
      "loading": "Loading licensing items...",
      "validation": {
        "iconMax": "Icon must be 100 characters or less",
        "titleMax": "Title must be 200 characters or less",
        "descMax": "Description must be 2000 characters or less",
        "tagMax": "Tag must be 100 characters or less"
      }
    }
  }
}
```

### Verification
- All admin UI text in licensing section is pulled from translation files
- Both EN and AR locales have all keys
- Toast messages use translation keys

---

## Phase 8 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for the licensing admin section.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminDashboardPage.ts` | **Create** — POM for admin dashboard (licensing section focused) |
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

**AdminDashboardPage** (licensing section focused):
```typescript
export class AdminDashboardPage {
  async goto() { await this.page.goto("/en/admin"); }
  async addLicensingItem(data: LicensingItemFormData) { ... }
  async editLicensingItem(id: number, data: Partial<LicensingItemFormData>) { ... }
  async deleteLicensingItem(id: number) { ... }
  async reorderLicensingItems(orderedIds: number[]) { ... }
  async getLicensingItemsCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 9 — Playwright Licensing Section E2E Tests

**Objective**: Write comprehensive E2E tests for the licensing admin section.

### Files Affected

| File | Action |
|---|---|
| `tests/licensing-admin.spec.ts` | **Create** — all licensing admin E2E tests |

### Test Scenarios

```typescript
test.describe("Licensing Section — Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays licensing items list when items exist", async ({ adminPage }) => {
    // Mock GET /api/admin/licensing-items to return 3 items
    // Assert grid shows 3 cards
    // Assert each card shows icon, title, desc preview, tag
  });

  test("shows empty state when no licensing items", async ({ adminPage }) => {
    // Mock GET /api/admin/licensing-items to return []
    // Assert empty state message is visible
    // Assert "Add Licensing Item" button is visible
  });

  test("creates a new licensing item", async ({ adminPage }) => {
    // Click "Add Licensing Item"
    // Fill form: icon, title_en, title_ar, desc_en, desc_ar, tag_en, tag_ar
    // Submit
    // Assert POST called with correct payload
    // Assert new card appears in grid
    // Assert success toast
  });

  test("edits an existing licensing item", async ({ adminPage }) => {
    // Mock GET returning 1 item
    // Click edit on card
    // Change icon, title_en, tag_en
    // Submit
    // Assert PUT /api/admin/licensing-items/:id called with correct payload
    // Assert updated values in card
    // Assert success toast
  });

  test("edits bilingual title, description, and tag (EN + AR)", async ({ adminPage }) => {
    // Open edit for a licensing item
    // Change title_en, title_ar, desc_en, desc_ar, tag_en, tag_ar
    // Submit
    // Assert PUT payload has all six fields
  });

  test("deletes a licensing item with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 items
    // Click delete on first card
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/licensing-items/:id called
    // Assert card removed from grid
    // Assert success toast
  });

  test("cancels delete of a licensing item", async ({ adminPage }) => {
    // Click delete on a card
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert card still visible
  });

  test("reorders licensing items via drag and drop", async ({ adminPage }) => {
    // Mock GET returning [item1, item2] with sort_order 1, 2
    // Drag item2 above item1
    // Assert PATCH /api/admin/licensing-items/reorder called with [2, 1]
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
    // Click "Add Licensing Item"
    // Type 101 chars in icon field
    // Assert validation message for icon max length
  });

  test("character counter on description fields", async ({ adminPage }) => {
    // Open create form
    // Type in desc_en
    // Assert character counter updates
    // Assert max 2000 chars enforced
  });

  test("optional fields (icon, tag) can be left empty", async ({ adminPage }) => {
    // Click "Add Licensing Item"
    // Fill only title_en, title_ar
    // Submit
    // Assert POST called with optional fields omitted
    // Assert item created without icon/tag
  });

  test("section-level text (label/heading/description) still editable", async ({ adminPage }) => {
    // Click on licensing label text
    // Edit in popup
    // Save
    // Assert PUT /api/admin/home-page-content called with licensing_label_en/ar
  });

  test("persists licensing items after page reload", async ({ adminPage, page }) => {
    // Create a licensing item
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

  test("bulk reorder with 4+ items", async ({ adminPage }) => {
    // Mock GET returning 4 items
    // Reorder to [3, 1, 4, 2]
    // Assert PATCH called with correct ids array
    // Assert new order in UI
  });
});
```

### Testing Strategy
- **API Mocking**: Use `page.route("**/api/admin/**"` to intercept all licensing items API calls and return controlled responses.
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate, then mock the licensing-items endpoints independently.
- **Data isolation**: Each test mocks its own API responses — no shared state.
- **Locators**: Use `data-testid` attributes on key elements (add button, item cards, form fields, delete button, confirmation dialog).

### Verification
- `npx playwright test tests/licensing-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API
- Tests are stable (no flakiness from real API)

---

## Phase 10 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all licensing item operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminLicensingItemForm.tsx` | Add field-level validation (icon max 100 chars, title max 200 chars, desc max 2000 chars with counter, tag max 100 chars) |
| `app/hooks/admin/useLicensingItems.ts` | Add proper error handling, retry logic, and toast messages |

### Validation Rules

| Field | Rules |
|---|---|
| `icon` | Optional, max 100 chars |
| `title_en` | Optional, max 200 chars |
| `title_ar` | Optional, max 200 chars |
| `desc_en` | Optional, max 2000 chars — show character counter |
| `desc_ar` | Optional, max 2000 chars — show character counter |
| `tag_en` | Optional, max 100 chars |
| `tag_ar` | Optional, max 100 chars |
| `sort_order` | Optional, integer, min 0, default 0 |

### Verification
- Invalid inputs show field-level error messages
- Max lengths enforced with visual feedback
- Backend 400 errors surface as toast messages with field details

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add licensing item types + fix `licensingItems: unknown[]` + fix `LICENSING_ITEM_FIELD_API_MAP` |
| 2 | `app/types/website/home.types.ts` | P1 | Add `AdminLicensingItemApiResponse` type |
| 3 | `app/helpers/api/adminApi.ts` | P2 | Add licensing items CRUD functions |
| 4 | `app/hooks/admin/useLicensingItems.ts` | P3 | **Create** — licensing items state hook |
| 5 | `app/_components/website/_admin/AdminLicensingSectionControl.tsx` | P4 | **Rewrite** — full CRUD UI |
| 6 | `app/_components/website/_admin/AdminLicensingItemForm.tsx` | P4 | **Create** — add/edit form modal |
| 7 | `app/_components/website/_admin/AdminLicensingItemCard.tsx` | P4 | **Create** — item card with actions |
| 8 | `app/_components/website/_admin/InlineEditPopup.tsx` | P5 | Add bilingual support + icon field |
| 9 | `app/_components/website/_admin/AdminEditPopup.tsx` | P5 | Update field labels for licensing items |
| 10 | `app/_components/website/_admin/AdminSaveBar.tsx` | P5 | Minor copy updates |
| 11 | `app/_components/website/_home/LicensingSection.tsx` | P6 | Add empty state + conditional tag + RTL support |
| 12 | `translations/en.json` | P7 | Add licensing section keys |
| 13 | `translations/ar.json` | P7 | Add licensing section keys |
| 14 | `playwright.config.ts` | P8 | **Create** — playwright config |
| 15 | `tests/auth.setup.ts` | P8 | **Create** — admin auth setup |
| 16 | `tests/pages/AdminLoginPage.ts` | P8 | **Create** — login POM |
| 17 | `tests/pages/AdminDashboardPage.ts` | P8 | **Create** — dashboard POM |
| 18 | `tests/fixtures/index.ts` | P8 | **Create** — test fixtures |
| 19 | `tests/licensing-admin.spec.ts` | P9 | **Create** — all licensing E2E tests |
| 20 | `app/_components/website/_admin/AdminLicensingItemForm.tsx` | P10 | Add validation |
| 21 | `app/hooks/admin/useLicensingItems.ts` | P10 | Add error handling polish |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET/POST/PUT/DELETE /api/admin/licensing-items`, `PATCH /api/admin/licensing-items/reorder`, `PATCH /api/admin/licensing-items/:id/reorder`. **Must verify with backend team** before Phase 2. The integration plan (`plans/LICENSING_INTEGRATION_PLAN.md`) specifies these endpoints but they may not be implemented yet.

2. **No drag-and-drop library installed** — `@dnd-kit/core` or similar not in `package.json`. Two options:
   - **Option A**: Install `@dnd-kit/core` + `@dnd-kit/sortable` for true drag-and-drop
   - **Option B**: Use up/down arrow buttons for reorder (simpler, no extra dependency)
   - **Decision needed** before Phase 4.

3. **Icon field format ambiguity** — The `icon` field stores a string that could be:
   - SVG filename (e.g. `"icon-commercial.svg"`) → resolve from assets
   - Icon class name (e.g. `"fa-building"`) → use with icon library
   - URL path → use directly as `<img src>`
   - **Must coordinate with backend** on expected format before Phase 4.

4. **`data-testid` additions** — existing components may need `data-testid` attributes added for Playwright locators. These must be added before or during Phase 8.

5. **Auth setup for tests** — assumes the login API (`POST /auth/login`) is working and the test credentials are valid. Need `.env.test` with real test credentials.

6. **Existing admin page uses `data: any`** — not in scope but worth noting as a follow-up. The licensing section data passed via SSR props will be superseded by the `useLicensingItems` hook fetching from admin API.

7. **Section header update is shared across all sections** — `PUT /api/admin/home-page-content` updates ALL sections at once. The frontend should:
   - First `GET /api/admin/home-page-content` to get current state (done by `useAdminHomeContent`)
   - Modify only the licensing header fields
   - `PUT` with the full object (or just the changed fields — partial update works)
   - This is already the pattern used by `useAdminHomeContent` — no change needed.

8. **Public endpoint returns 404 if no seed** — If `home_page_content` row does not exist, the public endpoint returns `404`. The public `LicensingSection` should handle this gracefully (Phase 6).

9. **No visibility toggle** — Licensing items have no `is_active` or `is_visible` flag. All items in the table are displayed. If this is needed, request a backend enhancement.

10. **Character encoding for Arabic text** — Ensure all textarea inputs properly handle Arabic RTL text input and display. Test with actual Arabic content before Phase 10.

11. **Tag is optional** — Public component must conditionally render tag badge only when value is present and non-empty. Integration plan explicitly recommends this behavior.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 8:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 9:
npx playwright test tests/licensing-admin.spec.ts --project=chromium

# Full check:
pnpm build  # ensures build doesn't break
```
