# Services Section — Admin Control & Public Display Integration Plan

> **Scope**: Services section only — public display (active services, locale-filtered) + admin CRUD (create, edit, delete, toggle active, reorder, bulk reorder, pagination).
> **Date**: 2026-05-17
> **Status**: Draft

---

## Overview

Focus: Integrate the **Services Section** public display (`ServicesSection.tsx`, `ServiceCard.tsx`) and build the admin services manager from scratch, matching the backend API contract defined in `plans/SERVICES_INTEGRATION_PLAN.md`.

**Current Problems**:

1. **No admin component exists** — There is zero admin UI for managing services. No CRUD, no toggle, no reorder, no pagination.
2. **No admin API layer** — `adminApi.ts` has zero functions for services endpoints (`GET/POST/PUT/DELETE /api/admin/services`, `PATCH /api/admin/services/:id/toggle`, `PATCH /api/admin/services/reorder`, etc.)
3. **Public component relies on SSR props** — `ServicesSection.tsx` receives `services: PublicServiceApiResponse[]` via props from the page; should fetch from `GET /api/services?locale=en|ar` for dynamic locale switching
4. **No types for admin service entity** — `admin.types.ts` has no `AdminService` type. The admin entity has 15+ fields (bilingual title/desc/button/metric, `is_active`, `sort_order`, timestamps) that don't exist in current types.
5. **No hooks for services** — No `useServices` hook for public fetching, no `useAdminServices` hook for admin CRUD state management.
6. **Public section has no empty/loading/error states** — Assumes data is always present; no skeleton, empty state, or error handling.
7. **No E2E tests** — zero coverage for services admin or public flows.
8. **Services section header is not editable** — Unlike other sections (stats, licensing, process), the services header (label, heading, description) has no admin editing mechanism. The integration plan shows services are independent entities with no FK to `home_page_content` — the header text must come from translations or a separate mechanism.

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for services admin CRUD and public display that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminService`, `AdminCreateServicePayload`, `AdminUpdateServicePayload`, `AdminPaginatedServicesResponse`, `AdminServiceMeta`, `AdminReorderPayload`, `AdminSingleReorderPayload` types. |
| `app/types/website/home.types.ts` | Verify `PublicServiceApiResponse` has all public fields. Add `ServicesSectionApiResponse` wrapper type if needed. |

### Key Type Additions

```typescript
// app/types/website/admin.types.ts

// Admin Service — full entity shape
export interface AdminService {
  id: number;
  icon: string | null;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  button_label_en: string | null;
  button_label_ar: string | null;
  metric_value: string | null;
  metric_suffix: string | null;
  metric_label_en: string | null;
  metric_label_ar: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata
export interface AdminServiceMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/services
export interface AdminPaginatedServicesResponse {
  data: AdminService[];
  meta: AdminServiceMeta;
}

// Create payload (all fields optional)
export interface AdminCreateServicePayload {
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  button_label_en?: string;
  button_label_ar?: string;
  metric_value?: string;
  metric_suffix?: string;
  metric_label_en?: string;
  metric_label_ar?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Update payload (all optional)
export type AdminUpdateServicePayload = Partial<AdminCreateServicePayload>;

// Bulk reorder payload
export interface AdminReorderPayload {
  ids: number[];
}

// Single service reorder payload
export interface AdminSingleReorderPayload {
  sort_order: number;
}
```

```typescript
// app/types/website/home.types.ts

// Public shape — already exists as PublicServiceApiResponse
// Verify it includes all fields: id, icon, title, desc, button_label, metric_value, metric_suffix, metric_label
// No changes needed if already complete
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types

---

## Phase 2 — Admin API Layer

**Objective**: Add services CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetServices()`, `adminCreateService()`, `adminUpdateService()`, `adminDeleteService()`, `adminToggleServiceActive()`, `adminReorderServices()`, `adminSingleReorderService()` |

### Key API Functions

```typescript
// GET /api/admin/services?page=1&limit=20
export async function adminGetServices(
  page: number = 1,
  limit: number = 20
): Promise<AdminPaginatedServicesResponse>

// POST /api/admin/services
export async function adminCreateService(
  data: AdminCreateServicePayload
): Promise<AdminService>

// PUT /api/admin/services/:id
export async function adminUpdateService(
  id: number,
  data: AdminUpdateServicePayload
): Promise<AdminService>

// DELETE /api/admin/services/:id
export async function adminDeleteService(id: number): Promise<void>

// PATCH /api/admin/services/:id/toggle
export async function adminToggleServiceActive(
  id: number
): Promise<AdminService>

// PATCH /api/admin/services/reorder — bulk reorder
export async function adminReorderServices(
  ids: number[]
): Promise<AdminService[]>

// PATCH /api/admin/services/:id/reorder — single service reorder
export async function adminSingleReorderService(
  id: number,
  sort_order: number
): Promise<AdminService>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/post/put/delete/patch` with `withCredentials: true`
- `delete` returns `void` (200/204 No Content)
- Pagination params passed as query string

---

## Phase 3 — New Hooks: `useServices` (public) + `useAdminServices` (admin)

**Objective**: Create dedicated hooks for public services fetching and admin services CRUD state management.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/home/useServices.ts` | **Create** — public services fetch hook |
| `app/hooks/admin/useAdminServices.ts` | **Create** — admin services CRUD state hook |

### Public Hook Structure

```typescript
export function useServices(locale: Locale) {
  const [services, setServices] = useState<PublicServiceApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches GET /api/services?locale={locale} on mount and locale change
  // Returns { services, isLoading, error, refetch }
}
```

### Admin Hook Structure

```typescript
export function useAdminServices() {
  // State
  const [services, setServices] = useState<AdminService[]>([]);
  const [meta, setMeta] = useState<AdminServiceMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch on mount and page change
  const fetchServices = useCallback(async (page?: number, limit?: number) => { ... }, []);

  // CRUD operations
  const createService = async (data: AdminCreateServicePayload) => { ... };
  const updateService = async (id: number, data: AdminUpdateServicePayload) => { ... };
  const deleteService = async (id: number) => { ... };
  const toggleActive = async (id: number) => { ... };
  const reorderServices = async (ids: number[]) => { ... };
  const singleReorderService = async (id: number, sort_order: number) => { ... };

  return { services, meta, isLoading, error, currentPage, setCurrentPage, fetchServices, createService, updateService, deleteService, toggleActive, reorderServices, singleReorderService };
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

## Phase 4 — Admin Services Manager (Full Build)

**Objective**: Build the complete admin services manager from scratch — table view with pagination, create/edit modal, toggle, delete, reorder.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminServicesManager.tsx` | **Create** — main admin services management component |
| `app/_components/website/_admin/AdminServiceForm.tsx` | **Create** — form modal for creating/editing services |
| `app/_components/website/_admin/AdminServiceRow.tsx` | **Create** — single service row/card for admin list |
| `app/_components/website/_admin/AdminPagination.tsx` | **Create** — reusable pagination controls |

### Component Architecture

```
AdminServicesManager
├── Header: "Services Management" + "Add Service" button
├── Filter tabs: All | Active | Inactive
├── Loading skeleton (table rows)
├── Empty state with "Add First Service" button
├── Error state with retry button
├── Services table (or card grid on mobile)
│   └── AdminServiceRow (per service)
│       ├── Icon preview
│       ├── Title (EN/AR preview)
│       ├── Description preview (truncated)
│       ├── Active toggle switch → PATCH /api/admin/services/:id/toggle
│       ├── Sort order badge
│       ├── Edit button → opens AdminServiceForm
│       ├── Delete button → confirmation → DELETE
│       └── Drag handle → reorder
├── Pagination controls (← 1 2 3 ... →)
├── "Add Service" button → opens AdminServiceForm (create mode)
└── AdminServiceForm (modal)
    ├── Icon (text input, max 100 chars, optional)
    ├── Title EN (text input, max 200 chars)
    ├── Title AR (text input, max 200 chars)
    ├── Description EN (textarea, max 2000 chars, character counter)
    ├── Description AR (textarea, max 2000 chars, character counter)
    ├── Button Label EN (text input, max 100 chars, optional)
    ├── Button Label AR (text input, max 100 chars, optional)
    ├── Metric Value (text input, max 100 chars, optional — e.g. "500")
    ├── Metric Suffix (text input, max 20 chars, optional — e.g. "+")
    ├── Metric Label EN (text input, max 200 chars, optional)
    ├── Metric Label AR (text input, max 200 chars, optional)
    ├── Is Active (checkbox, default true)
    └── Save button → POST or PUT
```

### AdminServiceForm Props

```typescript
interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateServicePayload | AdminUpdateServicePayload) => Promise<void>;
  initialData?: AdminService; // undefined = create mode, defined = edit mode
  isSaving: boolean;
}
```

### Key Behaviors
- **Create**: `POST /api/admin/services` → add to local state → toast success
- **Edit**: `PUT /api/admin/services/:id` → update in local state → toast success
- **Delete**: confirmation dialog → `DELETE /api/admin/services/:id` → remove from local state → toast success
- **Toggle**: `PATCH /api/admin/services/:id/toggle` → flip `is_active` in local state → toast
- **Reorder**: drag drop → `PATCH /api/admin/services/reorder` with `{ ids: [...] }` → reorder local state → toast
- **Pagination**: `GET /api/admin/services?page=N&limit=20` → update table → update pagination controls

### Verification
- Add a service → appears in list
- Edit any field → updates correctly
- Delete a service → removed from list
- Toggle active → switch flips, service hidden from public
- Reorder services → order persists on re-fetch
- Pagination works (page 1, 2, 3...)
- Empty state shown when no services
- Error state shown when fetch fails, with retry button

---

## Phase 5 — Public ServicesSection Improvements

**Objective**: Update `ServicesSection.tsx` to fetch from public API, add loading/error/empty states, and ensure RTL support.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/ServicesSection.tsx` | Add `useServices` hook for fetching. Add loading skeleton, empty state, error state. Apply `dir` attribute for RTL. |
| `app/_components/website/_home/ServiceCard.tsx` | Minor: ensure graceful null handling for all optional fields. |

### Key Changes
- Replace SSR props with `useServices(locale)` hook fetching from `GET /api/services?locale=en|ar`
- If `services` is empty array → show subtle empty state or hide section
- If any field is null/undefined → hide that element or show fallback
- Ensure `dir={locale === "ar" ? "rtl" : "ltr"}` is applied
- Keep existing framer-motion animations in ServiceCard
- Add loading skeleton (card placeholders) during fetch

### Verification
- Empty services array → empty state shown
- Null fields → elements hidden gracefully
- Arabic locale → RTL layout applied
- Loading skeleton visible during fetch
- Error state with retry button on fetch failure
- Scroll/motion animations still work

---

## Phase 6 — Translations

**Objective**: Add all services-section-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.services.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "services": {
      "title": "Services Management",
      "addService": "Add Service",
      "editService": "Edit Service",
      "deleteService": "Delete Service",
      "confirmDelete": "Are you sure you want to delete this service?",
      "noServices": "No services yet. Click \"Add Service\" to create one.",
      "filterAll": "All",
      "filterActive": "Active",
      "filterInactive": "Inactive",
      "fieldLabels": {
        "icon": "Icon",
        "titleEn": "Title (English)",
        "titleAr": "Title (Arabic)",
        "descEn": "Description (English)",
        "descAr": "Description (Arabic)",
        "buttonLabelEn": "Button Label (English)",
        "buttonLabelAr": "Button Label (Arabic)",
        "metricValue": "Metric Value",
        "metricSuffix": "Metric Suffix",
        "metricLabelEn": "Metric Label (English)",
        "metricLabelAr": "Metric Label (Arabic)",
        "isActive": "Active"
      },
      "placeholders": {
        "icon": "e.g. icon-licensing.svg",
        "titleEn": "e.g. Commercial Licensing",
        "titleAr": "e.g. الترخيص التجاري",
        "descEn": "Describe this service...",
        "descAr": "صف هذه الخدمة...",
        "buttonLabelEn": "e.g. Learn More",
        "buttonLabelAr": "e.g. اعرف المزيد",
        "metricValue": "e.g. 500",
        "metricSuffix": "e.g. +",
        "metricLabelEn": "e.g. Projects Completed",
        "metricLabelAr": "e.g. مشروع مكتمل"
      },
      "toasts": {
        "created": "Service created successfully",
        "updated": "Service updated successfully",
        "deleted": "Service deleted successfully",
        "toggled": "Service status updated",
        "reordered": "Services reordered successfully",
        "createError": "Failed to create service",
        "updateError": "Failed to update service",
        "deleteError": "Failed to delete service",
        "reorderError": "Failed to reorder services",
        "fetchError": "Failed to load services"
      },
      "emptyState": "No services configured",
      "loading": "Loading services...",
      "pagination": {
        "previous": "Previous",
        "next": "Next",
        "page": "Page"
      },
      "validation": {
        "iconMax": "Icon must be 100 characters or less",
        "titleMax": "Title must be 200 characters or less",
        "descMax": "Description must be 2000 characters or less",
        "buttonLabelMax": "Button label must be 100 characters or less",
        "metricValueMax": "Metric value must be 100 characters or less",
        "metricSuffixMax": "Metric suffix must be 20 characters or less",
        "metricLabelMax": "Metric label must be 200 characters or less"
      }
    }
  }
}
```

### Verification
- All admin UI text in services manager is pulled from translation files
- Both EN and AR locales have all keys
- Toast messages use translation keys

---

## Phase 7 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for the services admin section.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminServicesPage.ts` | **Create** — POM for admin services manager |
| `.env.test.example` | **Create** — template for test env vars |
| `.gitignore` | **Modify** — add `playwright/.auth/`, `playwright-report/`, `test-results/` |

### Page Object Models

**AdminServicesPage**:
```typescript
export class AdminServicesPage {
  async goto() { await this.page.goto("/en/admin"); }
  async addService(data: ServiceFormData) { ... }
  async editService(id: number, data: Partial<ServiceFormData>) { ... }
  async deleteService(id: number) { ... }
  async toggleService(id: number) { ... }
  async reorderServices(orderedIds: number[]) { ... }
  async goToPage(page: number) { ... }
  async filterByStatus(status: "all" | "active" | "inactive") { ... }
  async getServicesCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 8 — Playwright Services E2E Tests

**Objective**: Write comprehensive E2E tests for the services admin section.

### Files Affected

| File | Action |
|---|---|
| `tests/services-admin.spec.ts` | **Create** — all services admin E2E tests |

### Test Scenarios

```typescript
test.describe("Services — Admin CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays services list with pagination", async ({ adminPage }) => {
    // Mock GET /api/admin/services?page=1&limit=20 to return paginated response
    // Assert table shows services with icon, title, toggle, sort_order
    // Assert pagination controls visible
  });

  test("shows empty state when no services", async ({ adminPage }) => {
    // Mock GET to return { data: [], meta: { total: 0, ... } }
    // Assert empty state message visible
    // Assert "Add Service" button visible
  });

  test("creates a new service", async ({ adminPage }) => {
    // Click "Add Service"
    // Fill form: title_en, title_ar, desc_en, desc_ar, icon, metric fields
    // Submit
    // Assert POST called with correct payload
    // Assert new row appears in table
    // Assert success toast
  });

  test("edits an existing service", async ({ adminPage }) => {
    // Mock GET returning 1 service
    // Click edit
    // Change title_en, desc_en, metric_value
    // Submit
    // Assert PUT /api/admin/services/:id called with correct payload
    // Assert updated values in row
    // Assert success toast
  });

  test("edits bilingual fields (EN + AR)", async ({ adminPage }) => {
    // Open edit for a service
    // Change title_en, title_ar, desc_en, desc_ar, button_label_en, button_label_ar
    // Submit
    // Assert PUT payload has all six fields
  });

  test("toggles service active/inactive", async ({ adminPage }) => {
    // Mock GET returning 1 active service
    // Click toggle switch
    // Assert PATCH /api/admin/services/:id/toggle called
    // Assert switch flips to inactive
    // Assert success toast
  });

  test("deletes a service with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 services
    // Click delete on first row
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/services/:id called
    // Assert row removed from table
    // Assert success toast
  });

  test("cancels delete of a service", async ({ adminPage }) => {
    // Click delete on a row
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert row still visible
  });

  test("reorders services via drag and drop", async ({ adminPage }) => {
    // Mock GET returning [service1, service2] with sort_order 1, 2
    // Drag service2 above service1
    // Assert PATCH /api/admin/services/reorder called with [2, 1]
    // Assert new order reflected in UI
  });

  test("filters services by active/inactive status", async ({ adminPage }) => {
    // Mock GET returning mix of active and inactive services
    // Click "Active" filter tab
    // Assert only active services shown
    // Click "Inactive" filter tab
    // Assert only inactive services shown
  });

  test("paginates through services", async ({ adminPage }) => {
    // Mock GET page=1 returning 20 services, meta.totalPages=3
    // Click "Next" or page 2
    // Assert GET /api/admin/services?page=2 called
    // Assert new page of services displayed
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

  test("character counter on description fields", async ({ adminPage }) => {
    // Open create form
    // Type in desc_en
    // Assert character counter updates
    // Assert max 2000 chars enforced
  });

  test("optional fields can be left empty", async ({ adminPage }) => {
    // Click "Add Service"
    // Fill only title_en, title_ar
    // Submit
    // Assert POST called with optional fields omitted
    // Assert service created
  });

  test("handles 404 on update of deleted service", async ({ adminPage }) => {
    // Mock PUT to return 404
    // Assert error toast "Service no longer exists"
    // Assert list refreshes
  });

  test("handles 401 redirect on expired session", async ({ adminPage, page }) => {
    // Mock auth check to return 401
    // Assert redirected to login page
  });

  test("bulk reorder with 4+ services", async ({ adminPage }) => {
    // Mock GET returning 4 services
    // Reorder to [3, 1, 4, 2]
    // Assert PATCH called with correct ids array
    // Assert new order in UI
  });
});
```

### Testing Strategy
- **API Mocking**: Use `page.route("**/api/admin/**"` to intercept all services API calls
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate
- **Data isolation**: Each test mocks its own API responses
- **Locators**: Use `data-testid` attributes on key elements

### Verification
- `npx playwright test tests/services-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API

---

## Phase 9 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all service operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminServiceForm.tsx` | Add field-level validation (all max lengths, numeric validation for metric_value) |
| `app/hooks/admin/useAdminServices.ts` | Add proper error handling, retry logic, and toast messages |

### Validation Rules

| Field | Rules |
|---|---|
| `icon` | Optional, max 100 chars |
| `title_en` | Optional, max 200 chars |
| `title_ar` | Optional, max 200 chars |
| `desc_en` | Optional, max 2000 chars — show character counter |
| `desc_ar` | Optional, max 2000 chars — show character counter |
| `button_label_en` | Optional, max 100 chars |
| `button_label_ar` | Optional, max 100 chars |
| `metric_value` | Optional, max 100 chars |
| `metric_suffix` | Optional, max 20 chars |
| `metric_label_en` | Optional, max 200 chars |
| `metric_label_ar` | Optional, max 200 chars |
| `is_active` | Optional, boolean, default `true` |
| `sort_order` | Optional, integer, min 0, default 0 |

### Verification
- Invalid inputs show field-level error messages
- Max lengths enforced with visual feedback
- Backend 400 errors surface as toast messages with field details

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add admin service types |
| 2 | `app/types/website/home.types.ts` | P1 | Verify public service types |
| 3 | `app/helpers/api/adminApi.ts` | P2 | Add services CRUD functions |
| 4 | `app/hooks/home/useServices.ts` | P3 | **Create** — public services fetch hook |
| 5 | `app/hooks/admin/useAdminServices.ts` | P3 | **Create** — admin services CRUD hook |
| 6 | `app/_components/website/_admin/AdminServicesManager.tsx` | P4 | **Create** — main admin component |
| 7 | `app/_components/website/_admin/AdminServiceForm.tsx` | P4 | **Create** — add/edit form modal |
| 8 | `app/_components/website/_admin/AdminServiceRow.tsx` | P4 | **Create** — service row with actions |
| 9 | `app/_components/website/_admin/AdminPagination.tsx` | P4 | **Create** — pagination controls |
| 10 | `app/_components/website/_home/ServicesSection.tsx` | P5 | Add hook, loading/empty/error states, RTL |
| 11 | `app/_components/website/_home/ServiceCard.tsx` | P5 | Graceful null handling |
| 12 | `translations/en.json` | P6 | Add services keys |
| 13 | `translations/ar.json` | P6 | Add services keys |
| 14 | `playwright.config.ts` | P7 | **Create** — playwright config |
| 15 | `tests/auth.setup.ts` | P7 | **Create** — admin auth setup |
| 16 | `tests/pages/AdminLoginPage.ts` | P7 | **Create** — login POM |
| 17 | `tests/pages/AdminServicesPage.ts` | P7 | **Create** — services POM |
| 18 | `tests/fixtures/index.ts` | P7 | **Create** — test fixtures |
| 19 | `tests/services-admin.spec.ts` | P8 | **Create** — all services E2E tests |
| 20 | `app/_components/website/_admin/AdminServiceForm.tsx` | P9 | Add validation |
| 21 | `app/hooks/admin/useAdminServices.ts` | P9 | Add error handling polish |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET/POST/PUT/DELETE /api/admin/services`, `PATCH /api/admin/services/:id/toggle`, `PATCH /api/admin/services/reorder`, `PATCH /api/admin/services/:id/reorder`. **Must verify with backend team** before Phase 2.

2. **No admin page route for services** — The admin dashboard (`AdminPageClient.tsx`) needs a route/section to render `AdminServicesManager`. This may require updates to the admin page layout.

3. **No drag-and-drop library installed** — `@dnd-kit/core` or similar not in `package.json`. Two options:
   - **Option A**: Install `@dnd-kit/core` + `@dnd-kit/sortable` for true drag-and-drop
   - **Option B**: Use up/down arrow buttons for reorder
   - **Decision needed** before Phase 4.

4. **Services header text source** — Services are independent entities (no FK to `home_page_content`). The section header (label, heading, description) has no backend storage. Options:
   - **Option A**: Store in translations (current approach — uses `t.services.label`, etc.)
   - **Option B**: Add header fields to `home_page_content` table (backend change needed)
   - **Decision needed** — current plan assumes Option A (translations).

5. **Icon field format ambiguity** — `icon` stores a string that could be SVG filename, icon class, or URL. Must coordinate with backend.

6. **Public endpoint returns all active services** — No pagination on public side. If services grow beyond ~20, performance may degrade. Consider caching.

7. **`data-testid` additions** — existing components need `data-testid` attributes for Playwright locators.

8. **Auth setup for tests** — assumes login API works and test credentials are valid. Need `.env.test` with real credentials.

9. **Character encoding for Arabic text** — Ensure all textarea inputs properly handle Arabic RTL text.

10. **Bulk reorder silently skips missing IDs** — Backend does not validate IDs exist before committing. Frontend should handle this gracefully.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 7:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 8:
npx playwright test tests/services-admin.spec.ts --project=chromium

# Full check:
pnpm build
```
