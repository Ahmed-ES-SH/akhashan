# ADMIN INTEGRATION PLAN

> Akhashan Frontend — Admin Dashboard Integration Plan
> Created: 2026-05-15
> Status: Pending Approval

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [Phase 1 — Foundation & Types](#phase-1--foundation--types)
4. [Phase 2 — Admin API Layer](#phase-2--admin-api-layer)
5. [Phase 3 — Shared Admin Components](#phase-3--shared-admin-components)
6. [Phase 4 — Admin Auth Gate (Step 1)](#phase-4--admin-auth-gate-step-1)
7. [Phase 5 — Interactive Home Page Editor (Step 2)](#phase-5--interactive-home-page-editor-step-2)
8. [Phase 6 — Contact Messages Page](#phase-6--contact-messages-page)
9. [Phase 7 — Services Page](#phase-7--services-page)
10. [Phase 8 — E2E Tests: Admin Home Page Editor](#phase-8--e2e-tests-admin-home-page-editor)
11. [Phase 9 — E2E Tests: Services Page](#phase-9--e2e-tests-services-page)
12. [Phase 10 — E2E Tests: Contact Messages Page](#phase-10--e2e-tests-contact-messages-page)
13. [File Structure](#file-structure)
14. [API Contract Summary](#api-contract-summary)
15. [Risk & Edge Cases](#risk--edge-cases)

---

## 1. Overview

This plan covers the creation of an admin dashboard at `/ar/admin` with:

- **Two-step flow**: Auth check → Interactive home page editor
- **Reusable components**: Single edit popup, single confirm dialog, single pagination component
- **CRUD pages**: Contact messages and services management
- **Zero logic repetition**: All shared logic extracted into hooks/helpers
- **Full API integration**: Following `integrations/ADMIN_INTEGRATION_PLAN.md`

---

## 2. Architecture Principles

| Principle | Implementation |
|---|---|
| **No repeated logic** | One `InlineEditPopup` component used for ALL editable fields |
| **Separation of concerns** | `page.tsx` = layout only, hooks = data logic, helpers = API calls |
| **i18n compliance** | All UI strings in `translations/en.json` and `translations/ar.json` |
| **Type safety** | All types defined in `app/types/website/admin.types.ts` |
| **Error handling** | `error.tsx` per page, `ApiError` class for API failures |
| **Loading states** | `loading.tsx` per page with skeleton UI |

---

## Phase 1 — Foundation & Types

### 1.1 Admin TypeScript Types

**File:** `app/types/website/admin.types.ts`

Create comprehensive types matching the backend API:

```typescript
// Auth types
interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: "admin" | "user";
  isEmailVerified: boolean;
}

interface LoginResponse {
  user: AdminUser;
  access_token: string;
}

// Home Page Content (raw backend shape)
interface AdminHomePageContent {
  id: number;
  hero_background_image_en: string | null;
  hero_background_image_ar: string | null;
  hero_badge_en: string;
  hero_badge_ar: string;
  hero_heading_en: string;
  hero_heading_ar: string;
  // ... all bilingual fields
  statItems: AdminStatItem[];
  licensingItems: AdminLicensingItem[];
  processSteps: AdminProcessStep[];
  createdAt: string;
  updatedAt: string;
}

// Child item types (StatItem, LicensingItem, ProcessStep, Service, Country, ContactMessage)
// Pagination types (PaginatedResponse, PaginationQuery)
// Reorder types (BulkReorderRequest)
// Status types (ContactMessageStatus)
```

### 1.2 Admin Translation Keys

**Files:** `translations/en.json`, `translations/ar.json`

Add keys for:
- `admin.login.*` — login form labels, errors, buttons
- `admin.editor.*` — editor UI strings (edit, save, cancel, delete, etc.)
- `admin.contactMessages.*` — contact messages page strings
- `admin.services.*` — services page strings
- `admin.common.*` — shared admin strings (pagination, confirmations, etc.)

### 1.3 Admin API Client Extension

**File:** `app/helpers/api/adminApi.ts`

Extend the base `api` client with auth-aware helpers:

```typescript
// getToken() — reads from localStorage (client) or cookies (server)
// adminGet<T>(path) — adds Authorization header
// adminPost<T, B>(path, body)
// adminPut<T, B>(path, body)
// adminPatch<T, B>(path, body)
// adminDelete<T>(path)
```

**Key decisions:**
- Token stored in `localStorage` after login (since httpOnly cookie can't be read client-side)
- All admin calls use `Authorization: Bearer <token>` header
- SSR pages will pass token via props or use server-side cookie reading

---

## Phase 2 — Admin API Layer

### 2.1 Auth API Functions

**File:** `app/helpers/api/adminApi.ts`

| Function | Method | Endpoint | Purpose |
|---|---|---|---|
| `adminLogin(email, password)` | POST | `/auth/login` | Authenticate admin |
| `adminGetCurrentUser()` | GET | `/auth/current-user` | Verify session |
| `adminLogout()` | POST | `/auth/logout` | End session |

### 2.2 Home Page Content API

| Function | Method | Endpoint |
|---|---|---|
| `adminGetHomeContent()` | GET | `/api/admin/home-page-content` |
| `adminUpdateHomeContent(data)` | PUT | `/api/admin/home-page-content` |
| `adminSeedHomeContent()` | POST | `/api/admin/home-page-content/seed` |

### 2.3 Child Items API (StatItems, LicensingItems, ProcessSteps)

Each entity gets the same CRUD pattern (no logic repetition — generic helper):

```typescript
// Generic CRUD helper used by all child entities
function createAdminCrudHooks<T>(basePath: string) {
  return {
    list: () => adminGet<T[]>(basePath),
    create: (data) => adminPost<T>(basePath, data),
    update: (id, data) => adminPut<T>(`${basePath}/${id}`, data),
    delete: (id) => adminDelete(`${basePath}/${id}`),
    reorder: (id, sortOrder) => adminPatch<T>(`${basePath}/${id}/reorder`, { sort_order: sortOrder }),
    bulkReorder: (ids) => adminPatch<T[]>(`${basePath}/reorder`, { ids }),
  };
}
```

### 2.4 Services API

| Function | Method | Endpoint |
|---|---|---|
| `adminGetServices(page, limit)` | GET | `/api/admin/services?page=&limit=` |
| `adminCreateService(data)` | POST | `/api/admin/services` |
| `adminUpdateService(id, data)` | PUT | `/api/admin/services/:id` |
| `adminDeleteService(id)` | DELETE | `/api/admin/services/:id` |
| `adminToggleService(id)` | PATCH | `/api/admin/services/:id/toggle` |
| `adminReorderService(id, order)` | PATCH | `/api/admin/services/:id/reorder` |
| `adminBulkReorderServices(ids)` | PATCH | `/api/admin/services/reorder` |

### 2.5 Contact Messages API

| Function | Method | Endpoint |
|---|---|---|
| `adminGetContactMessages(page, limit, status?)` | GET | `/api/admin/contact-messages` |
| `adminGetContactMessage(id)` | GET | `/api/admin/contact-messages/:id` |
| `adminUpdateContactMessageStatus(id, status)` | PATCH | `/api/admin/contact-messages/:id/status` |
| `adminDeleteContactMessage(id)` | DELETE | `/api/admin/contact-messages/:id` |

---

## Phase 3 — Shared Admin Components

### 3.1 InlineEditPopup (SINGLE reusable component)

**File:** `app/_components/website/_admin/InlineEditPopup.tsx`

**Purpose:** One popup used for ALL inline editing across the admin home page editor.

**Props:**
```typescript
interface InlineEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
  currentValue: string;
  label: string;        // Field label for the popup title
  fieldType?: "text" | "textarea" | "number";
  maxLength?: number;
  isSaving?: boolean;
}
```

**Behavior:**
- Opens on click of any editable element
- Shows current value in input/textarea
- Save button calls `onSave` with new value
- Loading state during save
- Cancel button closes without saving
- Keyboard: Escape to close, Ctrl+Enter to save

### 3.2 ConfirmDialog (SINGLE reusable component)

**File:** `app/_components/website/_admin/ConfirmDialog.tsx`

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isConfirming?: boolean;
}
```

### 3.3 AdminPagination (SINGLE reusable component)

**File:** `app/_components/website/_admin/AdminPagination.tsx`

**Props:**
```typescript
interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
```

### 3.4 AdminTable (SINGLE reusable component)

**File:** `app/_components/website/_admin/AdminTable.tsx`

Generic table component with:
- Column definitions (configurable)
- Row actions (edit, delete, toggle)
- Empty state
- Loading skeleton
- Sortable columns (future)

### 3.5 AdminStatusBadge

**File:** `app/_components/website/_admin/AdminStatusBadge.tsx`

Reusable badge for status display (contact messages, services, countries).

### 3.6 AdminLoginForm

**File:** `app/_components/website/_admin/AdminLoginForm.tsx`

- Email + password fields
- Validation with error display
- Loading state during login
- Remember me checkbox (optional)

---

## Phase 4 — Admin Auth Gate (Step 1)

### 4.1 Page Structure

**File:** `app/[locale]/admin/page.tsx`

```
┌─────────────────────────────────────┐
│           Admin Layout              │
├─────────────────────────────────────┤
│  Step 1: Check currentUser          │
│  ├── If NOT authenticated → Show    │
│  │   AdminLoginForm                 │
│  └── If authenticated → Show        │
│      Interactive Home Page Editor   │
│      (Step 2)                       │
└─────────────────────────────────────┘
```

### 4.2 Auth Check Hook

**File:** `app/hooks/admin/useAdminAuth.ts`

```typescript
function useAdminAuth() {
  // Checks localStorage for token
  // Calls /auth/current-user to verify
  // Returns { user, isLoading, isAuthenticated }
}
```

### 4.3 Login Hook

**File:** `app/hooks/admin/useAdminLogin.ts`

```typescript
function useAdminLogin() {
  // Calls /auth/login
  // Stores token in localStorage
  // Returns { login, isLoading, error }
}
```

### 4.4 Flow

1. Page loads → `useAdminAuth()` checks session
2. If no valid session → render `AdminLoginForm`
3. On successful login → token stored → re-check auth → render Step 2
4. If session exists → skip to Step 2

---

## Phase 5 — Interactive Home Page Editor (Step 2)

### 5.1 Architecture

**Key principle:** Clone the home page layout but wrap each text element with an editable trigger.

**File:** `app/_components/website/_admin/AdminHomeEditor.tsx`

### 5.2 Editable Text Wrapper

**File:** `app/_components/website/_admin/EditableText.tsx`

```typescript
interface EditableTextProps {
  value: string;
  fieldKey: string;       // e.g., "hero_badge_en"
  onSave: (fieldKey: string, value: string) => Promise<void>;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
}
```

**Behavior:**
- Renders the text normally
- On click → opens the SINGLE `InlineEditPopup`
- On save → calls `onSave(fieldKey, newValue)`
- Visual indicator on hover (edit icon or border highlight)

### 5.3 Editable List Component

**File:** `app/_components/website/_admin/EditableList.tsx`

For child items (statItems, licensingItems, processSteps):
- Render list with edit/delete/reorder controls
- Add button for new items
- Drag-and-drop reorder (or up/down buttons)
- Uses generic CRUD hooks

### 5.4 Data Flow

```
AdminHomeEditor
  ├── Fetch home content on mount (useAdminHomeContent hook)
  ├── Render sections with EditableText wrappers
  ├── Each EditableText → InlineEditPopup (shared instance)
  ├── Save → PUT /api/admin/home-page-content (partial update)
  └── Optimistic update → revert on error
```

### 5.5 Hooks

| Hook | File | Purpose |
|---|---|---|
| `useAdminHomeContent` | `app/hooks/admin/useAdminHomeContent.ts` | Fetch, update, seed home content |
| `useAdminStatItems` | `app/hooks/admin/useAdminStatItems.ts` | CRUD for stat items (uses generic helper) |
| `useAdminLicensingItems` | `app/hooks/admin/useAdminLicensingItems.ts` | CRUD for licensing items |
| `useAdminProcessSteps` | `app/hooks/admin/useAdminProcessSteps.ts` | CRUD for process steps |

### 5.6 Section Mapping

| Home Section | Admin Editable Fields |
|---|---|
| Hero | badge, heading, highlight_text, description, license, cta_primary, whatsapp_number, cta_whatsapp, background_image |
| Stats | label, heading, description + statItems (CRUD) |
| Licensing | label, heading, description + licensingItems (CRUD) |
| Process | label, heading, description + processSteps (CRUD) |
| Services Header | label, heading, description |
| Countries Header | label, heading, description |

---

## Phase 6 — Contact Messages Page

### 6.1 Page Structure

**File:** `app/[locale]/admin/contact-messages/page.tsx`

```
┌─────────────────────────────────────┐
│  Admin Layout                       │
├─────────────────────────────────────┤
│  Header: "Contact Messages"         │
│  Filters: Status dropdown           │
│  Table:                             │
│    | Name | Email | Service | ...  │
│    | ...  | ...   | ...     | ...  │
│  Pagination                         │
│  Detail Modal (on row click)        │
└─────────────────────────────────────┘
```

### 6.2 Features

| Feature | Implementation |
|---|---|
| List messages | Paginated table with `adminGetContactMessages` |
| Filter by status | Dropdown → refetch with `status` param |
| View detail | Modal with full message content |
| Update status | Dropdown in detail modal (new/read/replied/archived) |
| Delete message | ConfirmDialog → `adminDeleteContactMessage` |
| Mark as read | Quick action button on row |

### 6.3 Hook

**File:** `app/hooks/admin/useAdminContactMessages.ts`

```typescript
function useAdminContactMessages({ page, limit, status }) {
  // Fetches paginated messages
  // Provides updateStatus, deleteMessage functions
  // Handles loading, error states
}
```

---

## Phase 7 — Services Page

### 7.1 Page Structure

**File:** `app/[locale]/admin/services/page.tsx`

```
┌─────────────────────────────────────┐
│  Admin Layout                       │
├─────────────────────────────────────┤
│  Header: "Services"    [+ Add New]  │
│  Table:                             │
│    | Title | Active | Order | ...  │
│    | ...   | Toggle | Up/Down| ... │
│  Pagination                         │
│  Create/Edit Modal                  │
└─────────────────────────────────────┘
```

### 7.2 Features

| Feature | Implementation |
|---|---|
| List services | Paginated table with `adminGetServices` |
| Create service | Modal form → `adminCreateService` |
| Edit service | Modal form (pre-filled) → `adminUpdateService` |
| Delete service | ConfirmDialog → `adminDeleteService` |
| Toggle active | Quick toggle button → `adminToggleService` |
| Reorder | Up/down buttons or drag → `adminReorderService` |
| Bulk reorder | Drag-and-drop list → `adminBulkReorderServices` |

### 7.3 Hook

**File:** `app/hooks/admin/useAdminServices.ts`

```typescript
function useAdminServices({ page, limit }) {
  // Fetches paginated services
  // Provides create, update, delete, toggle, reorder functions
  // Handles loading, error states
}
```

---

## Phase 8 — E2E Tests: Admin Home Page Editor

### 8.1 Playwright Setup

**Files to create:**
```
e2e/
├── playwright.config.ts              # Playwright configuration
├── fixtures/
│   └── admin-auth.ts                 # Auth fixture for admin login
├── pages/
│   └── admin-home-editor.page.ts     # Page object for home editor
├── specs/
│   └── admin-home-editor.spec.ts     # Test scenarios
└── helpers/
    └── api-helpers.ts                # API helpers for test data setup/teardown
```

**Configuration (`e2e/playwright.config.ts`):**
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // Admin tests need sequential execution (shared state)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions on shared admin data
  reporter: [["html", { outputFolder: "e2e/playwright-report" }], ["list"]],
  use: {
    baseURL: process.env.FRONTEND_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ar", // Default to Arabic for admin tests
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 8.2 Auth Fixture

**File:** `e2e/fixtures/admin-auth.ts`

```typescript
import { test as base } from "@playwright/test";

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, use) => {
    // Login via API to get token
    const loginResponse = await page.request.post(
      `${process.env.API_URL || "http://localhost:5000"}/auth/login`,
      {
        data: {
          email: process.env.ADMIN_EMAIL || "admin@example.com",
          password: process.env.ADMIN_PASSWORD || "admin123",
        },
      }
    );

    const { access_token } = await loginResponse.json();

    // Store token in localStorage for the browser context
    await page.addInitScript((token) => {
      window.localStorage.setItem("admin_token", token);
    }, access_token);

    // Navigate to admin page
    await page.goto("/ar/admin");
    await page.waitForLoadState("networkidle");

    await use(page);

    // Cleanup: logout via API
    await page.request.post(
      `${process.env.API_URL || "http://localhost:5000"}/auth/logout`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
  },
});

export { expect } from "@playwright/test";
```

### 8.3 Page Object

**File:** `e2e/pages/admin-home-editor.page.ts`

```typescript
import { Page, Locator } from "@playwright/test";

export class AdminHomeEditorPage {
  readonly page: Page;

  // Section locators
  readonly heroSection: Locator;
  readonly statsSection: Locator;
  readonly licensingSection: Locator;
  readonly processSection: Locator;

  // Editable elements
  readonly editableTexts: Locator;
  readonly inlineEditPopup: Locator;
  readonly popupInput: Locator;
  readonly popupSaveButton: Locator;
  readonly popupCancelButton: Locator;

  // Child items
  readonly statItems: Locator;
  readonly licensingItems: Locator;
  readonly processSteps: Locator;
  readonly addItemButton: Locator;
  readonly deleteItemButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroSection = page.getByTestId("hero-section");
    this.statsSection = page.getByTestId("stats-section");
    this.licensingSection = page.getByTestId("licensing-section");
    this.processSection = page.getByTestId("process-section");

    this.editableTexts = page.locator("[data-testid='editable-text']");
    this.inlineEditPopup = page.getByTestId("inline-edit-popup");
    this.popupInput = this.inlineEditPopup.locator("input, textarea");
    this.popupSaveButton = this.inlineEditPopup.getByRole("button", { name: /save/i });
    this.popupCancelButton = this.inlineEditPopup.getByRole("button", { name: /cancel/i });

    this.statItems = page.locator("[data-testid='stat-item']");
    this.licensingItems = page.locator("[data-testid='licensing-item']");
    this.processSteps = page.locator("[data-testid='process-step']");
    this.addItemButton = page.getByRole("button", { name: /add/i });
    this.deleteItemButton = page.getByRole("button", { name: /delete/i });
  }

  async clickEditableText(index: number) {
    await this.editableTexts.nth(index).click();
    await this.inlineEditPopup.waitFor({ state: "visible" });
  }

  async editAndSave(newValue: string) {
    await this.popupInput.fill(newValue);
    await this.popupSaveButton.click();
    await this.inlineEditPopup.waitFor({ state: "hidden" });
  }

  async editAndCancel() {
    await this.popupCancelButton.click();
    await this.inlineEditPopup.waitFor({ state: "hidden" });
  }

  async addNewItem(section: "stat" | "licensing" | "process") {
    const sectionLocator =
      section === "stat"
        ? this.statsSection
        : section === "licensing"
        ? this.licensingSection
        : this.processSection;

    await sectionLocator.locator(this.addItemButton).click();
  }

  async deleteItem(section: "stat" | "licensing" | "process", index: number) {
    const sectionLocator =
      section === "stat"
        ? this.statsSection
        : section === "licensing"
        ? this.licensingSection
        : this.processSection;

    await sectionLocator.locator(this.deleteItemButton).nth(index).click();
    // Confirm deletion
    await page.getByRole("button", { name: /confirm/i }).click();
  }
}
```

### 8.4 Test Scenarios

**File:** `e2e/specs/admin-home-editor.spec.ts`

```typescript
import { test, expect } from "../fixtures/admin-auth";
import { AdminHomeEditorPage } from "../pages/admin-home-editor.page";

test.describe("Admin Home Page Editor", () => {
  let editorPage: AdminHomeEditorPage;

  test.beforeEach(async ({ adminPage }) => {
    editorPage = new AdminHomeEditorPage(adminPage);
  });

  test("should display all sections when authenticated", async () => {
    await expect(editorPage.heroSection).toBeVisible();
    await expect(editorPage.statsSection).toBeVisible();
    await expect(editorPage.licensingSection).toBeVisible();
    await expect(editorPage.processSection).toBeVisible();
  });

  test("should open edit popup when clicking editable text", async () => {
    await editorPage.clickEditableText(0);
    await expect(editorPage.inlineEditPopup).toBeVisible();
    await expect(editorPage.popupInput).toBeFocused();
  });

  test("should save edited text and update UI", async () => {
    const newValue = "Updated Hero Badge Test";

    await editorPage.clickEditableText(0);
    await editorPage.editAndSave(newValue);

    // Verify the text was updated on the page
    await expect(editorPage.page.getByText(newValue)).toBeVisible();
  });

  test("should cancel edit without changes", async () => {
    const originalText = await editorPage.editableTexts.nth(0).textContent();

    await editorPage.clickEditableText(0);
    await editorPage.popupInput.fill("This should not be saved");
    await editorPage.editAndCancel();

    // Verify text remains unchanged
    await expect(editorPage.editableTexts.nth(0)).toHaveText(originalText!);
  });

  test("should handle keyboard shortcuts (Escape to close, Ctrl+Enter to save)", async () => {
    await editorPage.clickEditableText(0);
    await editorPage.popupInput.press("Escape");
    await expect(editorPage.inlineEditPopup).toBeHidden();

    await editorPage.clickEditableText(0);
    await editorPage.popupInput.fill("Keyboard save test");
    await editorPage.popupInput.press("Control+Enter");
    await expect(editorPage.inlineEditPopup).toBeHidden();
  });

  test("should add new stat item", async () => {
    const initialCount = await editorPage.statItems.count();

    await editorPage.addNewItem("stat");
    // Fill in the new item form (assuming modal or inline form appears)
    // This depends on the actual implementation

    const newCount = await editorPage.statItems.count();
    expect(newCount).toBe(initialCount + 1);
  });

  test("should delete stat item with confirmation", async () => {
    const initialCount = await editorPage.statItems.count();
    if (initialCount === 0) test.skip("No items to delete");

    await editorPage.deleteItem("stat", 0);

    const newCount = await editorPage.statItems.count();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should handle API error gracefully (e.g., 500 response)", async () => {
    // This test would require mocking the API response
    // Using Playwright's route mocking:
    await editorPage.page.route("**/api/admin/home-page-content", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ statusCode: 500, message: "Server error" }),
      });
    });

    await editorPage.clickEditableText(0);
    await editorPage.popupInput.fill("This will fail");
    await editorPage.popupSaveButton.click();

    // Should show error toast/message
    await expect(editorPage.page.getByText(/error|failed/i)).toBeVisible();
  });

  test("should seed content if home page content doesn't exist", async () => {
    // First, delete existing content via API (if any)
    // Then navigate to admin page
    // Should auto-seed and display default content
    await expect(editorPage.heroSection).toBeVisible();
  });

  test("should handle concurrent edits (optimistic update + rollback)", async () => {
    // This is a more advanced test
    // Could simulate two browser contexts editing the same field
    // For now, test that error rollback works
  });
});
```

### 8.5 Test Data Setup/Teardown

**File:** `e2e/helpers/api-helpers.ts`

```typescript
import { APIRequestContext } from "@playwright/test";

export async function seedHomeContent(request: APIRequestContext) {
  const baseUrl = process.env.API_URL || "http://localhost:5000";

  // Login to get token
  const loginRes = await request.post(`${baseUrl}/auth/login`, {
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
    },
  });

  const { access_token } = await loginRes.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  // Seed content
  await request.post(`${baseUrl}/api/admin/home-page-content/seed`, {
    headers,
  });
}

export async function resetHomeContent(request: APIRequestContext) {
  // If needed, reset content to known state
  // This could involve PUT with known values or DELETE + SEED
}
```

### 8.6 Required Data Attributes

All editable elements in the admin home editor must have `data-testid` attributes:

```typescript
// In EditableText.tsx component:
<div data-testid="editable-text" data-field-key={fieldKey} onClick={handleClick}>
  {value}
</div>

// In section wrappers:
<section data-testid="hero-section">...</section>
<section data-testid="stats-section">...</section>
// etc.
```

---

## Phase 9 — E2E Tests: Services Page

### 9.1 Page Object

**File:** `e2e/pages/admin-services.page.ts`

```typescript
import { Page, Locator } from "@playwright/test";

export class AdminServicesPage {
  readonly page: Page;

  // Page elements
  readonly pageTitle: Locator;
  readonly addNewButton: Locator;
  readonly serviceTable: Locator;
  readonly serviceRows: Locator;
  readonly pagination: Locator;
  readonly statusFilter: Locator;

  // Modal elements
  readonly createEditModal: Locator;
  readonly modalTitleInput: Locator;
  readonly modalDescInput: Locator;
  readonly modalSaveButton: Locator;
  readonly modalCancelButton: Locator;

  // Row actions
  readonly toggleButtons: Locator;
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly reorderUpButtons: Locator;
  readonly reorderDownButtons: Locator;

  // Confirm dialog
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /services/i });
    this.addNewButton = page.getByRole("button", { name: /add new/i });
    this.serviceTable = page.getByTestId("services-table");
    this.serviceRows = page.locator("[data-testid='service-row']");
    this.pagination = page.getByTestId("admin-pagination");

    this.createEditModal = page.getByTestId("service-modal");
    this.modalTitleInput = this.createEditModal.locator("input[name='title_en']");
    this.modalDescInput = this.createEditModal.locator("textarea[name='desc_en']");
    this.modalSaveButton = this.createEditModal.getByRole("button", { name: /save/i });
    this.modalCancelButton = this.createEditModal.getByRole("button", { name: /cancel/i });

    this.toggleButtons = page.locator("[data-testid='toggle-active']");
    this.editButtons = page.locator("[data-testid='edit-service']");
    this.deleteButtons = page.locator("[data-testid='delete-service']");
    this.reorderUpButtons = page.locator("[data-testid='reorder-up']");
    this.reorderDownButtons = page.locator("[data-testid='reorder-down']");

    this.confirmDialog = page.getByTestId("confirm-dialog");
    this.confirmButton = this.confirmDialog.getByRole("button", { name: /confirm|delete/i });
  }

  async navigateToServices() {
    await this.page.goto("/ar/admin/services");
    await this.page.waitForLoadState("networkidle");
  }

  async clickAddNew() {
    await this.addNewButton.click();
    await this.createEditModal.waitFor({ state: "visible" });
  }

  async fillServiceForm(data: { titleEn: string; titleAr: string; descEn: string; descAr: string }) {
    await this.modalTitleInput.fill(data.titleEn);
    // Fill Arabic title
    await this.createEditModal.locator("input[name='title_ar']").fill(data.titleAr);
    await this.modalDescInput.fill(data.descEn);
    await this.createEditModal.locator("textarea[name='desc_ar']").fill(data.descAr);
  }

  async submitServiceForm() {
    await this.modalSaveButton.click();
    await this.createEditModal.waitFor({ state: "hidden" });
  }

  async cancelServiceForm() {
    await this.modalCancelButton.click();
    await this.createEditModal.waitFor({ state: "hidden" });
  }

  async toggleService(index: number) {
    await this.toggleButtons.nth(index).click();
    // Wait for toggle to complete (visual feedback or API call)
    await this.page.waitForTimeout(500);
  }

  async deleteService(index: number) {
    await this.deleteButtons.nth(index).click();
    await this.confirmDialog.waitFor({ state: "visible" });
    await this.confirmButton.click();
    await this.confirmDialog.waitFor({ state: "hidden" });
  }

  async editService(index: number) {
    await this.editButtons.nth(index).click();
    await this.createEditModal.waitFor({ state: "visible" });
  }

  async reorderUp(index: number) {
    await this.reorderUpButtons.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async reorderDown(index: number) {
    await this.reorderDownButtons.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async getServiceCount(): Promise<number> {
    return this.serviceRows.count();
  }

  async getServiceTitle(index: number): Promise<string | null> {
    return this.serviceRows.nth(index).locator("[data-testid='service-title']").textContent();
  }
}
```

### 9.2 Test Scenarios

**File:** `e2e/specs/admin-services.spec.ts`

```typescript
import { test, expect } from "../fixtures/admin-auth";
import { AdminServicesPage } from "../pages/admin-services.page";

test.describe("Admin Services Page", () => {
  let servicesPage: AdminServicesPage;

  test.beforeEach(async ({ adminPage }) => {
    servicesPage = new AdminServicesPage(adminPage);
    await servicesPage.navigateToServices();
  });

  test("should display services page with table", async () => {
    await expect(servicesPage.pageTitle).toBeVisible();
    await expect(servicesPage.serviceTable).toBeVisible();
    await expect(servicesPage.addNewButton).toBeVisible();
  });

  test("should create a new service", async () => {
    const initialCount = await servicesPage.getServiceCount();

    await servicesPage.clickAddNew();
    await servicesPage.fillServiceForm({
      titleEn: "Test Service EN",
      titleAr: "خدمة تجريبية",
      descEn: "Test service description",
      descAr: "وصف الخدمة التجريبية",
    });
    await servicesPage.submitServiceForm();

    const newCount = await servicesPage.getServiceCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the new service appears in the table
    await expect(servicesPage.page.getByText("Test Service EN")).toBeVisible();
  });

  test("should cancel service creation", async () => {
    await servicesPage.clickAddNew();
    await servicesPage.fillServiceForm({
      titleEn: "Should Not Appear",
      titleAr: "لا يجب أن يظهر",
      descEn: "Cancelled",
      descAr: "ملغي",
    });
    await servicesPage.cancelServiceForm();

    await expect(servicesPage.page.getByText("Should Not Appear")).not.toBeVisible();
  });

  test("should edit an existing service", async () => {
    const initialCount = await servicesPage.getServiceCount();
    if (initialCount === 0) test.skip("No services to edit");

    const originalTitle = await servicesPage.getServiceTitle(0);

    await servicesPage.editService(0);
    await servicesPage.modalTitleInput.fill("Updated Service Title");
    await servicesPage.submitServiceForm();

    await expect(servicesPage.page.getByText("Updated Service Title")).toBeVisible();
    if (originalTitle) {
      await expect(servicesPage.page.getByText(originalTitle)).not.toBeVisible();
    }
  });

  test("should delete a service with confirmation", async () => {
    const initialCount = await servicesPage.getServiceCount();
    if (initialCount === 0) test.skip("No services to delete");

    const titleToDelete = await servicesPage.getServiceTitle(0);

    await servicesPage.deleteService(0);

    const newCount = await servicesPage.getServiceCount();
    expect(newCount).toBe(initialCount - 1);

    if (titleToDelete) {
      await expect(servicesPage.page.getByText(titleToDelete)).not.toBeVisible();
    }
  });

  test("should toggle service active status", async () => {
    if (await servicesPage.getServiceCount() === 0) test.skip("No services");

    // Get initial state
    const toggleButton = servicesPage.toggleButtons.nth(0);
    const initialState = await toggleButton.getAttribute("aria-checked");

    await servicesPage.toggleService(0);

    // Verify state changed
    const newState = await toggleButton.getAttribute("aria-checked");
    expect(newState).not.toBe(initialState);
  });

  test("should reorder services (up/down)", async () => {
    if (await servicesPage.getServiceCount() < 2) test.skip("Need at least 2 services");

    const firstTitle = await servicesPage.getServiceTitle(0);
    const secondTitle = await servicesPage.getServiceTitle(1);

    // Move second item up
    await servicesPage.reorderUp(1);

    // Verify order changed
    const newFirstTitle = await servicesPage.getServiceTitle(0);
    expect(newFirstTitle).toBe(secondTitle);
  });

  test("should handle pagination", async () => {
    // This test assumes there are enough services to paginate
    // Could create many services via API first
    await expect(servicesPage.pagination).toBeVisible();

    // Click next page
    await servicesPage.pagination.getByRole("button", { name: /next|2/i }).click();
    await servicesPage.page.waitForLoadState("networkidle");

    // Verify page number updated
    await expect(servicesPage.pagination.getByRole("button", { name: /2/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  test("should show empty state when no services", async () => {
    // Delete all services via API first
    // Then verify empty state
    await expect(servicesPage.page.getByText(/no services|empty/i)).toBeVisible();
  });

  test("should handle validation errors on create", async () => {
    await servicesPage.clickAddNew();
    // Submit empty form
    await servicesPage.submitServiceForm();

    // Should show validation errors
    await expect(servicesPage.page.getByText(/required|invalid/i)).toBeVisible();
  });

  test("should handle API error (e.g., 409 conflict, 500 server error)", async () => {
    await servicesPage.page.route("**/api/admin/services", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ statusCode: 500, message: "Server error" }),
      });
    });

    await servicesPage.clickAddNew();
    await servicesPage.fillServiceForm({
      titleEn: "Will Fail",
      titleAr: "سيفشل",
      descEn: "Error test",
      descAr: "اختبار خطأ",
    });
    await servicesPage.submitServiceForm();

    // Should show error message
    await expect(servicesPage.page.getByText(/error|failed/i)).toBeVisible();
  });
});
```

---

## Phase 10 — E2E Tests: Contact Messages Page

### 10.1 Page Object

**File:** `e2e/pages/admin-contact-messages.page.ts`

```typescript
import { Page, Locator } from "@playwright/test";

export class AdminContactMessagesPage {
  readonly page: Page;

  // Page elements
  readonly pageTitle: Locator;
  readonly statusFilter: Locator;
  readonly messageTable: Locator;
  readonly messageRows: Locator;
  readonly pagination: Locator;

  // Detail modal
  readonly detailModal: Locator;
  readonly detailName: Locator;
  readonly detailEmail: Locator;
  readonly detailMessage: Locator;
  readonly statusDropdown: Locator;
  readonly deleteButton: Locator;
  readonly closeModalButton: Locator;

  // Confirm dialog
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;

  // Row actions
  readonly markAsReadButtons: Locator;
  readonly viewButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /contact messages/i });
    this.statusFilter = page.getByTestId("status-filter");
    this.messageTable = page.getByTestId("contact-messages-table");
    this.messageRows = page.locator("[data-testid='message-row']");
    this.pagination = page.getByTestId("admin-pagination");

    this.detailModal = page.getByTestId("message-detail-modal");
    this.detailName = this.detailModal.locator("[data-testid='detail-name']");
    this.detailEmail = this.detailModal.locator("[data-testid='detail-email']");
    this.detailMessage = this.detailModal.locator("[data-testid='detail-message']");
    this.statusDropdown = this.detailModal.locator("select[name='status']");
    this.deleteButton = this.detailModal.getByRole("button", { name: /delete/i });
    this.closeModalButton = this.detailModal.getByRole("button", { name: /close/i });

    this.confirmDialog = page.getByTestId("confirm-dialog");
    this.confirmButton = this.confirmDialog.getByRole("button", { name: /confirm|delete/i });

    this.markAsReadButtons = page.locator("[data-testid='mark-as-read']");
    this.viewButtons = page.locator("[data-testid='view-message']");
  }

  async navigateToContactMessages() {
    await this.page.goto("/ar/admin/contact-messages");
    await this.page.waitForLoadState("networkidle");
  }

  async filterByStatus(status: "new" | "read" | "replied" | "archived") {
    await this.statusFilter.selectOption(status);
    await this.page.waitForLoadState("networkidle");
  }

  async viewMessage(index: number) {
    await this.viewButtons.nth(index).click();
    await this.detailModal.waitFor({ state: "visible" });
  }

  async closeDetailModal() {
    await this.closeModalButton.click();
    await this.detailModal.waitFor({ state: "hidden" });
  }

  async updateStatus(status: "new" | "read" | "replied" | "archived") {
    await this.statusDropdown.selectOption(status);
    // Wait for status update to complete
    await this.page.waitForTimeout(500);
  }

  async deleteMessageFromModal() {
    await this.deleteButton.click();
    await this.confirmDialog.waitFor({ state: "visible" });
    await this.confirmButton.click();
    await this.confirmDialog.waitFor({ state: "hidden" });
    await this.detailModal.waitFor({ state: "hidden" });
  }

  async markAsRead(index: number) {
    await this.markAsReadButtons.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  async getMessageCount(): Promise<number> {
    return this.messageRows.count();
  }

  async getMessageName(index: number): Promise<string | null> {
    return this.messageRows.nth(index).locator("[data-testid='message-name']").textContent();
  }

  async getMessageStatus(index: number): Promise<string | null> {
    return this.messageRows.nth(index).locator("[data-testid='message-status']").textContent();
  }
}
```

### 10.2 Test Scenarios

**File:** `e2e/specs/admin-contact-messages.spec.ts`

```typescript
import { test, expect } from "../fixtures/admin-auth";
import { AdminContactMessagesPage } from "../pages/admin-contact-messages.page";

test.describe("Admin Contact Messages Page", () => {
  let contactMessagesPage: AdminContactMessagesPage;

  test.beforeEach(async ({ adminPage }) => {
    contactMessagesPage = new AdminContactMessagesPage(adminPage);
    await contactMessagesPage.navigateToContactMessages();
  });

  test("should display contact messages page with table", async () => {
    await expect(contactMessagesPage.pageTitle).toBeVisible();
    await expect(contactMessagesPage.messageTable).toBeVisible();
    await expect(contactMessagesPage.statusFilter).toBeVisible();
  });

  test("should filter messages by status", async () => {
    await contactMessagesPage.filterByStatus("new");

    // Verify all visible messages have "new" status
    const rowCount = await contactMessagesPage.getMessageCount();
    for (let i = 0; i < rowCount; i++) {
      const status = await contactMessagesPage.getMessageStatus(i);
      expect(status?.toLowerCase()).toBe("new");
    }
  });

  test("should view message details in modal", async () => {
    if (await contactMessagesPage.getMessageCount() === 0) test.skip("No messages");

    const expectedName = await contactMessagesPage.getMessageName(0);

    await contactMessagesPage.viewMessage(0);

    await expect(contactMessagesPage.detailModal).toBeVisible();
    await expect(contactMessagesPage.detailName).toHaveText(expectedName!);
    await expect(contactMessagesPage.detailEmail).toBeVisible();
    await expect(contactMessagesPage.detailMessage).toBeVisible();
  });

  test("should update message status", async () => {
    if (await contactMessagesPage.getMessageCount() === 0) test.skip("No messages");

    await contactMessagesPage.viewMessage(0);
    await contactMessagesPage.updateStatus("read");
    await contactMessagesPage.closeDetailModal();

    // Verify status updated in table
    const status = await contactMessagesPage.getMessageStatus(0);
    expect(status?.toLowerCase()).toBe("read");
  });

  test("should delete message with confirmation", async () => {
    const initialCount = await contactMessagesPage.getMessageCount();
    if (initialCount === 0) test.skip("No messages to delete");

    const nameToDelete = await contactMessagesPage.getMessageName(0);

    await contactMessagesPage.viewMessage(0);
    await contactMessagesPage.deleteMessageFromModal();

    const newCount = await contactMessagesPage.getMessageCount();
    expect(newCount).toBe(initialCount - 1);

    if (nameToDelete) {
      await expect(contactMessagesPage.page.getByText(nameToDelete)).not.toBeVisible();
    }
  });

  test("should mark message as read from table", async () => {
    if (await contactMessagesPage.getMessageCount() === 0) test.skip("No messages");

    const initialStatus = await contactMessagesPage.getMessageStatus(0);
    expect(initialStatus?.toLowerCase()).not.toBe("read");

    await contactMessagesPage.markAsRead(0);

    const newStatus = await contactMessagesPage.getMessageStatus(0);
    expect(newStatus?.toLowerCase()).toBe("read");
  });

  test("should handle pagination", async () => {
    // Assumes enough messages exist to paginate
    await expect(contactMessagesPage.pagination).toBeVisible();

    // Click next page
    await contactMessagesPage.pagination.getByRole("button", { name: /next|2/i }).click();
    await contactMessagesPage.page.waitForLoadState("networkidle");

    // Verify page number updated
    await expect(contactMessagesPage.pagination.getByRole("button", { name: /2/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  test("should show empty state when no messages", async () => {
    // Delete all messages via API first
    // Then verify empty state
    await expect(contactMessagesPage.page.getByText(/no messages|empty/i)).toBeVisible();
  });

  test("should close modal with Escape key", async () => {
    if (await contactMessagesPage.getMessageCount() === 0) test.skip("No messages");

    await contactMessagesPage.viewMessage(0);
    await contactMessagesPage.page.keyboard.press("Escape");
    await expect(contactMessagesPage.detailModal).toBeHidden();
  });

  test("should handle API error (e.g., 404 on delete, 500 server error)", async () => {
    await contactMessagesPage.page.route(
      "**/api/admin/contact-messages/*/status",
      async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ statusCode: 500, message: "Server error" }),
        });
      }
    );

    if (await contactMessagesPage.getMessageCount() === 0) test.skip("No messages");

    await contactMessagesPage.viewMessage(0);
    await contactMessagesPage.updateStatus("read");

    // Should show error message
    await expect(contactMessagesPage.page.getByText(/error|failed/i)).toBeVisible();
  });

  test("should handle invalid status filter value", async () => {
    // Try to filter with invalid status
    // Should either ignore or show error
    await contactMessagesPage.page.route(
      "**/api/admin/contact-messages?status=invalid",
      async (route) => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ statusCode: 400, message: "Invalid status" }),
        });
      }
    );

    // The UI should handle this gracefully
    // Either show error or fallback to no filter
  });
});
```

### 10.3 Test Data Setup for Contact Messages

**File:** `e2e/helpers/contact-message-factory.ts`

```typescript
import { APIRequestContext } from "@playwright/test";

export async function createTestContactMessage(
  request: APIRequestContext,
  overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    service: string;
    country: string;
    message: string;
    status: "new" | "read" | "replied" | "archived";
  }> = {}
) {
  const baseUrl = process.env.API_URL || "http://localhost:5000";

  // Login to get token
  const loginRes = await request.post(`${baseUrl}/auth/login`, {
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
    },
  });

  const { access_token } = await loginRes.json();

  // Create message via public endpoint (or admin endpoint if available)
  const response = await request.post(`${baseUrl}/api/contact`, {
    data: {
      name: overrides.name || "Test User",
      email: overrides.email || `test-${Date.now()}@example.com`,
      phone: overrides.phone || "+966500000000",
      service: overrides.service || "Test Service",
      country: overrides.country || "Saudi Arabia",
      message: overrides.message || "Test message content",
    },
  });

  return response.json();
}

export async function deleteAllContactMessages(request: APIRequestContext) {
  const baseUrl = process.env.API_URL || "http://localhost:5000";

  const loginRes = await request.post(`${baseUrl}/auth/login`, {
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
    },
  });

  const { access_token } = await loginRes.json();
  const headers = { Authorization: `Bearer ${access_token}` };

  // Get all messages
  const messagesRes = await request.get(`${baseUrl}/api/admin/contact-messages?limit=100`, {
    headers,
  });

  const { data: messages } = await messagesRes.json();

  // Delete all
  for (const msg of messages) {
    await request.delete(`${baseUrl}/api/admin/contact-messages/${msg.id}`, {
      headers,
    });
  }
}
```

---

## E2E Testing Best Practices

### Test Isolation
- Each test should be independent and not rely on other tests
- Use `beforeEach` to reset state
- Clean up test data in `afterEach` or `afterAll`

### API Mocking Strategy
- Use Playwright's `page.route()` to mock API responses for error cases
- Test real API for happy paths
- Mock only when testing specific error scenarios (500, 404, etc.)

### Test Environment
- Use a dedicated test database or seed data before test runs
- Environment variables:
  ```env
  ADMIN_EMAIL=admin@example.com
  ADMIN_PASSWORD=admin123
  API_URL=http://localhost:5000
  FRONTEND_URL=http://localhost:3000
  ```

### Running Tests
```bash
# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test e2e/specs/admin-home-editor.spec.ts

# Run with UI
pnpm exec playwright test --ui

# Run with report
pnpm exec playwright test --reporter=html
```

### CI Integration
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 30
```

---

## File Structure

```
app/
├── types/
│   └── website/
│       └── admin.types.ts                    # [NEW] All admin types
├── helpers/
│   └── api/
│       └── adminApi.ts                       # [NEW] Admin API client + functions
├── hooks/
│   └── admin/
│       ├── useAdminAuth.ts                   # [NEW] Auth check hook
│       ├── useAdminLogin.ts                  # [NEW] Login hook
│       ├── useAdminHomeContent.ts            # [NEW] Home content hook
│       ├── useAdminStatItems.ts              # [NEW] Stat items CRUD hook
│       ├── useAdminLicensingItems.ts         # [NEW] Licensing items CRUD hook
│       ├── useAdminProcessSteps.ts           # [NEW] Process steps CRUD hook
│       ├── useAdminContactMessages.ts        # [NEW] Contact messages hook
│       └── useAdminServices.ts               # [NEW] Services hook
├── _components/
│   └── website/
│       └── _admin/
│           ├── InlineEditPopup.tsx           # [NEW] SINGLE reusable edit popup
│           ├── ConfirmDialog.tsx             # [NEW] SINGLE reusable confirm dialog
│           ├── AdminPagination.tsx           # [NEW] SINGLE reusable pagination
│           ├── AdminTable.tsx                # [NEW] SINGLE reusable table
│           ├── AdminStatusBadge.tsx          # [NEW] Status badge component
│           ├── AdminLoginForm.tsx            # [NEW] Login form component
│           ├── AdminHomeEditor.tsx           # [NEW] Interactive home page editor
│           ├── EditableText.tsx              # [NEW] Click-to-edit text wrapper
│           ├── EditableList.tsx              # [NEW] Editable list with CRUD
│           ├── ContactMessagesPage.tsx       # [NEW] Contact messages UI
│           └── ServicesPage.tsx              # [NEW] Services management UI
├── [locale]/
│   └── admin/
│       ├── page.tsx                          # [NEW] Main admin page (2-step flow)
│       ├── loading.tsx                       # [NEW] Loading skeleton
│       ├── error.tsx                         # [NEW] Error boundary
│       ├── contact-messages/
│       │   ├── page.tsx                      # [NEW] Contact messages page
│       │   ├── loading.tsx                   # [NEW]
│       │   └── error.tsx                     # [NEW]
│       └── services/
│           ├── page.tsx                      # [NEW] Services page
│           ├── loading.tsx                   # [NEW]
│           └── error.tsx                     # [NEW]
```

---

## API Contract Summary

### Authentication

| Action | Method | Endpoint | Auth |
|---|---|---|---|
| Login | POST | `/auth/login` | Public |
| Check session | GET | `/auth/current-user` | Bearer token |
| Logout | POST | `/auth/logout` | Bearer token |

### Home Page Content

| Action | Method | Endpoint |
|---|---|---|
| Get content | GET | `/api/admin/home-page-content` |
| Update content | PUT | `/api/admin/home-page-content` |
| Seed content | POST | `/api/admin/home-page-content/seed` |

### Child Items (StatItems, LicensingItems, ProcessSteps)

| Action | Method | Endpoint |
|---|---|---|
| List | GET | `/api/admin/{resource}` |
| Create | POST | `/api/admin/{resource}` |
| Update | PUT | `/api/admin/{resource}/:id` |
| Delete | DELETE | `/api/admin/{resource}/:id` |
| Reorder | PATCH | `/api/admin/{resource}/:id/reorder` |
| Bulk reorder | PATCH | `/api/admin/{resource}/reorder` |

### Services

| Action | Method | Endpoint |
|---|---|---|
| List (paginated) | GET | `/api/admin/services?page=&limit=` |
| Create | POST | `/api/admin/services` |
| Update | PUT | `/api/admin/services/:id` |
| Delete | DELETE | `/api/admin/services/:id` |
| Toggle active | PATCH | `/api/admin/services/:id/toggle` |
| Reorder | PATCH | `/api/admin/services/:id/reorder` |
| Bulk reorder | PATCH | `/api/admin/services/reorder` |

### Contact Messages

| Action | Method | Endpoint |
|---|---|---|
| List (paginated, filterable) | GET | `/api/admin/contact-messages?page=&limit=&status=` |
| Get single | GET | `/api/admin/contact-messages/:id` |
| Update status | PATCH | `/api/admin/contact-messages/:id/status` |
| Delete | DELETE | `/api/admin/contact-messages/:id` |

---

## Risk & Edge Cases

### 1. Token Storage
- **Risk:** localStorage is accessible to XSS attacks
- **Mitigation:** Token is short-lived (5 days), logout clears it, httpOnly cookie is the primary auth mechanism

### 2. Concurrent Edits
- **Risk:** Two admins editing same field simultaneously
- **Mitigation:** Backend uses atomic upsert; frontend uses optimistic updates with rollback on error

### 3. Missing Home Content (404)
- **Risk:** GET returns 404 if no content exists
- **Mitigation:** Auto-call seed endpoint on 404, then proceed

### 4. Bulk Reorder Empty Array
- **Risk:** Backend returns 400 if `ids` array is empty
- **Mitigation:** Validate before sending; disable bulk reorder button if no changes

### 5. HTML in Hero Fields
- **Risk:** Hero heading/description may contain HTML (`<br>`, `<span>`, etc.)
- **Mitigation:** Display with `dangerouslySetInnerHTML` in editor; sanitize on save (backend handles this)

### 6. Bilingual Content
- **Risk:** Admin edits only one language
- **Mitigation:** Editor shows both EN/AR fields side-by-side or with language toggle

### 7. Rate Limiting
- **Risk:** Login rate limit (5 per 6 hours)
- **Mitigation:** Show clear error message with retry time

### 8. Pagination Edge Cases
- **Risk:** Page number exceeds total pages
- **Mitigation:** Clamp to last valid page; show empty state

---

## Implementation Order

```
Phase 1: Types + Translations + API Client    → Foundation
Phase 2: Admin API Functions                   → Data layer
Phase 3: Shared Components                     → UI building blocks
Phase 4: Admin Auth Gate                       → Step 1 (login)
Phase 5: Interactive Home Editor               → Step 2 (editor)
Phase 6: Contact Messages Page                 → CRUD page
Phase 7: Services Page                         → CRUD page
Phase 8: E2E Tests — Home Editor               → Test interactive editing
Phase 9: E2E Tests — Services                  → Test CRUD operations
Phase 10: E2E Tests — Contact Messages         → Test message management
```

Each phase is independent and can be reviewed separately.

---

## Success Criteria

### Feature Implementation
- [ ] Admin can login at `/ar/admin`
- [ ] Unauthenticated users see login form
- [ ] Authenticated users see interactive home page editor
- [ ] Clicking any text opens the SINGLE edit popup
- [ ] Saving updates the backend and reflects immediately
- [ ] Contact messages page shows paginated list with filters
- [ ] Contact message status can be updated
- [ ] Contact messages can be deleted
- [ ] Services page shows paginated list
- [ ] Services can be created, edited, deleted
- [ ] Services active status can be toggled
- [ ] Services can be reordered
- [ ] No logic repetition — shared components used everywhere
- [ ] All UI strings in translation files
- [ ] TypeScript strict mode — no `any` types
- [ ] `pnpm lint` passes with zero errors

### E2E Test Coverage
- [ ] Playwright configured and installed
- [ ] Auth fixture working (login via API, store token)
- [ ] Page objects created for all 3 pages
- [ ] Home Editor: 10+ test scenarios passing
- [ ] Services: 11+ test scenarios passing
- [ ] Contact Messages: 11+ test scenarios passing
- [ ] All tests pass in CI environment
- [ ] Test report generated on failure
- [ ] Test data setup/teardown working correctly
