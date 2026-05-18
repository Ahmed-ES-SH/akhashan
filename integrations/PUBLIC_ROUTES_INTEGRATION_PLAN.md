# Public Routes Integration Plan

> **For**: Frontend Developer
> **Base URL**: `https://<your-api-domain>` (dev: `http://localhost:5000`)
> **Auth**: None — all routes below are **unauthenticated**
> **Content-Type**: `application/json`
> **CORS**: Configured for `FRONTEND_URL` env var (dev default: `http://localhost:3000`)

---

## Implementation Progress

| Phase | Title | Status |
|-------|-------|--------|
| **Phase 1** | Contract / Types / Data Shape Alignment | ✅ **DONE** |
| **Phase 2** | Data Layer Integration (Server-Side Fetching) | ✅ **DONE** |
| **Phase 3** | Contact Form Submission & Error Handling | ✅ **DONE** |
| **Phase 4** | Error Boundaries & Loading States | ✅ **DONE** |
| **Phase 5** | Cleanup & Refactor | ✅ **DONE** |

---

## Table of Contents

1. [Overview](#overview)
2. [Locale Filtering](#locale-filtering)
3. [Endpoint 1 — Home Page Content](#endpoint-1--home-page-content)
4. [Endpoint 2 — Active Services](#endpoint-2--active-services)
5. [Endpoint 3 — Active Countries](#endpoint-3--active-countries)
6. [Endpoint 4 — Submit Contact Form](#endpoint-4--submit-contact-form)
7. [Recommended Fetch Order](#recommended-fetch-order)
8. [Error Handling](#error-handling)
9. [TypeScript Interfaces](#typescript-interfaces)

---

## Overview

The public API exposes **4 endpoints** under the `/api` prefix. They are designed to hydrate the home page with bilingual content (English / Arabic). No authentication is required.

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | `GET` | `/api/home-page-content` | Full page content (hero, stats, licensing, process, section headers) |
| 2 | `GET` | `/api/services` | Active service cards |
| 3 | `GET` | `/api/countries` | Active country cards |
| 4 | `POST` | `/api/contact` | Submit contact form message |

---

## Locale Filtering

All `GET` endpoints accept an optional `locale` query parameter:

| Value | Language | Direction |
|-------|----------|-----------|
| `en` | English | LTR (default) |
| `ar` | Arabic | RTL |

```
GET /api/home-page-content?locale=ar
GET /api/services?locale=en
GET /api/countries?locale=ar
```

**Default**: `en` — if omitted, the API returns English text.

---

## Endpoint 1 — Home Page Content

Returns all static page content in a single nested response, filtered by locale.

```
GET /api/home-page-content?locale=en
```

### Response `200`

```json
{
  "hero": {
    "background_image": "/Hero-image.webp",
    "badge": "Trusted & Certified",
    "heading": "Your text here with <br />",
    "highlight_text": "highlighted",
    "description": "Description text with <span class=\"highlight\">highlight</span>",
    "license": "Licensed text",
    "cta_primary": "Contact Us",
    "whatsapp_number": "966XXXXXXXXX",
    "cta_whatsapp": "WhatsApp"
  },
  "stats": {
    "label": "Our Numbers",
    "heading": "Trusted by Thousands",
    "description": "We deliver excellence across every project",
    "items": [
      { "icon": "icon-name", "target": 1500, "suffix": "+", "label": "Happy Clients" }
    ]
  },
  "licensing": {
    "label": "Licensing",
    "heading": "Licensing Services",
    "description": "Complete licensing support",
    "items": [
      { "icon": "icon-name", "title": "Commercial License", "desc": "Description...", "tag": "Popular" }
    ]
  },
  "process": {
    "label": "Process",
    "heading": "How It Works",
    "description": "Simple steps to get started",
    "items": [
      { "step_number": 1, "title": "Consultation", "desc": "We discuss your needs" }
    ]
  },
  "services_header": {
    "label": "Services",
    "heading": "Our Services",
    "description": "Explore what we offer"
  },
  "countries_header": {
    "label": "Countries",
    "heading": "Destinations",
    "description": "Countries we serve"
  }
}
```

### Response `404`

```json
{
  "statusCode": 404,
  "message": "Home page content not found. Run the seed command first.",
  "error": "Not Found"
}
```

### Notes

- `hero.description` and `hero.heading` may contain **limited HTML**: `<br>`, `<span>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<p>`, `<a>`. Render as HTML safely.
- All fields are **nullable** — handle `null`/`undefined` gracefully.
- `statItems`, `licensingItems`, and `processSteps` are ordered by `sort_order ASC`.

---

## Endpoint 2 — Active Services

Returns only **active** service cards, ordered by `sort_order`.

```
GET /api/services?locale=en
```

### Response `200`

```json
[
  {
    "id": 1,
    "icon": "briefcase",
    "title": "Company Formation",
    "desc": "Full company setup service including licensing and registration.",
    "button_label": "Learn More",
    "metric_value": "500",
    "metric_suffix": "+",
    "metric_label": "Companies Formed"
  },
  {
    "id": 2,
    "icon": "globe",
    "title": "Visa Processing",
    "desc": "End-to-end visa and work permit processing.",
    "button_label": "Get Started",
    "metric_value": "1200",
    "metric_suffix": "+",
    "metric_label": "Visas Processed"
  }
]
```

### Notes

- Only services with `is_active = true` are returned.
- Sorted by `sort_order ASC`, then `id ASC`.
- All text fields are nullable — guard against `undefined`.

---

## Endpoint 3 — Active Countries

Returns only **active** country records, ordered by `sort_order`.

```
GET /api/countries?locale=en
```

### Response `200`

```json
[
  {
    "id": 1,
    "flag_emoji": "🇸🇦",
    "name": "Saudi Arabia",
    "specialty": "Commercial & Industrial Licenses",
    "region": "asia",
    "workers_label": "Available Workers"
  },
  {
    "id": 2,
    "flag_emoji": "🇪🇬",
    "name": "Egypt",
    "specialty": "Agricultural & Trade Licenses",
    "region": "africa",
    "workers_label": "Available Workers"
  }
]
```

### Notes

- Only countries with `is_active = true` are returned.
- `region` values: `"asia"` | `"africa"` (may be `null`).
- Sorted by `sort_order ASC`, then `id ASC`.

---

## Endpoint 4 — Submit Contact Form

Creates a new contact message submission. Rate-limited to **5 requests per minute** per IP.

```
POST /api/contact
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| `name` | `string` | **Yes** | 200 | Non-empty string |
| `email` | `string` | **Yes** | 255 | Valid email format |
| `phone` | `string` | No | 50 | Optional string |
| `service` | `string` | No | 200 | Optional string |
| `country` | `string` | No | 200 | Optional string |
| `message` | `string` | No | 5000 | Optional string |

### Example Request

```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "+966501234567",
  "service": "Company Formation",
  "country": "Saudi Arabia",
  "message": "I would like to inquire about setting up a new company."
}
```

### Response `201`

```json
{
  "id": 42,
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "+966501234567",
  "service": "Company Formation",
  "country": "Saudi Arabia",
  "message": "I would like to inquire about setting up a new company.",
  "status": "new",
  "createdAt": "2026-05-15T10:30:00.000Z"
}
```

### Response `400` — Validation Error

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "name must be shorter than or equal to 200 characters"
  ],
  "error": "Bad Request"
}
```

### Response `429` — Rate Limit Exceeded

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too many requests"
}
```

### Notes

- Status is always set to `"new"` on creation.
- Rate limit: **5 requests / 60 seconds** per IP.
- Show a success toast/message after `201` response.
- Disable the submit button while the request is in-flight.
- On `429`, show a "Too many attempts, please try again later" message.

---

## Recommended Fetch Order

```
┌─────────────────────────────────────────┐
│  1. GET /api/home-page-content?locale=X │  ← Hero, stats, licensing, process, headers
├─────────────────────────────────────────┤
│  2. GET /api/services?locale=X          │  ← Service cards (parallel with #3)
│  3. GET /api/countries?locale=X         │  ← Country cards (parallel with #2)
└─────────────────────────────────────────┘
```

**Strategy**:
1. Fetch home page content **first** — it contains section headers and the hero section needed for initial paint.
2. Fetch services and countries **in parallel** — they are independent.
3. Cache responses for the session. Re-fetch only on locale switch.

---

## Error Handling

| Status Code | Meaning | Frontend Action |
|-------------|---------|-----------------|
| `200` / `201` | Success | Render data |
| `400` | Validation error | Show field-level errors from `message` array |
| `404` | Content not found | Show "Content not yet configured" placeholder |
| `429` | Rate limited | Show retry-after message, disable form |
| `500` | Server error | Show generic error toast, log for support |

### Global Error Response Shape

```json
{
  "statusCode": 400,
  "message": "string | string[]",
  "error": "string"
}
```

---

## TypeScript Interfaces

```typescript
// ── Locale ──────────────────────────────────────────────
type Locale = 'en' | 'ar';

// ── Home Page Content ───────────────────────────────────
interface HeroResponse {
  background_image?: string;
  badge?: string;
  heading?: string;
  highlight_text?: string;
  description?: string;
  license?: string;
  cta_primary?: string;
  whatsapp_number?: string;
  cta_whatsapp?: string;
}

interface StatItemResponse {
  icon?: string;
  target?: number;
  suffix?: string;
  label?: string;
}

interface StatsSectionResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: StatItemResponse[];
}

interface LicensingItemResponse {
  icon?: string;
  title?: string;
  desc?: string;
  tag?: string;
}

interface LicensingSectionResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: LicensingItemResponse[];
}

interface ProcessStepResponse {
  step_number?: number;
  title?: string;
  desc?: string;
}

interface ProcessSectionResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: ProcessStepResponse[];
}

interface SectionHeaderResponse {
  label?: string;
  heading?: string;
  description?: string;
}

interface HomePageContentResponse {
  hero: HeroResponse;
  stats: StatsSectionResponse;
  licensing: LicensingSectionResponse;
  process: ProcessSectionResponse;
  services_header: SectionHeaderResponse;
  countries_header: SectionHeaderResponse;
}

// ── Services ────────────────────────────────────────────
interface PublicServiceResponse {
  id: number;
  icon?: string;
  title?: string;
  desc?: string;
  button_label?: string;
  metric_value?: string;
  metric_suffix?: string;
  metric_label?: string;
}

// ── Countries ───────────────────────────────────────────
type CountryRegion = 'asia' | 'africa';

interface PublicCountryResponse {
  id: number;
  flag_emoji?: string;
  name?: string;
  specialty?: string;
  region?: CountryRegion;
  workers_label?: string;
}

// ── Contact Form ────────────────────────────────────────
type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

interface CreateContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
}

interface ContactMessageResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
  status: ContactMessageStatus;
  createdAt: string; // ISO 8601
}

// ── Error ───────────────────────────────────────────────
interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

---

## Quick Start — Example Fetch Calls

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchHomePageContent(locale: Locale = 'en'): Promise<HomePageContentResponse> {
  const res = await fetch(`${BASE_URL}/api/home-page-content?locale=${locale}`);
  if (!res.ok) throw new Error(`Failed to fetch home page content: ${res.status}`);
  return res.json();
}

async function fetchServices(locale: Locale = 'en'): Promise<PublicServiceResponse[]> {
  const res = await fetch(`${BASE_URL}/api/services?locale=${locale}`);
  if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
  return res.json();
}

async function fetchCountries(locale: Locale = 'en'): Promise<PublicCountryResponse[]> {
  const res = await fetch(`${BASE_URL}/api/countries?locale=${locale}`);
  if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status}`);
  return res.json();
}

async function submitContactForm(data: CreateContactMessagePayload): Promise<ContactMessageResponse> {
  const res = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.status === 429) {
    throw new Error('Too many attempts. Please try again later.');
  }
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message);
  }
  return res.json();
}
```

---

## Swagger Documentation

Interactive API docs are available at:

```
GET /docs
```

Look for the **"Public API"** tag to see all public endpoints with live testing.
