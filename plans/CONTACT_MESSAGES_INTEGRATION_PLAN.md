# Contact Messages Module — Frontend Integration Plan

## Overview

The Contact Messages module handles contact form submissions from the public-facing website and provides an admin dashboard for managing those messages. It is a **read-heavy, write-once** system:

- **Public side**: Visitors submit contact forms (POST). No auth required. Rate-limited.
- **Admin side**: Admins view, filter, paginate, update status, and delete messages. JWT + Admin role required.

Messages have a **lifecycle status**: `new` → `read` → `replied` → `archived`.

The module also sends an **email notification** to the admin when a new message is submitted (fire-and-forget, non-blocking).

---

## Data Model

### ContactMessage Entity (`contact_messages` table)

| Field | Type | Max Length | Required | Description |
|---|---|---|---|---|
| `id` | number | — | Auto | Auto-generated primary key |
| `name` | string | 200 | Yes | Sender's full name |
| `email` | string | 255 | Yes | Sender's email address (validated format) |
| `phone` | string | 50 | No | Sender's phone number |
| `service` | string | 200 | No | Service the inquiry is about |
| `country` | string | 200 | No | Country of interest |
| `message` | text | 5000 | No | The actual message content |
| `status` | enum | — | Yes | Lifecycle status (default: `new`) |
| `createdAt` | Date | — | Auto | Submission timestamp |
| `updatedAt` | Date | — | Auto | Last update timestamp |

### Status Enum: `ContactMessageStatus`

| Value | Description | Typical Use |
|---|---|---|
| `new` | Freshly submitted, not yet viewed | Initial state on creation |
| `read` | Admin has opened/viewed the message | Auto-set or manual when admin opens detail view |
| `replied` | Admin has responded to the sender | Set after admin sends a reply |
| `archived` | Message is closed/no longer active | Set when conversation is complete |

**Important**: The enum is stored in PostgreSQL as `contact_message_status`. Values are lowercase strings.

---

## API Endpoints

### Part A — Public Endpoints (No Auth)

#### 1. Submit Contact Form

```
POST /api/contact
```

**Auth**: None (public)

**Rate Limiting**: Max **5 requests per 60 seconds** per IP (via `@Throttle` decorator). Exceeding returns `429 Too Many Requests`.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "service": "Commercial Licensing",
  "country": "Saudi Arabia",
  "message": "I need help with setting up a commercial license for my business."
}
```

**Validation Rules**:
| Field | Rules | Notes |
|---|---|---|
| `name` | **Required**, string, max 200 chars | HTML stripped via `stripHtml()` |
| `email` | **Required**, valid email format, max 255 chars | HTML stripped via `stripHtml()` |
| `phone` | Optional, string, max 50 chars | HTML stripped |
| `service` | Optional, string, max 200 chars | HTML stripped |
| `country` | Optional, string, max 200 chars | HTML stripped |
| `message` | Optional, string, max 5000 chars | HTML stripped |

**Sanitization**: All fields pass through `stripHtml()` — any HTML tags are removed before storage. This prevents XSS attacks from form submissions.

**Response** (`201 Created`):
```json
{
  "id": 42,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "service": "Commercial Licensing",
  "country": "Saudi Arabia",
  "message": "I need help with setting up a commercial license for my business.",
  "status": "new",
  "createdAt": "2025-06-15T10:30:00.000Z"
}
```

**Side Effect**: An email notification is sent to the admin with the message details. This is **non-blocking** — if email fails, the submission still succeeds.

**Error Responses**:
| Status | Cause |
|---|---|
| `400` | Validation error (missing name/email, invalid email format, field too long) |
| `429` | Rate limit exceeded (more than 5 submissions in 60 seconds) |

---

### Part B — Admin Endpoints (Protected)

Base path: `/api/admin/contact-messages`

**Auth**: JWT + Admin role required on all endpoints.

#### 2. List Messages (Paginated + Filterable)

```
GET /api/admin/contact-messages?page=1&limit=20&status=new
```

**Query Params**:
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | 1 | Page number (1-indexed, min 1) |
| `limit` | number | No | 20 | Items per page (min 1) |
| `status` | `new` \| `read` \| `replied` \| `archived` | No | — | Filter by status |

**Response** (`200 OK`):
```json
{
  "data": [
    {
      "id": 42,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+966501234567",
      "service": "Commercial Licensing",
      "country": "Saudi Arabia",
      "message": "I need help with...",
      "status": "new",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "updatedAt": "2025-06-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Key behaviors**:
- Results ordered by `createdAt DESC` (newest first)
- If `status` filter is omitted, returns messages of **all** statuses
- Pagination metadata enables building page navigation UI
- Empty page returns `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`

**Example queries**:
```
GET /api/admin/contact-messages                     → All messages, page 1, 20 per page
GET /api/admin/contact-messages?page=2              → Page 2
GET /api/admin/contact-messages?limit=50            → 50 per page
GET /api/admin/contact-messages?status=new          → Only new messages
GET /api/admin/contact-messages?page=3&status=read  → Page 3 of read messages
```

---

#### 3. Get Single Message Detail

```
GET /api/admin/contact-messages/:id
```

**Path Params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `id` | number | Yes | Message ID |

**Response** (`200 OK`):
```json
{
  "id": 42,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "service": "Commercial Licensing",
  "country": "Saudi Arabia",
  "message": "I need help with setting up a commercial license for my business.",
  "status": "new",
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:00.000Z"
}
```

**Error**: `404` if message not found.

**Frontend tip**: When admin opens a message detail view, consider also calling the status update endpoint to mark it as `read`.

---

#### 4. Update Message Status

```
PATCH /api/admin/contact-messages/:id/status
```

**Path Params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `id` | number | Yes | Message ID |

**Request Body**:
```json
{
  "status": "read"
}
```

**Valid status values**: `new`, `read`, `replied`, `archived`

**Response** (`200 OK`): Returns the updated `ContactMessage` entity.

**Validation**:
- `status` field is **required** (not optional)
- Must be one of the four enum values
- Invalid enum value → `400 Bad Request`

**Error**: `404` if message not found.

**Common workflows**:
```
Open message detail    → PATCH :id/status { "status": "read" }
Send reply to sender   → PATCH :id/status { "status": "replied" }
Archive conversation   → PATCH :id/status { "status": "archived" }
Reopen archived        → PATCH :id/status { "status": "new" }
```

---

#### 5. Delete a Message

```
DELETE /api/admin/contact-messages/:id
```

**Path Params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `id` | number | Yes | Message ID |

**Response**: `200 OK` (empty body)

**Error**: `404` if message not found.

**Note**: Deletion is permanent. No soft-delete or trash mechanism exists.

---

## CRUD Summary

| Operation | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| **Create** (public) | `POST` | `/api/contact` | None | Submit contact form |
| **List** | `GET` | `/api/admin/contact-messages` | JWT + Admin | Paginated list with optional status filter |
| **Read One** | `GET` | `/api/admin/contact-messages/:id` | JWT + Admin | Single message detail |
| **Update Status** | `PATCH` | `/api/admin/contact-messages/:id/status` | JWT + Admin | Change message status |
| **Delete** | `DELETE` | `/api/admin/contact-messages/:id` | JWT + Admin | Permanently delete message |

**Note**: There is **no general update** endpoint (no `PUT /:id`). Only the `status` field can be updated. All other fields (name, email, phone, service, country, message) are immutable after creation.

---

## Frontend Integration Guide

### Public Contact Form

```typescript
// Submit contact form
async function submitContactForm(formData: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
}) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (response.status === 429) {
    // Rate limited — show "too many attempts, please wait" message
    return { error: 'RATE_LIMITED' };
  }

  if (!response.ok) {
    const errors = await response.json();
    return { error: 'VALIDATION', details: errors };
  }

  const result = await response.json();
  return { success: true, data: result };
}
```

**Form UX recommendations**:
- Disable submit button after first click to prevent double-submission
- Show loading state during submission
- On `429`, display: "Too many attempts. Please wait a minute before trying again."
- On `400`, display field-level validation errors
- On success, show confirmation message and clear the form

---

### Admin Dashboard — Messages Inbox

#### Messages List View

```typescript
// Fetch paginated messages
async function fetchMessages(params: {
  page?: number;
  limit?: number;
  status?: 'new' | 'read' | 'replied' | 'archived';
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);

  const response = await fetch(
    `/api/admin/contact-messages?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.json();
  // Returns: { data: [...], meta: { total, page, limit, totalPages } }
}
```

**UI recommendations**:
- Show status badges with colors:
  - `new` → blue/red (attention needed)
  - `read` → gray
  - `replied` → green
  - `archived` → muted gray
- Show unread count badge in sidebar/navigation
- Sort by newest first (backend does this automatically)
- Implement pagination controls using `meta.totalPages`
- Add status filter tabs/dropdown: All | New | Read | Replied | Archived

#### Message Detail View

```typescript
// Fetch single message
async function fetchMessage(id: number) {
  const response = await fetch(
    `/api/admin/contact-messages/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 404) {
    return { error: 'NOT_FOUND' };
  }

  return response.json();
}

// Mark as read when opening
async function markAsRead(id: number) {
  await fetch(
    `/api/admin/contact-messages/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'read' }),
    }
  );
}
```

**UI recommendations**:
- Auto-mark as `read` when admin opens the detail view
- Show all fields: name, email (as mailto: link), phone (as tel: link), service, country, message
- Display `createdAt` as relative time ("2 hours ago") and full timestamp on hover
- Provide status change buttons/dropdown: Mark as Read | Mark as Replied | Archive
- Show `mailto:` link for quick email reply to sender

#### Status Change

```typescript
async function updateStatus(id: number, status: 'new' | 'read' | 'replied' | 'archived') {
  const response = await fetch(
    `/api/admin/contact-messages/${id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  return response.json();
}
```

#### Delete Message

```typescript
async function deleteMessage(id: number) {
  const response = await fetch(
    `/api/admin/contact-messages/${id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (response.status === 404) {
    return { error: 'NOT_FOUND' };
  }

  return { success: true };
}
```

**UI recommendations**:
- Always show a confirmation dialog before deleting
- After deletion, remove from list or refresh current page
- Handle `404` gracefully (message may have been deleted by another admin)

---

## Email Notification

When a new contact message is submitted via `POST /api/contact`, the backend automatically sends an email notification to the admin.

**Behavior**:
- **Non-blocking**: Uses `.catch(() => {})` — email failure does **not** prevent the submission from succeeding
- **Template**: Uses `new-contact-message.ejs` template
- **Content**: Includes sender name, email, phone, service, country, and a preview of the message (first 80 chars)
- **Recipient**: Configured via mail service settings (check `mail.config.ts`)

**Frontend implication**: No action needed. The email is purely a backend-side notification.

---

## Error Handling

| Scenario | HTTP Status | Frontend Action |
|---|---|---|
| Content not yet seeded | 404 | N/A (not applicable to this module) |
| Invalid JWT / expired | 401 | Redirect to login |
| Insufficient permissions | 403 | Show "access denied" |
| Validation error (public form) | 400 | Display field-level errors |
| Rate limit exceeded (public form) | 429 | Show "too many attempts, wait 60s" |
| Message not found (admin) | 404 | Refresh list, show "message no longer exists" |
| Invalid status value | 400 | Reject — must be one of: `new`, `read`, `replied`, `archived` |

---

## Quick Reference: Field Mapping

### Public Submission → Stored Entity

| Form Field | Entity Field | Max Length | Required |
|---|---|---|---|
| `name` | `name` | 200 | Yes |
| `email` | `email` | 255 | Yes |
| `phone` | `phone` | 50 | No |
| `service` | `service` | 200 | No |
| `country` | `country` | 200 | No |
| `message` | `message` | 5000 | No |

### Admin Response Fields

| Field | Type | Description |
|---|---|---|
| `id` | number | Primary key |
| `name` | string | Sender name |
| `email` | string | Sender email |
| `phone` | string \| null | Sender phone |
| `service` | string \| null | Service inquiry |
| `country` | string \| null | Country inquiry |
| `message` | string \| null | Full message text |
| `status` | enum | `new` \| `read` \| `replied` \| `archived` |
| `createdAt` | Date | ISO 8601 timestamp |
| `updatedAt` | Date | ISO 8601 timestamp |

---

## Security & Validation Notes

1. **HTML Stripping**: All public form fields pass through `stripHtml()` — any HTML tags are removed. The frontend should not send HTML in any field.

2. **Rate Limiting**: The `POST /api/contact` endpoint is throttled to **5 requests per 60 seconds** per IP. The global default is 100 req/min, but this endpoint has a stricter override. Implement client-side debouncing to avoid hitting this limit.

3. **Email Validation**: The `email` field uses `@IsEmail()` from `class-validator` — it validates standard email format. Invalid formats are rejected at the API level.

4. **No General Update**: Only `status` can be updated after creation. This is intentional — contact submissions are immutable records. The admin cannot edit the sender's name, email, or message content.

5. **No Soft Delete**: `DELETE` is permanent. There is no trash/recycle bin. Implement a confirmation dialog on the frontend.

6. **No Bulk Operations**: There are no bulk delete or bulk status update endpoints. Each operation is per-message.

7. **Pagination Defaults**: Default page size is 20. For high-volume inboxes, consider allowing the admin to select 50 or 100 per page.

---

## Suggested Admin UI Workflow

```
┌─────────────────────────────────────────────────┐
│  Messages Inbox                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ Filter: [All ▼]  [🔍 Search]                ││
│  │                                             ││
│  │ ┌─────────────────────────────────────────┐ ││
│  │ │ 🔵 NEW    │ John Doe    │ 2 min ago     │ ││
│  │ │           │ john@...    │ Commercial    │ ││
│  │ └─────────────────────────────────────────┘ ││
│  │ ┌─────────────────────────────────────────┐ ││
│  │ │ 🟢 REPLIED│ Jane Smith  │ 1 hour ago    │ ││
│  │ │           │ jane@...    │ Professional  │ ││
│  │ └─────────────────────────────────────────┘ ││
│  │                                             ││
│  │  ←  1  2  3  4  5  6  7  8  →              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘

        ↓ Click message

┌─────────────────────────────────────────────────┐
│  Message Detail #42                              │
│  ┌─────────────────────────────────────────────┐│
│  │ From:    John Doe <john@example.com>        ││
│  │ Phone:   +966501234567                      ││
│  │ Service: Commercial Licensing               ││
│  │ Country: Saudi Arabia                       ││
│  │ Date:    June 15, 2025 at 10:30 AM          ││
│  │                                             ││
│  │ Message:                                    ││
│  │ I need help with setting up a commercial    ││
│  │ license for my business.                    ││
│  │                                             ││
│  │ [📧 Reply via Email]  [Status: read ▼]      ││
│  │                        [🗑️ Delete]          ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

---

## Notes

1. **Immutable submissions**: Once a contact message is created, its content (name, email, phone, service, country, message) cannot be edited. Only the `status` field is mutable.

2. **Auto-status on creation**: All new submissions start with `status: "new"`. The frontend should highlight these in the inbox.

3. **No search/filter by text**: The API only supports filtering by `status`. There is no full-text search, date range filter, or sender email/name search. If needed, request a backend enhancement.

4. **No export**: There is no CSV/Excel export endpoint. If the admin needs to export messages, this would require a backend addition.

5. **Email notification is best-effort**: The admin email notification is fire-and-forget. If the mail service is down, submissions still succeed but no notification is sent. Admins should periodically check the inbox regardless.

6. **Timezone**: All timestamps are stored and returned in UTC. The frontend should convert to the user's local timezone for display.
