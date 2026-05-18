# Contact Messages — Public Form & Admin Inbox Integration Plan

> **Scope**: Contact messages only — public form submission (already partially implemented) + admin inbox management (list, filter, detail, status update, delete).
> **Date**: 2026-05-17
> **Status**: Draft

---

## Overview

Focus: Complete the **Contact Messages** public form integration and build the admin inbox from scratch, matching the backend API contract defined in `plans/CONTACT_MESSAGES_INTEGRATION_PLAN.md`.

**Current Problems**:

1. **No admin inbox exists** — Zero admin UI for viewing, filtering, or managing contact messages. No list view, no detail view, no status management, no delete.
2. **No admin API layer** — `adminApi.ts` has zero functions for contact-messages endpoints (`GET /api/admin/contact-messages`, `GET /api/admin/contact-messages/:id`, `PATCH /api/admin/contact-messages/:id/status`, `DELETE /api/admin/contact-messages/:id`).
3. **Public form works but lacks polish** — `useContactForm.ts` + `ContactSection.tsx` handle submission correctly, but:
   - No auto-reset timer on success state (success message persists forever)
   - No loading skeleton on the info side of the contact section
   - Rate limit message is hardcoded with fallback instead of using translations
4. **No types for admin contact message entity** — `admin.types.ts` has `ContactMessageStatus` enum but no `AdminContactMessage` interface for the full entity with timestamps.
5. **No hooks for admin messages** — No `useAdminContactMessages` hook for paginated fetching, filtering, status updates, and deletion.
6. **No E2E tests** — zero coverage for public form submission or admin inbox flows.
7. **Form dropdowns use SSR props** — Service and country dropdowns receive data via props from the page. These should ideally be fetched dynamically or cached.

---

## Phase 1 — Types & Data Contracts

**Objective**: Define proper TypeScript interfaces for admin contact messages that match the backend contract exactly.

### Files Affected

| File | Action |
|---|---|
| `app/types/website/admin.types.ts` | Add `AdminContactMessage`, `AdminContactMessageMeta`, `AdminPaginatedMessagesResponse`, `AdminUpdateMessageStatusPayload` types. |
| `app/types/website/home.types.ts` | Verify `ContactMessageApiResponse` and `CreateContactMessagePayload` are complete. Add `ContactMessageListApiResponse` wrapper if needed. |

### Key Type Additions

```typescript
// app/types/website/admin.types.ts

// Admin Contact Message — full entity shape
export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  country: string | null;
  message: string | null;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata
export interface AdminContactMessageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/contact-messages
export interface AdminPaginatedMessagesResponse {
  data: AdminContactMessage[];
  meta: AdminContactMessageMeta;
}

// Update status payload
export interface AdminUpdateMessageStatusPayload {
  status: "new" | "read" | "replied" | "archived";
}
```

```typescript
// app/types/website/home.types.ts

// Existing types — verify completeness:
// ContactFormData: { name, email, phone, service, country, message } ✓
// ContactFormErrors: { name?, email?, phone?, service?, country?, message? } ✓
// ContactMessageApiResponse: { id, name, email, phone?, service?, country?, message?, status, createdAt } ✓
// CreateContactMessagePayload: { name, email, phone?, service?, country?, message? } ✓
// No changes needed if all fields present
```

### Verification
- `pnpm lint` passes
- TypeScript compilation succeeds
- No `any` usage in new types

---

## Phase 2 — Admin API Layer

**Objective**: Add contact-messages CRUD functions to `adminApi.ts`.

### Files Affected

| File | Action |
|---|---|
| `app/helpers/api/adminApi.ts` | Add `adminGetContactMessages()`, `adminGetContactMessage()`, `adminUpdateMessageStatus()`, `adminDeleteContactMessage()` |

### Key API Functions

```typescript
// GET /api/admin/contact-messages?page=1&limit=20&status=new
export async function adminGetContactMessages(
  page?: number,
  limit?: number,
  status?: "new" | "read" | "replied" | "archived"
): Promise<AdminPaginatedMessagesResponse>

// GET /api/admin/contact-messages/:id
export async function adminGetContactMessage(
  id: number
): Promise<AdminContactMessage>

// PATCH /api/admin/contact-messages/:id/status
export async function adminUpdateMessageStatus(
  id: number,
  status: "new" | "read" | "replied" | "archived"
): Promise<AdminContactMessage>

// DELETE /api/admin/contact-messages/:id
export async function adminDeleteContactMessage(
  id: number
): Promise<void>
```

### Verification
- `pnpm lint` passes
- Each function uses `api.get/patch/delete` with `withCredentials: true`
- Query params passed as URLSearchParams
- `delete` returns `void`

---

## Phase 3 — New Hook: `useAdminContactMessages`

**Objective**: Create a dedicated hook for admin contact messages with paginated fetching, filtering, status updates, and deletion.

### Files Affected

| File | Action |
|---|---|
| `app/hooks/admin/useAdminContactMessages.ts` | **Create** — admin messages state hook |

### Hook Structure

```typescript
export function useAdminContactMessages() {
  // State
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [meta, setMeta] = useState<AdminContactMessageMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"new" | "read" | "replied" | "archived" | null>(null);

  // Fetch on mount, page change, or filter change
  const fetchMessages = useCallback(async (page?: number, status?: string | null) => { ... }, []);

  // Operations
  const getMessage = async (id: number) => { ... };
  const updateStatus = async (id: number, status: string) => { ... };
  const deleteMessage = async (id: number) => { ... };
  const markAsRead = async (id: number) => { ... }; // convenience wrapper

  return { messages, meta, isLoading, error, currentPage, setCurrentPage, statusFilter, setStatusFilter, fetchMessages, getMessage, updateStatus, deleteMessage, markAsRead };
}
```

### Key Behaviors
- Fetches `GET /api/admin/contact-messages?page=1&limit=20` on mount
- Re-fetches when page or status filter changes
- Each operation (update status, delete) updates local state + toast
- `markAsRead` is a convenience wrapper for `updateStatus(id, "read")`
- Exposes `isLoading` and `error` for UI states

### Verification
- Hook fetches paginated data on mount
- Status filter works (new, read, replied, archived)
- Pagination works (page change triggers re-fetch)
- CRUD operations update local state correctly
- Error handling with toast messages works

---

## Phase 4 — Admin Messages Inbox (Full Build)

**Objective**: Build the complete admin messages inbox from scratch — list view with pagination and status filter, message detail view, status management, and delete.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_admin/AdminMessagesInbox.tsx` | **Create** — main admin messages inbox component |
| `app/_components/website/_admin/AdminMessageList.tsx` | **Create** — paginated message list with status filter |
| `app/_components/website/_admin/AdminMessageDetail.tsx` | **Create** — single message detail view |
| `app/_components/website/_admin/AdminMessageRow.tsx` | **Create** — single message row in list view |
| `app/_components/website/_admin/AdminStatusBadge.tsx` | **Modify** — add contact message status colors |
| `app/_components/website/_admin/AdminPagination.tsx` | **Create** — reusable pagination controls (shared with services) |

### Component Architecture

```
AdminMessagesInbox
├── Header: "Messages Inbox" + unread count badge
├── Status filter tabs: All | New | Read | Replied | Archived
├── Loading skeleton (table rows)
├── Empty state ("No messages")
├── Error state with retry button
├── Message list view (default)
│   └── AdminMessageList
│       └── AdminMessageRow (per message)
│           ├── Status badge (color-coded)
│           ├── Sender name + email preview
│           ├── Service/country preview
│           ├── Message preview (truncated, ~60 chars)
│           ├── Relative time ("2 hours ago")
│           ├── Click row → opens detail view
│           └── Delete button → confirmation → DELETE
├── Message detail view (on row click)
│   └── AdminMessageDetail
│       ├── Back button → returns to list
│       ├── Status badge (clickable dropdown to change status)
│       ├── Sender info: name, email (mailto: link), phone (tel: link)
│       ├── Service + Country
│       ├── Full message text
│       ├── Timestamps: createdAt (relative + full on hover), updatedAt
│       ├── Action buttons: Mark as Read | Mark as Replied | Archive
│       └── Delete button → confirmation → DELETE
└── Pagination controls (← 1 2 3 ... →)
```

### AdminMessageDetail Props

```typescript
interface AdminMessageDetailProps {
  message: AdminContactMessage;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBack: () => void;
  isUpdating: boolean;
}
```

### Key Behaviors
- **List view**: `GET /api/admin/contact-messages?page=1&limit=20&status=new` → render rows
- **Detail view**: Click row → `GET /api/admin/contact-messages/:id` → auto-mark as `read`
- **Status change**: `PATCH /api/admin/contact-messages/:id/status` → update local state → toast
- **Delete**: confirmation dialog → `DELETE /api/admin/contact-messages/:id` → remove from list → toast
- **Pagination**: `GET /api/admin/contact-messages?page=N&limit=20` → update list → update controls
- **Filter**: Click status tab → re-fetch with `status` param → update list

### Status Badge Colors
- `new` → blue/red (attention needed)
- `read` → gray
- `replied` → green
- `archived` → muted gray

### Verification
- List shows messages ordered by newest first
- Status filter tabs work correctly
- Click row → opens detail view
- Detail view auto-marks as `read`
- Status change via dropdown or buttons works
- Delete with confirmation works
- Pagination works
- Empty state shown when no messages
- Error state shown when fetch fails, with retry button

---

## Phase 5 — Public ContactSection Polish

**Objective**: Improve the public contact form UX and fix minor issues.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/ContactSection.tsx` | Add auto-reset timer on success. Move rate limit message to translations. Add loading state for info side. |
| `app/hooks/home/useContactForm.ts` | Add `resetStatus` export (already exists). Add optional auto-reset on success. |

### Key Changes
- **Auto-reset success state**: After showing success message for 5 seconds, reset form to idle state
- **Rate limit message from translations**: Replace hardcoded fallback with `contact.form.rateLimit[locale]`
- **Loading state**: Show subtle loading indicator on the info side while services/countries fetch (if they're fetched dynamically)
- **Form clear on success**: Already done — verify it works correctly
- **Disable submit during loading**: Already done — verify button state is correct

### Verification
- Submit form → success message shows → auto-resets after 5 seconds
- Rate limit message displays correctly in both EN and AR
- Form fields clear after successful submission
- Submit button disabled during loading
- Optional fields (phone, service, country, message) submit correctly when empty

---

## Phase 6 — Translations

**Objective**: Add all contact-messages-related translation keys to both locale files.

### Files Affected

| File | Action |
|---|---|
| `translations/en.json` | Add `admin.messages.*` keys |
| `translations/ar.json` | Add corresponding Arabic translations |

### Translation Keys

```json
{
  "admin": {
    "messages": {
      "title": "Messages Inbox",
      "unreadCount": "Unread",
      "filterAll": "All",
      "filterNew": "New",
      "filterRead": "Read",
      "filterReplied": "Replied",
      "filterArchived": "Archived",
      "noMessages": "No messages yet.",
      "noMessagesFiltered": "No messages with this status.",
      "detailTitle": "Message Detail",
      "backToList": "Back to Inbox",
      "sender": "From",
      "email": "Email",
      "phone": "Phone",
      "service": "Service",
      "country": "Country",
      "message": "Message",
      "receivedAt": "Received",
      "updatedAt": "Last Updated",
      "markAsRead": "Mark as Read",
      "markAsReplied": "Mark as Replied",
      "archive": "Archive",
      "reopen": "Reopen",
      "deleteMessage": "Delete Message",
      "confirmDelete": "Are you sure you want to delete this message? This cannot be undone.",
      "toasts": {
        "statusUpdated": "Message status updated",
        "deleted": "Message deleted successfully",
        "statusError": "Failed to update message status",
        "deleteError": "Failed to delete message",
        "fetchError": "Failed to load messages",
        "notFound": "Message no longer exists"
      },
      "statusLabels": {
        "new": "New",
        "read": "Read",
        "replied": "Replied",
        "archived": "Archived"
      }
    }
  }
}
```

### Verification
- All admin UI text in messages inbox is pulled from translation files
- Both EN and AR locales have all keys
- Toast messages use translation keys
- Status labels display correctly in both languages

---

## Phase 7 — Playwright Setup (Auth + Infrastructure)

**Objective**: Set up Playwright testing infrastructure for contact messages.

### Files Affected

| File | Action |
|---|---|
| `playwright.config.ts` | **Create** — config with baseURL, auth setup, web server, chromium project |
| `tests/auth.setup.ts` | **Create** — authenticate as admin, save storage state |
| `tests/fixtures/index.ts` | **Create** — custom fixtures for authenticated page, admin API helpers |
| `tests/pages/AdminLoginPage.ts` | **Create** — POM for admin login |
| `tests/pages/AdminMessagesInboxPage.ts` | **Create** — POM for admin messages inbox |
| `.env.test.example` | **Create** — template for test env vars |
| `.gitignore` | **Modify** — add `playwright/.auth/`, `playwright-report/`, `test-results/` |

### Page Object Models

**AdminMessagesInboxPage**:
```typescript
export class AdminMessagesInboxPage {
  async goto() { await this.page.goto("/en/admin"); }
  async filterByStatus(status: "all" | "new" | "read" | "replied" | "archived") { ... }
  async openMessage(id: number) { ... }
  async updateMessageStatus(id: number, status: string) { ... }
  async deleteMessage(id: number) { ... }
  async goToPage(page: number) { ... }
  async getMessagesCount(): Promise<number> { ... }
  async getUnreadCount(): Promise<number> { ... }
}
```

### Verification
- `npx playwright install` succeeds
- `npx playwright test --project=chromium` runs the setup auth flow
- Auth state is saved and reused across tests

---

## Phase 8 — Playwright Contact Messages E2E Tests

**Objective**: Write comprehensive E2E tests for public form submission and admin inbox.

### Files Affected

| File | Action |
|---|---|
| `tests/contact-form.spec.ts` | **Create** — public form submission E2E tests |
| `tests/contact-messages-admin.spec.ts` | **Create** — admin inbox E2E tests |

### Public Form Test Scenarios

```typescript
test.describe("Contact Form — Public Submission", () => {
  test("submits a valid contact form successfully", async ({ page }) => {
    // Navigate to contact section
    // Fill required fields: name, email
    // Fill optional fields: phone, service, country, message
    // Submit
    // Assert POST /api/contact called with correct payload
    // Assert success message displayed
    // Assert form fields cleared
  });

  test("shows validation errors for missing required fields", async ({ page }) => {
    // Navigate to contact section
    // Submit empty form
    // Assert validation error for name
    // Assert validation error for email
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    // Fill name + invalid email ("not-an-email")
    // Submit
    // Assert email validation error displayed
  });

  test("submits form with only required fields", async ({ page }) => {
    // Fill only name and email
    // Submit
    // Assert POST called with optional fields omitted
    // Assert success message displayed
  });

  test("shows rate limit error after too many submissions", async ({ page }) => {
    // Mock POST to return 429
    // Submit form
    // Assert rate limit message displayed
    // Assert submit button disabled
  });

  test("disables submit button during submission", async ({ page }) => {
    // Mock POST with delayed response
    // Fill form and submit
    // Assert submit button disabled and loading text shown
    // Wait for response
    // Assert button re-enabled
  });

  test("clears form after successful submission", async ({ page }) => {
    // Fill all fields
    // Submit
    // Assert all form fields are empty after success
  });
});
```

### Admin Inbox Test Scenarios

```typescript
test.describe("Contact Messages — Admin Inbox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("displays messages list with pagination", async ({ adminPage }) => {
    // Mock GET /api/admin/contact-messages?page=1&limit=20
    // Assert list shows messages with status badges, sender, preview
    // Assert pagination controls visible
  });

  test("shows empty state when no messages", async ({ adminPage }) => {
    // Mock GET to return { data: [], meta: { total: 0, ... } }
    // Assert empty state message visible
  });

  test("filters messages by status", async ({ adminPage }) => {
    // Mock GET returning mix of statuses
    // Click "New" filter tab
    // Assert only new messages shown
    // Click "Archived" filter tab
    // Assert only archived messages shown
  });

  test("opens message detail view", async ({ adminPage }) => {
    // Mock GET returning 1 message
    // Click on message row
    // Assert detail view opens with all fields displayed
    // Assert PATCH /api/admin/contact-messages/:id/status called with "read"
  });

  test("updates message status from detail view", async ({ adminPage }) => {
    // Open message detail
    // Click "Mark as Replied"
    // Assert PATCH /api/admin/contact-messages/:id/status called with "replied"
    // Assert status badge updated
    // Assert success toast
  });

  test("deletes a message with confirmation", async ({ adminPage }) => {
    // Mock GET returning 2 messages
    // Click delete on first message
    // Assert confirmation dialog appears
    // Confirm deletion
    // Assert DELETE /api/admin/contact-messages/:id called
    // Assert message removed from list
    // Assert success toast
  });

  test("cancels delete of a message", async ({ adminPage }) => {
    // Click delete on a message
    // Cancel confirmation
    // Assert DELETE was NOT called
    // Assert message still visible
  });

  test("paginates through messages", async ({ adminPage }) => {
    // Mock GET page=1 returning 20 messages, meta.totalPages=3
    // Click "Next" or page 2
    // Assert GET /api/admin/contact-messages?page=2 called
    // Assert new page of messages displayed
  });

  test("shows loading state during fetch", async ({ adminPage, page }) => {
    // Intercept GET with delayed response
    // Assert loading skeleton visible
    // Wait for response
    // Assert list visible
  });

  test("shows error state on fetch failure", async ({ adminPage, page }) => {
    // Mock GET to return 500
    // Assert error message visible
    // Assert retry button visible
    // Click retry
    // Assert GET called again
  });

  test("handles 404 on deleted message detail", async ({ adminPage }) => {
    // Mock GET /:id to return 404
    // Assert "Message no longer exists" toast
    // Assert returned to list view
  });

  test("handles 401 redirect on expired session", async ({ adminPage, page }) => {
    // Mock auth check to return 401
    // Assert redirected to login page
  });

  test("displays relative timestamps", async ({ adminPage }) => {
    // Mock GET returning message with createdAt 2 hours ago
    // Assert relative time displayed ("2 hours ago")
  });

  test("email and phone are clickable links in detail view", async ({ adminPage }) => {
    // Open message detail
    // Assert email is a mailto: link
    // Assert phone is a tel: link
  });
});
```

### Testing Strategy
- **API Mocking**: Use `page.route("**/api/**"` to intercept all API calls
- **Auth setup**: Use `auth.setup.ts` to pre-authenticate for admin tests
- **Data isolation**: Each test mocks its own API responses
- **Locators**: Use `data-testid` attributes on key elements

### Verification
- `npx playwright test tests/contact-form.spec.ts tests/contact-messages-admin.spec.ts --project=chromium` passes
- All scenarios pass with mocked API

---

## Phase 9 — Validation & Error Handling Polish

**Objective**: Add proper validation, error boundaries, and user feedback for all contact message operations.

### Files Affected

| File | Action |
|---|---|
| `app/_components/website/_home/ContactSection.tsx` | Add client-side validation feedback polish. Ensure rate limit countdown timer. |
| `app/hooks/admin/useAdminContactMessages.ts` | Add proper error handling, retry logic, and toast messages |

### Public Form Validation Rules

| Field | Rules |
|---|---|
| `name` | Required, min 2 chars, max 200 chars |
| `email` | Required, valid email format, max 255 chars |
| `phone` | Optional, max 50 chars |
| `service` | Optional, max 200 chars |
| `country` | Optional, max 200 chars |
| `message` | Optional, max 5000 chars |

### Admin Inbox Error Handling

| Scenario | HTTP Status | Frontend Action |
|---|---|---|
| Message not found (detail/delete) | 404 | Show "Message no longer exists" toast, return to list |
| Invalid status value | 400 | Reject — must be one of: new, read, replied, archived |
| Rate limit (public form) | 429 | Show "Too many attempts, wait 60s" message |
| Validation error (public form) | 400 | Display field-level errors |
| Unauthorized | 401 | Redirect to login |
| Forbidden | 403 | Show "Access denied" |

### Verification
- Invalid inputs show field-level error messages
- Max lengths enforced with visual feedback
- Backend 400 errors surface as toast messages with field details
- Rate limit message shows with countdown or clear instruction

---

## Summary of All Files Touched

| # | File | Phase | Action |
|---|---|---|---|
| 1 | `app/types/website/admin.types.ts` | P1 | Add admin contact message types |
| 2 | `app/types/website/home.types.ts` | P1 | Verify public contact form types |
| 3 | `app/helpers/api/adminApi.ts` | P2 | Add contact messages API functions |
| 4 | `app/hooks/admin/useAdminContactMessages.ts` | P3 | **Create** — admin messages CRUD hook |
| 5 | `app/_components/website/_admin/AdminMessagesInbox.tsx` | P4 | **Create** — main admin inbox component |
| 6 | `app/_components/website/_admin/AdminMessageList.tsx` | P4 | **Create** — message list with filter |
| 7 | `app/_components/website/_admin/AdminMessageDetail.tsx` | P4 | **Create** — message detail view |
| 8 | `app/_components/website/_admin/AdminMessageRow.tsx` | P4 | **Create** — message row component |
| 9 | `app/_components/website/_admin/AdminStatusBadge.tsx` | P4 | **Modify** — add message status colors |
| 10 | `app/_components/website/_admin/AdminPagination.tsx` | P4 | **Create** — pagination controls |
| 11 | `app/_components/website/_home/ContactSection.tsx` | P5 | Auto-reset timer, translation fixes |
| 12 | `app/hooks/home/useContactForm.ts` | P5 | Minor polish |
| 13 | `translations/en.json` | P6 | Add messages keys |
| 14 | `translations/ar.json` | P6 | Add messages keys |
| 15 | `playwright.config.ts` | P7 | **Create** — playwright config |
| 16 | `tests/auth.setup.ts` | P7 | **Create** — admin auth setup |
| 17 | `tests/pages/AdminLoginPage.ts` | P7 | **Create** — login POM |
| 18 | `tests/pages/AdminMessagesInboxPage.ts` | P7 | **Create** — inbox POM |
| 19 | `tests/fixtures/index.ts` | P7 | **Create** — test fixtures |
| 20 | `tests/contact-form.spec.ts` | P8 | **Create** — public form E2E tests |
| 21 | `tests/contact-messages-admin.spec.ts` | P8 | **Create** — admin inbox E2E tests |
| 22 | `app/_components/website/_home/ContactSection.tsx` | P9 | Validation polish |
| 23 | `app/hooks/admin/useAdminContactMessages.ts` | P9 | Error handling polish |

---

## Blockers / Risks

1. **Backend endpoints must exist** — `GET /api/admin/contact-messages`, `GET /api/admin/contact-messages/:id`, `PATCH /api/admin/contact-messages/:id/status`, `DELETE /api/admin/contact-messages/:id`. **Must verify with backend team** before Phase 2.

2. **No admin page route for messages inbox** — The admin dashboard (`AdminPageClient.tsx`) needs a route/section to render `AdminMessagesInbox`. This may require updates to the admin page layout and navigation.

3. **No search/filter by text** — Backend only supports filtering by `status`. No full-text search, date range filter, or sender email/name search. If needed, request backend enhancement.

4. **No bulk operations** — No bulk delete or bulk status update endpoints. Each operation is per-message. Admin UI should reflect this (no multi-select).

5. **No export functionality** — No CSV/Excel export endpoint. If admin needs to export messages, this requires a backend addition.

6. **Rate limiting on public form** — `POST /api/contact` is throttled to 5 requests per 60 seconds per IP. Client-side debouncing should prevent accidental double-submission.

7. **Email notification is best-effort** — Admin email notification on form submission is fire-and-forget. Frontend should not depend on email success.

8. **Immutable submissions** — Contact message content (name, email, phone, service, country, message) cannot be edited after creation. Only `status` is mutable. Admin UI must not show edit fields for message content.

9. **`data-testid` additions** — existing components need `data-testid` attributes for Playwright locators.

10. **Auth setup for tests** — assumes login API works and test credentials are valid. Need `.env.test` with real credentials.

11. **Timezone display** — All timestamps are UTC. Frontend must convert to user's local timezone for display.

12. **Services/countries dropdowns in form** — Currently passed as SSR props. If these change frequently, consider fetching dynamically or adding a cache layer.

---

## Verification Commands

```bash
# After each phase:
pnpm lint

# Before Phase 7:
pnpm add -D @playwright/test
npx playwright install chromium --with-deps

# After Phase 8:
npx playwright test tests/contact-form.spec.ts tests/contact-messages-admin.spec.ts --project=chromium

# Full check:
pnpm build
```
