# ADMIN_INTEGRATION_PLAN

> Akhashan Backend — Frontend Integration Plan for Admin Dashboard
> Last updated: 2026-05-15 (post-review fixes: atomic toggle, existence-check update, bulkReorder 400, 404 docs, contact-messages hardening)

---

## Table of Contents

1. [Base Configuration](#1-base-configuration)
2. [Authentication](#2-authentication)
3. [Home Page Content](#3-home-page-content)
4. [Stat Items](#4-stat-items)
5. [Licensing Items](#5-licensing-items)
6. [Process Steps](#6-process-steps)
7. [Services](#7-services)
8. [Countries](#8-countries)
9. [Contact Messages](#9-contact-messages)
10. [Users Management](#10-users-management)
11. [Error Handling](#11-error-handling)
12. [TypeScript Interfaces](#12-typescript-interfaces)

---

## 1. Base Configuration

### Server Details

| Property          | Value                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| **Base URL**      | `http://<host>:5000` (default port 5000)                                    |
| **Swagger Docs**  | `http://<host>:5000/docs`                                                   |
| **CORS**          | Enabled with `credentials: true` — origin must match `FRONTEND_URL` env var |
| **Global Prefix** | None — each controller defines its full path                                |

### Global Headers

| Header          | Required        | Notes                                         |
| --------------- | --------------- | --------------------------------------------- |
| `Content-Type`  | Always          | `application/json`                            |
| `Authorization` | Admin endpoints | `Bearer <JWT_TOKEN>`                          |
| Cookie          | Auth endpoints  | `auth_token` (httpOnly, secure, sameSite=lax) |

### Global Validation

- `whitelist: true` — unknown fields are stripped
- `forbidNonWhitelisted: true` — unknown fields cause 400
- `transform: true` — string values are auto-converted to numbers where `@Type(() => Number)` is used

---

## 2. Authentication

### 2.1 Login

| Method | URL           | Auth   |
| ------ | ------------- | ------ |
| `POST` | `/auth/login` | Public |

**Request Body:**

```json
{
  "email": "string (valid email)",
  "password": "string"
}
```

**Response (200):**

```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "avatar": "string | null",
    "role": "admin" | "user",
    "isEmailVerified": true
  },
  "access_token": "eyJhbGci..."
}
```

**Frontend Integration Notes:**

- Token is returned in the response body **AND** set as an httpOnly cookie (`auth_token`)
- For API calls, use the `access_token` from the response body in the `Authorization: Bearer <token>` header
- Cookie is httpOnly so it cannot be read client-side — it's used for browser-based requests
- Token expires in 5 days (maxAge: 5 _ 24 _ 60 _ 60 _ 1000)
- Rate limiting is commented out but may be enabled (5 attempts per 6 hours)

### 2.2 Get Current User Profile

| Method | URL                  | Auth         |
| ------ | -------------------- | ------------ |
| `GET`  | `/auth/current-user` | JWT Required |

**Response (200):** Same `user` object as login response.

**Frontend Integration Notes:**

- Call this on app init to restore session from stored token
- Returns 401 if token is invalid/expired/blacklisted

### 2.3 Logout

| Method | URL            | Auth         |
| ------ | -------------- | ------------ |
| `POST` | `/auth/logout` | JWT Required |

**Response (200):**

```json
{ "message": "User logged out successfully" }
```

**Frontend Integration Notes:**

- Blacklists the current token server-side
- Clears the `auth_token` cookie
- Frontend should also clear locally stored token after this call

### 2.4 Send Password Reset

| Method | URL                        | Auth   | Throttle     |
| ------ | -------------------------- | ------ | ------------ |
| `POST` | `/auth/rest-password/send` | Public | 3 per 15 min |

**Request Body:**

```json
{ "email": "string" }
```

**Response (201):**

```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

**Frontend Integration Notes:**

- Always returns the same message (prevents email enumeration)
- Sends reset email with token link if user exists

### 2.5 Verify Reset Token

| Method | URL                          | Auth   | Throttle     |
| ------ | ---------------------------- | ------ | ------------ |
| `POST` | `/auth/rest-password/verify` | Public | 5 per 15 min |

**Request Body:**

```json
{
  "token": "string",
  "email": "string (valid email)"
}
```

**Response (201):**

```json
{ "message": "This token is valid", "userId": 1 }
```

**Frontend Integration Notes:**

- Call this before showing the "new password" form to validate the token
- Returns 400 if token is invalid or expired (1-hour expiry)

### 2.6 Reset Password

| Method | URL                   | Auth   | Throttle     |
| ------ | --------------------- | ------ | ------------ |
| `POST` | `/auth/rest-password` | Public | 5 per 1 hour |

**Request Body:**

```json
{
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "token": "string"
}
```

**Response (201):**

```json
{ "message": "password changed successfully" }
```

### 2.7 Verify Email

| Method | URL                  | Auth   | Throttle      |
| ------ | -------------------- | ------ | ------------- |
| `POST` | `/auth/verify-email` | Public | 5 per 6 hours |

**Query Params:** `?token=<verification_token>`

**Response (201):**

```json
{ "message": "Email verified successfully" }
```

### 2.8 Google OAuth

| Method | URL                     | Auth                           |
| ------ | ----------------------- | ------------------------------ |
| `GET`  | `/auth/google`          | Public (redirects to Google)   |
| `GET`  | `/auth/google/callback` | Public (redirects to frontend) |

**Frontend Integration Notes:**

- Redirect user to `/auth/google` to start OAuth flow
- After callback, user is redirected to `${FRONTEND_URL}?refresh=1`
- Token is set as httpOnly cookie during callback

### 2.9 Register (Create User)

| Method | URL     | Auth   |
| ------ | ------- | ------ |
| `POST` | `/user` | Public |

**Request Body:**

```json
{
  "email": "string (valid email)",
  "password": "string",
  "name": "string (optional)",
  "avatar": "string (optional)",
  "role": "admin" | "user" (optional, defaults to user)"
}
```

**Response (201):** Full `User` object.

**Frontend Integration Notes:**

- After registration, user must verify email before logging in
- Verification email is sent automatically

---

## 3. Home Page Content

**Base Path:** `/api/admin/home-page-content`
**Auth:** JWT + Admin role required

### 3.1 Get Home Page Content (Admin View)

| Method | URL                            |
| ------ | ------------------------------ |
| `GET`  | `/api/admin/home-page-content` |

**Response (200):** Raw `HomePageContent` entity with nested arrays:

```json
{
  "id": 1,
  "hero_background_image_en": "/Hero-image.webp",
  "hero_background_image_ar": "/Hero-image.webp",
  "hero_badge_en": "Trusted & Certified",
  "hero_badge_ar": "موثوق ومعتمد",
  "hero_heading_en": "Your Trusted Partner for Business Setup",
  "hero_heading_ar": "شريكك الموثوق لتأسيس الأعمال",
  "hero_highlight_text_en": "highlighted",
  "hero_highlight_text_ar": "مميز",
  "hero_description_en": "Description text...",
  "hero_description_ar": "نص الوصف...",
  "hero_license_en": "Licensed text",
  "hero_license_ar": "نص مرخص",
  "hero_cta_primary_en": "Contact Us",
  "hero_cta_primary_ar": "اتصل بنا",
  "hero_whatsapp_number": "966XXXXXXXXX",
  "hero_cta_whatsapp_en": "WhatsApp",
  "hero_cta_whatsapp_ar": "واتساب",
  "stats_label_en": "Our Numbers",
  "stats_label_ar": "أرقامنا",
  "stats_heading_en": "Trusted by Thousands",
  "stats_heading_ar": "موثوق من الآلاف",
  "stats_description_en": "We deliver excellence...",
  "stats_description_ar": "نقدم التميز...",
  "licensing_label_en": "Licensing",
  "licensing_label_ar": "الترخيص",
  "licensing_heading_en": "Licensing Services",
  "licensing_heading_ar": "خدمات الترخيص",
  "licensing_description_en": "Complete licensing support",
  "licensing_description_ar": "دعم ترخيص شامل",
  "process_label_en": "Process",
  "process_label_ar": "العملية",
  "process_heading_en": "How It Works",
  "process_heading_ar": "كيف يعمل",
  "process_description_en": "Simple steps to get started",
  "process_description_ar": "خطوات بسيطة للبدء",
  "services_header_label_en": "Services",
  "services_header_label_ar": "الخدمات",
  "services_header_heading_en": "Our Services",
  "services_header_heading_ar": "خدماتنا",
  "services_header_description_en": "Explore what we offer",
  "services_header_description_ar": "استكشف ما نقدمه",
  "countries_header_label_en": "Countries",
  "countries_header_label_ar": "الدول",
  "countries_header_heading_en": "Destinations",
  "countries_header_heading_ar": "الوجهات",
  "countries_header_description_en": "Countries we serve",
  "countries_header_description_ar": "الدول التي نخدمها",
  "statItems": [
    /* StatItem[] */
  ],
  "licensingItems": [
    /* LicensingItem[] */
  ],
  "processSteps": [
    /* ProcessStep[] */
  ],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

**Frontend Integration Notes:**

- Returns 404 if no content exists — call seed endpoint first
- Child items (`statItems`, `licensingItems`, `processSteps`) are included in the response
- All text fields are bilingual (`_en` / `_ar` suffixes)
- Hero heading/description fields may contain sanitized HTML (`<span>`, `<strong>`, `<em>`)

### 3.2 Update Home Page Content

| Method | URL                            |
| ------ | ------------------------------ |
| `PUT`  | `/api/admin/home-page-content` |

**Request Body:** Partial object — only send fields you want to update. All fields are optional.

```json
{
  "hero_badge_en": "New Badge",
  "hero_badge_ar": "شارة جديدة",
  "hero_heading_en": "New Heading",
  "hero_highlight_text_en": "Business Setup",
  "hero_highlight_text_ar": "تأسيس الأعمال"
}
```

**Response (200):** Full updated `HomePageContent` entity (same shape as GET).

**Frontend Integration Notes:**

- This is a partial update — send only changed fields
- Uses atomic upsert (idempotent) — safe for concurrent requests
- HTML in hero fields is sanitized server-side (allowed: `<span>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<p>`, `<a>`)
- Max lengths vary per field (see DTO)
- String fields: max 100–3000 chars depending on field
- `hero_whatsapp_number` must match format: `+?[0-9\s-]{6,20}` (e.g., `+966500000000`, `966-50-000-0000`)

### 3.3 Seed Home Page Content

| Method | URL                                 |
| ------ | ----------------------------------- |
| `POST` | `/api/admin/home-page-content/seed` |

**Response (201):** `HomePageContent` entity with default bilingual data.

**Frontend Integration Notes:**

- Idempotent — safe to call multiple times
- Only creates data if no row exists
- Use this if GET returns 404

---

## 4. Stat Items

**Base Path:** `/api/admin/stat-items`
**Auth:** JWT + Admin role required

### 4.1 List All Stat Items

| Method | URL                     |
| ------ | ----------------------- |
| `GET`  | `/api/admin/stat-items` |

**Response (200):** Array of `StatItem` objects ordered by `sort_order`:

```json
[
  {
    "id": 1,
    "icon": "string | null",
    "target": 10000,
    "suffix": "+",
    "label_en": "Happy Clients",
    "label_ar": "عملاء سعداء",
    "sort_order": 0,
    "homePageContentId": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### 4.2 Create Stat Item

| Method | URL                     |
| ------ | ----------------------- |
| `POST` | `/api/admin/stat-items` |

**Request Body:**

```json
{
  "icon": "string (optional, max 100)",
  "target": 10000,
  "suffix": "+",
  "label_en": "Happy Clients",
  "label_ar": "عملاء سعداء",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Response (201):** Created `StatItem`.

### 4.3 Update Stat Item

| Method | URL                         |
| ------ | --------------------------- |
| `PUT`  | `/api/admin/stat-items/:id` |

**Request Body:** Partial `UpdateStatItemDto` (all fields optional).

**Response (200):** Updated `StatItem`.

### 4.4 Delete Stat Item

| Method   | URL                         |
| -------- | --------------------------- |
| `DELETE` | `/api/admin/stat-items/:id` |

**Response (200):** Empty or confirmation message.

### 4.5 Reorder Single Stat Item

| Method  | URL                                 |
| ------- | ----------------------------------- |
| `PATCH` | `/api/admin/stat-items/:id/reorder` |

**Request Body:**

```json
{ "sort_order": 5 }
```

**Response (200):** Updated `StatItem`.

### 4.6 Bulk Reorder Stat Items

| Method  | URL                             |
| ------- | ------------------------------- |
| `PATCH` | `/api/admin/stat-items/reorder` |

**Request Body:**

```json
{ "ids": [3, 1, 2, 4] }
```

**Response (200):** All `StatItem[]` in new order.

**Frontend Integration Notes:**

- `ids` array position determines `sort_order` (1-indexed)
- If `ids` is empty/missing, returns current list without changes

---

## 5. Licensing Items

**Base Path:** `/api/admin/licensing-items`
**Auth:** JWT + Admin role required

### 5.1 List All Licensing Items

| Method | URL                          |
| ------ | ---------------------------- |
| `GET`  | `/api/admin/licensing-items` |

**Response (200):** Array of `LicensingItem` objects ordered by `sort_order`:

```json
[
  {
    "id": 1,
    "icon": "string | null",
    "title_en": "Commercial License",
    "title_ar": "ترخيص تجاري",
    "desc_en": "Full commercial licensing support",
    "desc_ar": "دعم ترخيص تجاري كامل",
    "tag_en": "Popular",
    "tag_ar": "شائع",
    "sort_order": 0,
    "homePageContentId": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### 5.2 Create Licensing Item

| Method | URL                          |
| ------ | ---------------------------- |
| `POST` | `/api/admin/licensing-items` |

**Request Body:**

```json
{
  "icon": "string (optional)",
  "title_en": "Commercial License",
  "title_ar": "ترخيص تجاري",
  "desc_en": "Description...",
  "desc_ar": "الوصف...",
  "tag_en": "Popular",
  "tag_ar": "شائع",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Response (201):** Created `LicensingItem`.

### 5.3 Update Licensing Item

| Method | URL                              |
| ------ | -------------------------------- |
| `PUT`  | `/api/admin/licensing-items/:id` |

**Request Body:** Partial `UpdateLicensingItemDto`.

**Response (200):** Updated `LicensingItem`.

### 5.4 Delete Licensing Item

| Method   | URL                              |
| -------- | -------------------------------- |
| `DELETE` | `/api/admin/licensing-items/:id` |

### 5.5 Reorder Single Licensing Item

| Method  | URL                                      |
| ------- | ---------------------------------------- |
| `PATCH` | `/api/admin/licensing-items/:id/reorder` |

**Request Body:** `{ "sort_order": 5 }`

### 5.6 Bulk Reorder Licensing Items

| Method  | URL                                  |
| ------- | ------------------------------------ |
| `PATCH` | `/api/admin/licensing-items/reorder` |

**Request Body:** `{ "ids": [3, 1, 2] }`

---

## 6. Process Steps

**Base Path:** `/api/admin/process-steps`
**Auth:** JWT + Admin role required

### 6.1 List All Process Steps

| Method | URL                        |
| ------ | -------------------------- |
| `GET`  | `/api/admin/process-steps` |

**Response (200):** Array of `ProcessStep` objects ordered by `sort_order`:

```json
[
  {
    "id": 1,
    "step_number": 1,
    "title_en": "Consultation",
    "title_ar": "استشارة",
    "desc_en": "Initial consultation phase",
    "desc_ar": "مرحلة الاستشارة الأولية",
    "sort_order": 0,
    "homePageContentId": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### 6.2 Create Process Step

| Method | URL                        |
| ------ | -------------------------- |
| `POST` | `/api/admin/process-steps` |

**Request Body:**

```json
{
  "step_number": 1,
  "title_en": "Consultation",
  "title_ar": "استشارة",
  "desc_en": "Initial consultation phase",
  "desc_ar": "مرحلة الاستشارة الأولية",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Response (201):** Created `ProcessStep`.

**Frontend Integration Notes:**

- `step_number` is **required** (min: 1)
- All other fields are optional

### 6.3 Update Process Step

| Method | URL                            |
| ------ | ------------------------------ |
| `PUT`  | `/api/admin/process-steps/:id` |

**Request Body:** Partial `UpdateProcessStepDto`.

### 6.4 Delete Process Step

| Method   | URL                            |
| -------- | ------------------------------ |
| `DELETE` | `/api/admin/process-steps/:id` |

### 6.5 Reorder Single Process Step

| Method  | URL                                    |
| ------- | -------------------------------------- |
| `PATCH` | `/api/admin/process-steps/:id/reorder` |

**Request Body:** `{ "sort_order": 5 }`

### 6.6 Bulk Reorder Process Steps

| Method  | URL                                |
| ------- | ---------------------------------- |
| `PATCH` | `/api/admin/process-steps/reorder` |

**Request Body:** `{ "ids": [3, 1, 2] }`

---

## 7. Services

**Base Path:** `/api/admin/services`
**Auth:** JWT + Admin role required

### 7.1 List Services (Paginated)

| Method | URL                                   |
| ------ | ------------------------------------- |
| `GET`  | `/api/admin/services?page=1&limit=20` |

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "icon": "string | null",
      "title_en": "Company Formation",
      "title_ar": "تأسيس الشركات",
      "desc_en": "Full company formation services...",
      "desc_ar": "خدمات تأسيس الشركات الكاملة...",
      "button_label_en": "Learn More",
      "button_label_ar": "اعرف المزيد",
      "metric_value": "500+",
      "metric_suffix": "Companies",
      "metric_label_en": "Formed",
      "metric_label_ar": "تم تأسيسها",
      "is_active": true,
      "sort_order": 0,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 7.2 Create Service

| Method | URL                   |
| ------ | --------------------- |
| `POST` | `/api/admin/services` |

**Request Body:**

```json
{
  "icon": "string (optional, max 100)",
  "title_en": "Company Formation",
  "title_ar": "تأسيس الشركات",
  "desc_en": "Description...",
  "desc_ar": "الوصف...",
  "button_label_en": "Learn More",
  "button_label_ar": "اعرف المزيد",
  "metric_value": "500+",
  "metric_suffix": "Companies",
  "metric_label_en": "Formed",
  "metric_label_ar": "تم تأسيسها",
  "is_active": true,
  "sort_order": 0
}
```

**Response (201):** Created `Service`.

### 7.3 Update Service

| Method | URL                       |
| ------ | ------------------------- |
| `PUT`  | `/api/admin/services/:id` |

**Request Body:** Partial `UpdateServiceDto`.

### 7.4 Delete Service

| Method   | URL                       |
| -------- | ------------------------- |
| `DELETE` | `/api/admin/services/:id` |

### 7.5 Toggle Service Active Status

| Method  | URL                              |
| ------- | -------------------------------- |
| `PATCH` | `/api/admin/services/:id/toggle` |

**Response (200):** Updated `Service` with flipped `is_active`.

**Frontend Integration Notes:**

- No request body needed
- Toggles between `true` and `false` using an atomic SQL operation (safe against race conditions)
- Returns 404 if service does not exist

### 7.6 Reorder Single Service

| Method  | URL                               |
| ------- | --------------------------------- |
| `PATCH` | `/api/admin/services/:id/reorder` |

**Request Body:** `{ "sort_order": 5 }`

### 7.7 Bulk Reorder Services

| Method  | URL                           |
| ------- | ----------------------------- |
| `PATCH` | `/api/admin/services/reorder` |

**Request Body:** `{ "ids": [3, 1, 2] }`

**Frontend Integration Notes:**

- `ids` array position determines `sort_order` (1-indexed)
- **Returns `400 Bad Request`** if `ids` is empty or missing — always send a non-empty array
- Updates are executed in parallel within a database transaction for atomicity

---

## 8. Countries

**Base Path:** `/api/admin/countries`
**Auth:** JWT + Admin role required

### 8.1 List Countries (Paginated)

| Method | URL                                    |
| ------ | -------------------------------------- |
| `GET`  | `/api/admin/countries?page=1&limit=20` |

**Query Params:** Same pagination as Services.

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "flag_emoji": "🇸🇦",
      "name_en": "Saudi Arabia",
      "name_ar": "المملكة العربية السعودية",
      "specialty": "Company Formation",
      "region": "asia" | "africa",
      "workers_label": "Skilled Workers",
      "is_active": true,
      "sort_order": 0,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 8.2 Create Country

| Method | URL                    |
| ------ | ---------------------- |
| `POST` | `/api/admin/countries` |

**Request Body:**

```json
{
  "flag_emoji": "🇸🇦",
  "name_en": "Saudi Arabia",
  "name_ar": "المملكة العربية السعودية",
  "specialty": "Company Formation",
  "region": "asia",
  "workers_label": "Skilled Workers",
  "is_active": true,
  "sort_order": 0
}
```

**Response (201):** Created `Country`.

### 8.3 Update Country

| Method | URL                        |
| ------ | -------------------------- |
| `PUT`  | `/api/admin/countries/:id` |

**Request Body:** Partial `UpdateCountryDto`.

### 8.4 Delete Country

| Method   | URL                        |
| -------- | -------------------------- |
| `DELETE` | `/api/admin/countries/:id` |

### 8.5 Toggle Country Active Status

| Method  | URL                               |
| ------- | --------------------------------- |
| `PATCH` | `/api/admin/countries/:id/toggle` |

### 8.6 Reorder Single Country

| Method  | URL                                |
| ------- | ---------------------------------- |
| `PATCH` | `/api/admin/countries/:id/reorder` |

**Request Body:** `{ "sort_order": 5 }`

### 8.7 Bulk Reorder Countries

| Method  | URL                            |
| ------- | ------------------------------ |
| `PATCH` | `/api/admin/countries/reorder` |

**Request Body:** `{ "ids": [3, 1, 2] }`

---

## 9. Contact Messages

**Base Path:** `/api/admin/contact-messages`
**Auth:** JWT + Admin role required

### 9.1 List Contact Messages (Paginated)

| Method | URL                                                      |
| ------ | -------------------------------------------------------- |
| `GET`  | `/api/admin/contact-messages?page=1&limit=20&status=new` |

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | enum | none | Filter by status: `new`, `read`, `replied`, `archived`. Invalid values return `400`. |

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+966500000000",
      "service": "Company Formation",
      "country": "Saudi Arabia",
      "message": "I need help with...",
      "status": "new",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 9.2 Get Single Contact Message

| Method | URL                               |
| ------ | --------------------------------- |
| `GET`  | `/api/admin/contact-messages/:id` |

**Response (200):** Single `ContactMessage` object.

### 9.3 Update Contact Message Status

| Method  | URL                                      |
| ------- | ---------------------------------------- |
| `PATCH` | `/api/admin/contact-messages/:id/status` |

**Request Body:**

```json
{ "status": "read" }
```

**Valid status values:** `new` | `read` | `replied` | `archived`

**Response (200):** Updated `ContactMessage`.

**Frontend Integration Notes:**

- Returns `404` if the contact message does not exist
- Returns `400` if status value is not a valid enum member

### 9.4 Delete Contact Message

| Method   | URL                               |
| -------- | --------------------------------- |
| `DELETE` | `/api/admin/contact-messages/:id` |

**Response (200):** Empty body.

**Frontend Integration Notes:**

- Returns `404` if the contact message does not exist

---

### 9.5 Public Contact Form Submission (Unauthenticated)

| Method | URL            | Throttle         |
| ------ | -------------- | ---------------- |
| `POST` | `/api/contact` | 5 per 60 seconds |

**Request Body:**

```json
{
  "name": "string (required, max 200)",
  "email": "string (required, valid email, max 255)",
  "phone": "string (optional, max 50)",
  "service": "string (optional, max 200)",
  "country": "string (optional, max 200)",
  "message": "string (optional, max 5000)"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966500000000",
  "service": "Company Formation",
  "country": "Saudi Arabia",
  "message": "I need help with...",
  "status": "new",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Frontend Integration Notes:**

- No authentication required — this is the public-facing contact form
- All text fields are sanitized server-side — HTML tags are stripped to prevent stored XSS
- Rate limited to 5 submissions per 60 seconds per IP
- Unknown fields in the request body are rejected (`forbidNonWhitelisted: true`)
- Status is automatically set to `new` — cannot be set by the client

---

## 10. Users Management

**Base Path:** `/user`
**Auth:** JWT + Admin role required (for admin endpoints)

### 10.1 List All Users (Admin)

| Method | URL     | Auth        |
| ------ | ------- | ----------- |
| `GET`  | `/user` | JWT + Admin |

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `role` | enum | none | Filter by role: `admin`, `user` |
| `search` | string | none | Search by name/email |
| `status` | enum | none | Filter by status |

**Response (200):** Array of `User` objects (excludes password).

### 10.2 Get User Stats (Admin)

| Method | URL           | Auth        |
| ------ | ------------- | ----------- |
| `GET`  | `/user/stats` | JWT + Admin |

**Response (200):** User statistics object.

### 10.3 Get User by ID

| Method | URL         | Auth                                       |
| ------ | ----------- | ------------------------------------------ |
| `GET`  | `/user/:id` | None (public, but sensitive data excluded) |

**Response (200):** Single `User` object.

### 10.4 Update User

| Method  | URL         | Auth                                  |
| ------- | ----------- | ------------------------------------- |
| `PATCH` | `/user/:id` | None (public — consider adding guard) |

**Request Body:** Partial `UpdateUserDto`.

### 10.5 Delete User

| Method   | URL         | Auth                                  |
| -------- | ----------- | ------------------------------------- |
| `DELETE` | `/user/:id` | None (public — consider adding guard) |

### 10.6 Register User (Public)

| Method | URL     | Auth   |
| ------ | ------- | ------ |
| `POST` | `/user` | Public |

See [2.9 Register](#29-register-create-user) above.

---

## 11. Error Handling

### Standard Error Response Shape

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password should not be empty"],
  "error": "Bad Request"
}
```

### HTTP Status Codes

| Code  | Meaning               | When                                                                    |
| ----- | --------------------- | ----------------------------------------------------------------------- |
| `200` | OK                    | Successful GET, PUT, PATCH, DELETE                                      |
| `201` | Created               | Successful POST                                                         |
| `400` | Bad Request           | Validation errors, invalid input, empty `ids` array on bulk reorder     |
| `401` | Unauthorized          | Missing/invalid JWT token                                               |
| `403` | Forbidden             | Valid token but insufficient role                                       |
| `404` | Not Found             | Resource not found (update, delete, toggle, reorder on non-existent ID) |
| `429` | Too Many Requests     | Rate limit exceeded                                                     |
| `500` | Internal Server Error | Server error                                                            |

### Token Blacklist

- When a user logs out, their token is added to a blacklist
- Blacklisted tokens return 401 on subsequent requests
- Token expiry is handled by JWT expiration (5 days)

---

## 12. TypeScript Interfaces

```typescript
// ── Auth ──────────────────────────────────────────────────────
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  access_token: string;
}

interface User {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  role: "admin" | "user";
  status: string;
  isEmailVerified: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Pagination ────────────────────────────────────────────────
interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Home Page Content ─────────────────────────────────────────
interface HomePageContent {
  id: number;
  hero_background_image_en?: string;
  hero_background_image_ar?: string;
  hero_badge_en?: string;
  hero_badge_ar?: string;
  hero_heading_en?: string;
  hero_heading_ar?: string;
  hero_highlight_text_en?: string;
  hero_highlight_text_ar?: string;
  hero_description_en?: string;
  hero_description_ar?: string;
  hero_license_en?: string;
  hero_license_ar?: string;
  hero_cta_primary_en?: string;
  hero_cta_primary_ar?: string;
  hero_whatsapp_number?: string; // Format: +?[0-9\s-]{6,20}
  hero_cta_whatsapp_en?: string;
  hero_cta_whatsapp_ar?: string;
  stats_label_en?: string;
  stats_label_ar?: string;
  stats_heading_en?: string;
  stats_heading_ar?: string;
  stats_description_en?: string;
  stats_description_ar?: string;
  licensing_label_en?: string;
  licensing_label_ar?: string;
  licensing_heading_en?: string;
  licensing_heading_ar?: string;
  licensing_description_en?: string;
  licensing_description_ar?: string;
  process_label_en?: string;
  process_label_ar?: string;
  process_heading_en?: string;
  process_heading_ar?: string;
  process_description_en?: string;
  process_description_ar?: string;
  services_header_label_en?: string;
  services_header_label_ar?: string;
  services_header_heading_en?: string;
  services_header_heading_ar?: string;
  services_header_description_en?: string;
  services_header_description_ar?: string;
  countries_header_label_en?: string;
  countries_header_label_ar?: string;
  countries_header_heading_en?: string;
  countries_header_heading_ar?: string;
  countries_header_description_en?: string;
  countries_header_description_ar?: string;
  statItems: StatItem[];
  licensingItems: LicensingItem[];
  processSteps: ProcessStep[];
  createdAt: string;
  updatedAt: string;
}

// ── Stat Item ─────────────────────────────────────────────────
interface StatItem {
  id: number;
  icon?: string;
  target?: number;
  suffix?: string;
  label_en?: string;
  label_ar?: string;
  sort_order: number;
  homePageContentId?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Licensing Item ────────────────────────────────────────────
interface LicensingItem {
  id: number;
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  tag_en?: string;
  tag_ar?: string;
  sort_order: number;
  homePageContentId?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Process Step ──────────────────────────────────────────────
interface ProcessStep {
  id: number;
  step_number: number;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  sort_order: number;
  homePageContentId?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Service ───────────────────────────────────────────────────
interface Service {
  id: number;
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
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// ── Country ───────────────────────────────────────────────────
interface Country {
  id: number;
  flag_emoji?: string;
  name_en?: string;
  name_ar?: string;
  specialty?: string;
  region: "asia" | "africa";
  workers_label?: string;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// ── Contact Message ───────────────────────────────────────────
type ContactMessageStatus = "new" | "read" | "replied" | "archived";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Reorder ───────────────────────────────────────────────────
interface ReorderRequest {
  sort_order?: number;
}

interface BulkReorderRequest {
  ids: number[]; // Must be non-empty — returns 400 if empty or missing
}

// ── Status Update ─────────────────────────────────────────────
interface StatusUpdateRequest {
  status: ContactMessageStatus;
}
```

---

## Quick Reference: All Admin Endpoints

| Method                        | Endpoint                                 | Description                     |
| ----------------------------- | ---------------------------------------- | ------------------------------- |
| **Auth**                      |                                          |                                 |
| POST                          | `/auth/login`                            | Login                           |
| POST                          | `/auth/logout`                           | Logout                          |
| GET                           | `/auth/current-user`                     | Get current user                |
| POST                          | `/auth/rest-password/send`               | Send password reset             |
| POST                          | `/auth/rest-password/verify`             | Verify reset token              |
| POST                          | `/auth/rest-password`                    | Reset password                  |
| POST                          | `/auth/verify-email`                     | Verify email                    |
| POST                          | `/user`                                  | Register user                   |
| **Users**                     |                                          |                                 |
| GET                           | `/user`                                  | List users (admin)              |
| GET                           | `/user/stats`                            | User stats (admin)              |
| GET                           | `/user/:id`                              | Get user by ID                  |
| PATCH                         | `/user/:id`                              | Update user                     |
| DELETE                        | `/user/:id`                              | Delete user                     |
| **Home Page Content**         |                                          |                                 |
| GET                           | `/api/admin/home-page-content`           | Get content                     |
| PUT                           | `/api/admin/home-page-content`           | Update content                  |
| POST                          | `/api/admin/home-page-content/seed`      | Seed content                    |
| **Stat Items**                |                                          |                                 |
| GET                           | `/api/admin/stat-items`                  | List all                        |
| POST                          | `/api/admin/stat-items`                  | Create                          |
| PUT                           | `/api/admin/stat-items/:id`              | Update                          |
| DELETE                        | `/api/admin/stat-items/:id`              | Delete                          |
| PATCH                         | `/api/admin/stat-items/:id/reorder`      | Reorder                         |
| PATCH                         | `/api/admin/stat-items/reorder`          | Bulk reorder                    |
| **Licensing Items**           |                                          |                                 |
| GET                           | `/api/admin/licensing-items`             | List all                        |
| POST                          | `/api/admin/licensing-items`             | Create                          |
| PUT                           | `/api/admin/licensing-items/:id`         | Update                          |
| DELETE                        | `/api/admin/licensing-items/:id`         | Delete                          |
| PATCH                         | `/api/admin/licensing-items/:id/reorder` | Reorder                         |
| PATCH                         | `/api/admin/licensing-items/reorder`     | Bulk reorder                    |
| **Process Steps**             |                                          |                                 |
| GET                           | `/api/admin/process-steps`               | List all                        |
| POST                          | `/api/admin/process-steps`               | Create                          |
| PUT                           | `/api/admin/process-steps/:id`           | Update                          |
| DELETE                        | `/api/admin/process-steps/:id`           | Delete                          |
| PATCH                         | `/api/admin/process-steps/:id/reorder`   | Reorder                         |
| PATCH                         | `/api/admin/process-steps/reorder`       | Bulk reorder                    |
| **Services**                  |                                          |                                 |
| GET                           | `/api/admin/services`                    | List (paginated)                |
| POST                          | `/api/admin/services`                    | Create                          |
| PUT                           | `/api/admin/services/:id`                | Update                          |
| DELETE                        | `/api/admin/services/:id`                | Delete                          |
| PATCH                         | `/api/admin/services/:id/toggle`         | Toggle active                   |
| PATCH                         | `/api/admin/services/:id/reorder`        | Reorder                         |
| PATCH                         | `/api/admin/services/reorder`            | Bulk reorder                    |
| **Countries**                 |                                          |                                 |
| GET                           | `/api/admin/countries`                   | List (paginated)                |
| POST                          | `/api/admin/countries`                   | Create                          |
| PUT                           | `/api/admin/countries/:id`               | Update                          |
| DELETE                        | `/api/admin/countries/:id`               | Delete                          |
| PATCH                         | `/api/admin/countries/:id/toggle`        | Toggle active                   |
| PATCH                         | `/api/admin/countries/:id/reorder`       | Reorder                         |
| PATCH                         | `/api/admin/countries/reorder`           | Bulk reorder                    |
| **Contact Messages**          |                                          |                                 |
| GET                           | `/api/admin/contact-messages`            | List (paginated, filterable)    |
| GET                           | `/api/admin/contact-messages/:id`        | Get single                      |
| PATCH                         | `/api/admin/contact-messages/:id/status` | Update status                   |
| DELETE                        | `/api/admin/contact-messages/:id`        | Delete                          |
| **Contact Messages (Public)** |                                          |                                 |
| POST                          | `/api/contact`                           | Submit contact form (throttled) |
