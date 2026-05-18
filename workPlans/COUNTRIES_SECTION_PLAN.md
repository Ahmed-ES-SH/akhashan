# Countries Section — Admin Control & Public Display Integration Plan

> **Scope**: Countries section only — public display (active countries, locale-filtered, region-grouped) + admin CRUD (create, edit, delete, toggle active, reorder, bulk reorder, pagination, region filter).
> **Date**: 2026-05-17
> **Status**: Draft

---

## Overview

Focus: Integrate the **Countries Section** public display (`CountriesSection.tsx`) and build the admin countries manager from scratch, matching the backend API contract defined in `plans/COUNTRIES_INTEGRATION_PLAN.md`.

**Current Problems**:

1. **No admin component exists** — Zero admin UI for managing countries. No CRUD, no toggle, no reorder, no pagination, no region filter.
2. **No admin API layer** — `adminApi.ts` has zero functions for countries endpoints (`GET/POST/PUT/DELETE /api/admin/countries`, `PATCH /api/admin/countries/:id/toggle`, `PATCH /api/admin/countries/reorder`, etc.)
3. **Public component relies on SSR props** — `CountriesSection.tsx` receives `countries: PublicCountryApiResponse[]` via props from the page; should fetch from `GET /api/countries?locale=en|ar` for dynamic locale switching.
4. **No types for admin country entity** — `admin.types.ts` has no `AdminCountry` type. The admin entity has fields (`flag_emoji`, `name_en`, `name_ar`, `specialty`, `region`, `workers_label`, `is_active`, `sort_order`, timestamps) that don't exist in current types.
5. **No hooks for countries** — No `useCountries` hook for public fetching, no `useAdminCountries` hook for admin CRUD state management.
6. **Public section has no empty/loading/error states** — Assumes data is always present; no skeleton, empty state, or error handling.
7. **No E2E tests** — zero coverage for countries admin or public flows.
8. **Countries section header is not editable** — Like services, countries are independent entities with no FK to `home_page_content`. The header text must come from translations or a separate mechanism.
9. **Region grouping is hardcoded** — `regionLabels` is defined inline in the component; should be centralized or use translations.

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for countries admin CRUD and public display that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminCountry`, `AdminCreateCountryPayload`, `AdminUpdateCountryPayload`, `AdminPaginatedCountriesResponse`, `AdminCountryMeta`, `AdminReorderPayload`, `AdminSingleReorderPayload`, `CountryRegion` enum. |
| `app/types/website/home.types.ts` | Verify `PublicCountryApiResponse` has all public fields. Add `CountriesSectionApiResponse` wrapper if needed. |

### Key Type Additions

```typescript
// app/types/website/admin.types.ts

// Region enum
export type CountryRegion = "asia" | "africa";

// Admin Country — full entity shape
export interface AdminCountry {
  id: number;
  flag_emoji: string | null;
  name_en: string | null;
  name_ar: string | null;
  specialty: string | null;
  region: CountryRegion | null;
  workers_label: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata
export interface AdminCountryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/countries
export interface AdminPaginatedCountriesResponse {
  data: AdminCountry[];
  meta: AdminCountryMeta;
}

// Create payload (all fields optional)
export interface AdminCreateCountryPayload {
  flag_emoji?: string;
  name_en?: string;
  name_ar?: string;
  specialty?: string;
  region?: CountryRegion;
  workers_label?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Update payload (all optional)
export type AdminUpdateCountryPayload = Partial<AdminCreateCountryPayload>;

// Bulk reorder payload
export interface AdminReorderPayload {
  ids: number[];
}

// Single country reorder payload
export interface AdminSingleReorderPayload {
  sort_order: number;
}
```

```typescript
// app/types/website/home.types.ts

// Public shape — already exists as PublicCountryApiResponse
// Verify it includes all fields: id, flag_emoji, name, specialty, region, workers_label
// No changes needed if already complete
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types
- `CountryRegion` type matches backend enum values (`'asia'` | `'africa'`)

---

## Phase 2 — Admin API Layer

**Objective**: Add countries CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetCountries()`, `adminCreateCountry()`, `adminUpdateCountry()`, `adminDeleteCountry()`, `adminToggleCountryActive()`, `adminReorderCountries()`, `adminSingleReorderCountry()` |

### Key API Functions

```typescript
// GET /api/admin/countries?page=1&limit=20
export async function adminGetCountries(
  page: number = 1,
  limit: number = 20
): Promise<AdminPaginatedCountriesResponse>

// POST /api/admin/countries
export async function adminCreateCountry(
  data: AdminCreateCountryPayload
): Promise<AdminCountry>

// PUT /api/admin/countries/:id
export async function adminUpdateCountry(
  id: number,
  data: AdminUpdateCountryPayload
): Promise<AdminCountry>

// DELETE /api/admin/countries/:id
export async function adminDeleteCountry(id: number): Promise<void>

// PATCH /api/admin/countries/:id/toggle
export async function adminToggleCountryActive(
  id: number
): Promise<AdminCountry>

// PATCH /api/admin/countries/reorder — bulk reorder
export async function adminReorderCountries(
  ids: number[]
): Promise<AdminCountry[]>

// PATCH /api/admin/countries/:id/reorder — single country reorder
export async function adminSingleReorderCountry(
  id: number,
  sort_order: number
): Promise<AdminCountry>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/post/put/delete/patch` with `withCredentials: true`
- `delete` returns `void`
- Pagination params passed as query string

---

## Phase 3 — New Hooks: `useCountries` (public) + `useAdminCountries` (admin)

**Objective**: Create dedicated hooks for public countries fetching and admin countries CRUD state management.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/home/useCountries.ts` | **Create** — public countries fetch hook |
| `app/hooks/admin/useAdminCountries.ts` | **Create** — admin countries CRUD state hook |

### Public Hook Structure

```typescript
export function useCountries(locale: Locale) {
  const [countries, setCountries] = useState<PublicCountryApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches GET /api/countries?locale={locale} on mount and locale change
  // Returns { countries, isLoading, error, refetch }
}
```

### Admin Hook Structure

```typescript
export function useAdminCountries() {
  // State
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [meta, setMeta] = useState<AdminCountryMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch on mount and page change
  const fetchCountries = useCallback(async (page?: number, limit?: number) => { ... }, []);

  // CRUD operations
  const createCountry = async (data: AdminCreateCountryPayload) => { ... };
  const updateCountry = async (id: number, data: AdminUpdateCountryPayload) => { ... };
  const deleteCountry = async (id: number) => { ... };
  const toggleActive = async (id: number) => { ... };
  const reorderCountries = async (ids: number[]) => { ... };
  const singleReorderCountry = async (id: number, sort_order: number) => { ... };

  return { countries, meta, isLoading, error, currentPage, setCurrentPage, fetchCountries, createCountry, updateCountry, deleteCountry, toggleActive, reorderCountries, singleReorderCountry };
}
```

### Key Behaviors
- Public hook: re-fetches on locale change, exposes loading/error states
- Admin hook: paginated fetch on mount, each CRUD operation updates local state + toast
- Both hooks handle API errors gracefully

### Verification
- Public hook fetches on mount and re-fetches on locale change
- Admin hook fetches paginated data on mount
- CRUD operations update local state correctly
- Error handling with toast messages works

---

## Phase 4 — Admin Countries Manager (Full Build)

**Objective**: Build the complete admin countries manager from scratch — table view with pagination, create/edit modal, toggle, delete, reorder, region filter.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminCountriesManager.tsx` | **Create** — main admin countries management component |
| `app/_components/website/_admin/AdminCountryForm.tsx` | **Create** — form modal for creating/editing countries |
| `app/_components/website/_admin/AdminCountryRow.tsx` | **Create** — single country row/card for admin list |
| `app/_components/website/_admin/AdminPagination.tsx` | **Create** — reusable pagination controls (shared with services) |

### Component Architecture

```
AdminCountriesManager
├── Header: "Countries Management" + "Add Country" button
├── Filter tabs: All | Asia | Africa | Active | Inactive
├── Loading skeleton (table rows)
├── Empty state with "Add First Country" button
├── Error state with retry button
├── Countries table (or card grid on mobile)
│   └── AdminCountryRow (per country)
│       ├── Flag emoji (large text display)
│       ├── Name (EN/AR preview)
│       ├── Region badge (asia/africa)
│       ├── Specialty preview (truncated)
│       ├── Workers label
│       ├── Active toggle switch → PATCH /api/admin/countries/:id/toggle
│       ├── Sort order badge
│       ├── Edit button → opens AdminCountryForm
│       ├── Delete button → confirmation → DELETE
│       └── Drag handle → reorder
├── Pagination controls (← 1 2 3 ... →)
├── "Add Country" button → opens AdminCountryForm (create mode)
└── AdminCountryForm (modal)
    ├── Flag Emoji (text input, max 10 chars, optional — emoji picker recommended)
    ├── Name EN (text input, max 200 chars)
    ├── Name AR (text input, max 200 chars)
    ├── Specialty (text input, max 500 chars, optional)
    ├── Region (dropdown: Asia / Africa / None, optional)
    ├── Workers Label (text input, max 200 chars, optional — e.g. "500+ workers")
    ├── Is Active (checkbox, default true)
    └── Save button → POST or PUT
```

### AdminCountryForm Props

```typescript
interface AdminCountryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateCountryPayload | AdminUpdateCountryPayload) => Promise<void>;
  initialData?: AdminCountry; // undefined = create mode, defined = edit mode
  isSaving: boolean;
}
```

### Key Behaviors
- **Create**: `POST /api/admin/countries` → add to local state → toast success
- **Edit**: `PUT /api/admin/countries/:id` → update in local state → toast success
- **Delete**: confirmation dialog → `DELETE /api/admin/countries/:id` → remove from local state → toast success
- **Toggle**: `PATCH /api/admin/countries/:id/toggle` → flip `is_active` in local state → toast
- **Reorder**: drag drop → `PATCH /api/admin/countries/reorder` with `{ ids: [...] }` → reorder local state → toast
- **Pagination**: `GET /api/admin/countries?page=N&limit=20` → update table → update pagination controls
- **Region filter**: Client-side filter by `region` (asia/africa) or server-side via query param

### Verification
- Add a country → appears in list
- Edit any field → updates correctly
- Delete a country → removed from list
- Toggle active → switch flips, country hidden from public
- Reorder countries → order persists on re-fetch
- Pagination works (page 1, 2, 3...)
- Region filter works (Asia / Africa / All)
- Empty state shown when no countries
- Error state shown when fetch fails, with retry button
- Flag emoji renders correctly in form and list

---

## Phase 5 — Public CountriesSection Improvements

**Objective**: Update `CountriesSection.tsx` to fetch from public API, add loading/error/empty states, and ensure RTL support.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/CountriesSection.tsx` | Add `useCountries` hook for fetching. Add loading skeleton, empty state, error state. Apply `dir` attribute for RTL. Move `regionLabels` to translations or constants. |

### Key Changes
- Replace SSR props with `useCountries(locale)` hook fetching from `GET /api/countries?locale=en|ar`
- If `countries` is empty array → show subtle empty state or hide section
- If any field is null/undefined → hide that element or show fallback
- Ensure `dir={locale === "ar" ? "rtl" : "ltr"}` is applied
- Move `regionLabels` from inline to translations or a shared constants file
- Keep existing framer-motion animations in CountryCard
- Add loading skeleton (card placeholders) during fetch

### Verification
- Empty countries array → empty state shown
- Null fields → elements hidden gracefully
- Arabic locale → RTL layout applied
- Loading skeleton visible during fetch
- Error state with retry button on fetch failure
- Region labels display correctly in both EN and AR
- Flag emoji renders correctly
- Scroll/motion animations still work

---

## Phase 6 — Translations

**Objective**: Add all countries-section-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.countries.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "countries": {
      "title": "Countries Management",
      "addCountry": "Add Country",
      "editCountry": "Edit Country",
      "deleteCountry": "Delete Country",
      "confirmDelete": "Are you sure you want to delete this country?",
      "noCountries": "No countries yet. Click \"Add Country\" to create one.",
      "filterAll": "All",
      "filterAsia": "Asia",
      "filterAfrica": "Africa",
      "filterActive": "Active",
      "filterInactive": "Inactive",
      "regionLabels": {
        "asia": "Asia",
        "africa": "Africa"
      },
      "fieldLabels": {
        "flagEmoji": "Flag Emoji",
        "nameEn": "Name (English)",
        "nameAr": "Name (Arabic)",
        "specialty": "Specialty",
        "region": "Region",
        "workersLabel": "Workers Label",
        "isActive": "Active"
      },
      "placeholders": {
        "flagEmoji": "e.g. 🇸🇦",
        "nameEn": "e.g. Saudi Arabia",
        "nameAr": "e.g. المملكة العربية السعودية",
        "specialty": "e.g. Commercial licensing hub",
        "workersLabel": "e.g. 500+ workers"
      },
      "regionOptions": {
        "asia": "Asia",
        "africa": "Africa",
        "none": "None"
      },
      "toasts": {
        "created": "Country created successfully",
        "updated": "Country updated successfully",
        "deleted": "Country deleted successfully",
        "toggled": "Country status updated",
        "reordered": "Countries reordered successfully",
        "createError": "Failed to create country",
        "updateError": "Failed to update country",
        "deleteError": "Failed to delete country",
        "reorderError": "Failed to reorder countries",
        "fetchError": "Failed to load countries"
      },
      "emptyState": "No countries configured",
      "loading": "Loading countries...",
      "pagination": {
        "previous": "Previous",
        "next": "Next",
        "page": "Page"
      },
      "validation": {
        "flagEmojiMax": "Flag emoji must be 10 characters or less",
        "nameMax": "Name must be 200 characters or less",
        "specialtyMax": "Specialty must be 500 characters or less",
        "workersLabelMax": "Workers label must be 200 characters or less",
        "invalidRegion": "Region must be 'asia' or 'africa'"
      }
    }
  }
}
```

### Verification
- All admin UI text in countries manager is pulled from translation files
- Both EN and AR locales have all keys
- Toast messages use translation keys
- Region labels display correctly in both languages

---

## Phase 7 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for the countries admin section.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminCountriesPage.ts` | **Create** — POM for admin countries manager |
| `.env.test.example` | **Create** — template for test env vars |
| `.gitignore` | **Modify** — add `playwright/.auth/`, `playwright-report/`, `test-results/` |

### Page Object Models

**AdminCountriesPage**:
```typescript
export class AdminCountriesPage {
  async goto() { await this.page.goto("/en/admin"); }
  async addCountry(data: CountryFormData) { ... }
  async editCountry(id: number, data: Partial<CountryFormData>) { ... }
  async deleteCountry(id: number) { ... }
  async toggleCountry(id: number) { ... }
  async reorderCountries(orderedIds: number[]) { ... }
  async goToPage(page: number) { ... }
  async filterByRegion(region: "all" | "asia" | "africa") { ... }
  async filterByStatus(status: "all" | "active" | "inactive") { ... }
  async getCountriesCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 8 — Playwright Countries E2E Tests

**Objective**: Write comprehensive E2E tests for the countries admin section.

### Files Affected

| File | Action |
|---|---|
| `tests/countries-admin.spec.ts` | **Create** — all countries admin E2E tests |

### Test Scenarios

```typescript
test.describe("Countries — Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays countries list with pagination", async ({ adminPage }) => {
    // Mock GET /api/admin/countries?page=1&limit=20 to return paginated response
    // Assert table shows countries with flag emoji, name, region, toggle, sort_order
    // Assert pagination controls visible
  });

  test("shows empty state when no countries", async ({ adminPage }) => {
    // Mock GET to return { data: [], meta: { total: 0, ... } }
    // Assert empty state message visible
    // Assert "Add Country" button visible
  });

  test("creates a new country", async ({ adminPage }) => {
    // Click "Add Country"
    // Fill form: flag_emoji, name_en, name_ar, specialty, region, workers_label
    // Submit
    // Assert POST called with correct payload
    // Assert new row appears in table
    // Assert success toast
  });

  test("edits an existing country", async ({ adminPage }) => {
    // Mock GET returning 1 country
    // Click edit
    // Change name_en, specialty, workers_label
    // Submit
    // Assert PUT /api/admin/countries/:id called with correct payload
    // Assert updated values in row
    // Assert success toast
  });

  test("edits bilingual fields (EN + AR)", async ({ adminPage }) => {
    // Open edit for a country
    // Change name_en, name_ar
    // Submit
    // Assert PUT payload has both fields
  });

  test("toggles country active/inactive", async ({ adminPage }) => {
    // Mock GET returning 1 active country
    // Click toggle switch
    // Assert PATCH /api/admin/countries/:id/toggle called
    // Assert switch flips to inactive
    // Assert success toast
  });

  test("deletes a country with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 countries
    // Click delete on first row
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/countries/:id called
    // Assert row removed from table
    // Assert success toast
  });

  test("cancels delete of a country", async ({ adminPage }) => {
    // Click delete on a row
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert row still visible
  });

  test("reorders countries via drag and drop", async ({ adminPage }) => {
    // Mock GET returning [country1, country2] with sort_order 1, 2
    // Drag country2 above country1
    // Assert PATCH /api/admin/countries/reorder called with [2, 1]
    // Assert new order reflected in UI
  });

  test("filters countries by region", async ({ adminPage }) => {
    // Mock GET returning mix of Asia and Africa countries
    // Click "Asia" filter tab
    // Assert only Asia countries shown
    // Click "Africa" filter tab
    // Assert only Africa countries shown
  });

  test("filters countries by active/inactive status", async ({ adminPage }) => {
    // Mock GET returning mix of active and inactive countries
    // Click "Active" filter tab
    // Assert only active countries shown
    // Click "Inactive" filter tab
    // Assert only inactive countries shown
  });

  test("paginates through countries", async ({ adminPage }) => {
    // Mock GET page=1 returning 20 countries, meta.totalPages=2
    // Click "Next" or page 2
    // Assert GET /api/admin/countries?page=2 called
    // Assert new page of countries displayed
  });

  test("shows loading state during fetch", async ({ adminPage, page }) => {
    // Intercept GET with delayed response
    // Assert loading skeleton visible
    // Wait for response
    // Assert table visible
  });

  test("shows error state on fetch failure", async ({ adminPage, page }) => {
    // Mock GET to return 500
    // Assert error message visible
    // Assert retry button visible
    // Click retry
    // Assert GET called again
  });

  test("region dropdown has correct options", async ({ adminPage }) => {
    // Open create form
    // Assert region dropdown has: Asia, Africa, None
    // Select "Asia"
    // Assert value is "asia"
  });

  test("flag emoji renders correctly in form and list", async ({ adminPage }) => {
    // Create country with flag_emoji "🇸🇦"
    // Assert flag emoji displays correctly in list row
    // Assert flag emoji displays correctly in edit form
  });

  test("optional fields can be left empty", async ({ adminPage }) => {
    // Click "Add Country"
    // Fill only name_en, name_ar
    // Submit
    // Assert POST called with optional fields omitted
    // Assert country created
  });

  test("handles 404 on update of deleted country", async ({ adminPage }) => {
    // Mock PUT to return 404
    // Assert error toast "Country no longer exists"
    // Assert list refreshes
  });

  test("handles 401 redirect on expired session", async ({ adminPage, page }) => {
    // Mock auth check to return 401
    // Assert redirected to login page
  });

  test("bulk reorder with 4+ countries", async ({ adminPage }) => {
    // Mock GET returning 4 countries
    // Reorder to [3, 1, 4, 2]
    // Assert PATCH called with correct ids array
    // Assert new order in UI
  });

  test("handles invalid region value", async ({ adminPage }) => {
    // Open create form
    // Try to set region to invalid value (via API mock)
    // Assert validation error "Region must be 'asia' or 'africa'"
  });
});
```

### Testing Strategy
- **API Mocking**: Use `page.route("**/api/admin/**"` to intercept all countries API calls
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate
- **Data isolation**: Each test mocks its own API responses
- **Locators**: Use `data-testid` attributes on key elements

### Verification
- `npx playwright test tests/countries-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API

---

## Phase 9 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all country operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminCountryForm.tsx` | Add field-level validation (all max lengths, region enum validation, emoji character count) |
| `app/hooks/admin/useAdminCountries.ts` | Add proper error handling, retry logic, and toast messages |

### Validation Rules

| Field | Rules |
|---|---|
| `flag_emoji` | Optional, max 10 chars (supports multi-byte emoji) |
| `name_en` | Optional, max 200 chars |
| `name_ar` | Optional, max 200 chars |
| `specialty` | Optional, max 500 chars |
| `region` | Optional, must be `'asia'` or `'africa'` |
| `workers_label` | Optional, max 200 chars |
| `is_active` | Optional, boolean, default `true` |
| `sort_order` | Optional, integer, min 0, default 0 |

### Verification
- Invalid inputs show field-level error messages
- Max lengths enforced with visual feedback
- Region dropdown only accepts valid enum values
- Backend 400 errors surface as toast messages with field details
- Flag emoji input handles multi-byte characters correctly

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add admin country types + `CountryRegion` enum |
| 2 | `app/types/website/home.types.ts` | P1 | Verify public country types |
| 3 | `app/helpers/api/adminApi.ts` | P2 | Add countries CRUD functions |
| 4 | `app/hooks/home/useCountries.ts` | P3 | **Create** — public countries fetch hook |
| 5 | `app/hooks/admin/useAdminCountries.ts` | P3 | **Create** — admin countries CRUD hook |
| 6 | `app/_components/website/_admin/AdminCountriesManager.tsx` | P4 | **Create** — main admin component |
| 7 | `app/_components/website/_admin/AdminCountryForm.tsx` | P4 | **Create** — add/edit form modal |
| 8 | `app/_components/website/_admin/AdminCountryRow.tsx` | P4 | **Create** — country row with actions |
| 9 | `app/_components/website/_admin/AdminPagination.tsx` | P4 | **Create** — pagination controls |
| 10 | `app/_components/website/_home/CountriesSection.tsx` | P5 | Add hook, loading/empty/error states, RTL, move regionLabels |
| 11 | `translations/en.json` | P6 | Add countries keys |
| 12 | `translations/ar.json` | P6 | Add countries keys |
| 13 | `playwright.config.ts` | P7 | **Create** — playwright config |
| 14 | `tests/auth.setup.ts` | P7 | **Create** — admin auth setup |
| 15 | `tests/pages/AdminLoginPage.ts` | P7 | **Create** — login POM |
| 16 | `tests/pages/AdminCountriesPage.ts` | P7 | **Create** — countries POM |
| 17 | `tests/fixtures/index.ts` | P7 | **Create** — test fixtures |
| 18 | `tests/countries-admin.spec.ts` | P8 | **Create** — all countries E2E tests |
| 19 | `app/_components/website/_admin/AdminCountryForm.tsx` | P9 | Add validation |
| 20 | `app/hooks/admin/useAdminCountries.ts` | P9 | Add error handling polish |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET/POST/PUT/DELETE /api/admin/countries`, `PATCH /api/admin/countries/:id/toggle`, `PATCH /api/admin/countries/reorder`, `PATCH /api/admin/countries/:id/reorder`. **Must verify with backend team** before Phase 2.

2. **No admin page route for countries** — The admin dashboard (`AdminPageClient.tsx`) needs a route/section to render `AdminCountriesManager`. This may require updates to the admin page layout.

3. **No drag-and-drop library installed** — `@dnd-kit/core` or similar not in `package.json`. Two options:
   - **Option A**: Install `@dnd-kit/core` + `@dnd-kit/sortable` for true drag-and-drop
   - **Option B**: Use up/down arrow buttons for reorder
   - **Decision needed** before Phase 4.

4. **Countries header text source** — Countries are independent entities (no FK to `home_page_content`). The section header (label, heading, description) has no backend storage. Options:
   - **Option A**: Store in translations (current approach — uses `t.countries.label`, etc.)
   - **Option B**: Add header fields to `home_page_content` table (backend change needed)
   - **Decision needed** — current plan assumes Option A (translations).

5. **Flag emoji rendering** — Emoji characters are multi-byte UTF-8. Input handling, display, and character counting must account for this. Test with various flag emojis.

6. **Toggle uses read-then-write pattern** — Unlike Services (atomic SQL `NOT is_active`), countries toggle uses `findOne` → flip → `save`. Small race condition window exists for concurrent toggles. Unlikely in practice for admin operations.

7. **Bulk reorder uses sequential updates** — Countries uses `for` loop with `await` (slower) vs Services `Promise.all` (parallel). For large lists (>50), this may be noticeable.

8. **Empty bulk reorder returns full list** — Unlike Services (returns 400), countries returns `findAll({ page: 1, limit: 1000 })`. Frontend should handle this gracefully.

9. **`data-testid` additions** — existing components need `data-testid` attributes for Playwright locators.

10. **Auth setup for tests** — assumes login API works and test credentials are valid. Need `.env.test` with real credentials.

11. **Character encoding for Arabic text** — Ensure all inputs properly handle Arabic RTL text.

12. **Public endpoint locale param ignored** — Backend `findActive('en')` receives locale but doesn't use it in the query. Locale mapping happens in the controller's `.map()`. Frontend should still pass locale param for correctness.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 7:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 8:
npx playwright test tests/countries-admin.spec.ts --project=chromium

# Full check:
pnpm build
```
