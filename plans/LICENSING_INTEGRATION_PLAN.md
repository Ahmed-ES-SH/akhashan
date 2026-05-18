# Licensing Section — Frontend Integration Plan

## Overview

The Licensing Section is part of the Home Page Content system. It consists of:
1. **Section-level text** (label, heading, description) stored in `home_page_content` table
2. **Individual licensing items** (icon, title, description, tag) stored in `licensing_items` table with a ManyToOne relationship to `home_page_content`

All text fields are bilingual (`_en` / `_ar`). Items are ordered by `sort_order`.

---

## Data Model

### Section-Level Fields (from `home_page_content`)

| Field | Type | Max Length | Description |
|---|---|---|---|
| `licensing_label_en` / `licensing_label_ar` | string | 100 | Small label above heading (e.g. "Licensing") |
| `licensing_heading_en` / `licensing_heading_ar` | string | 200 | Main section heading |
| `licensing_description_en` / `licensing_description_ar` | string | 2000 | Description paragraph |

### Licensing Item Fields (from `licensing_items`)

| Field | Type | Max Length | Description |
|---|---|---|---|
| `id` | number | — | Auto-generated primary key |
| `icon` | string | 100 | Icon identifier/path (e.g. SVG name, icon class) |
| `title_en` / `title_ar` | string | 200 | Item title |
| `desc_en` / `desc_ar` | text | 2000 | Item description (supports longer text) |
| `tag_en` / `tag_ar` | string | 100 | Badge/tag text (e.g. "Popular", "New") |
| `sort_order` | number | — | Display order (0-based). Lower = first |

---

## API Endpoints

### 1. Fetch Licensing Section (Public — with locale)

> **Note**: This endpoint lives on the public home-page-content route. Based on the service, it is:

```
GET /api/home-page-content?locale=en
```

**Auth**: None (public)

**Query Params**:
| Param | Type | Required | Description |
|---|---|---|---|
| `locale` | `en` \| `ar` | Yes | Language to return |

**Response** (relevant section only):
```json
{
  "licensing": {
    "label": "Licensing",
    "heading": "Licensing Services",
    "description": "Complete licensing support",
    "items": [
      {
        "icon": "icon-commercial.svg",
        "title": "Commercial License",
        "desc": "Full commercial licensing for businesses operating in the region.",
        "tag": "Popular"
      },
      {
        "icon": "icon-professional.svg",
        "title": "Professional License",
        "desc": "For individual professionals and consultants.",
        "tag": "New"
      }
    ]
  }
}
```

**Key behaviors**:
- Items are returned sorted by `sort_order` ascending
- Only the requested locale's text is returned (no `_en`/`_ar` suffixes)
- If no items exist, `items` is an empty array `[]`
- All fields are optional — handle `undefined`/`null` gracefully

---

### 2. Fetch Full Admin Content (Protected — Admin)

```
GET /api/admin/home-page-content
```

**Auth**: JWT + Admin role required

**Response** (relevant licensing fields only):
```json
{
  "id": 1,
  "licensing_label_en": "Licensing",
  "licensing_label_ar": "الترخيص",
  "licensing_heading_en": "Licensing Services",
  "licensing_heading_ar": "خدمات الترخيص",
  "licensing_description_en": "Complete licensing support",
  "licensing_description_ar": "دعم ترخيص شامل",
  "licensingItems": [
    {
      "id": 1,
      "icon": "icon-commercial.svg",
      "title_en": "Commercial License",
      "title_ar": "ترخيص تجاري",
      "desc_en": "Full commercial licensing for businesses.",
      "desc_ar": "ترخيص تجاري كامل للشركات.",
      "tag_en": "Popular",
      "tag_ar": "شائع",
      "sort_order": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Use this endpoint for**: Admin dashboard editing of the licensing section.

---

### 3. Update Section-Level Text (Protected — Admin)

```
PUT /api/admin/home-page-content
```

**Auth**: JWT + Admin role required

**Request Body** (only licensing fields shown):
```json
{
  "licensing_label_en": "Licensing",
  "licensing_label_ar": "الترخيص",
  "licensing_heading_en": "Licensing Services",
  "licensing_heading_ar": "خدمات الترخيص",
  "licensing_description_en": "Complete licensing support",
  "licensing_description_ar": "دعم ترخيص شامل"
}
```

**Validation rules**:
- All fields optional — only send what you're updating
- `label`: max 100 chars
- `heading`: max 200 chars
- `description`: max 2000 chars
- All fields are plain strings (no HTML sanitization applied to licensing fields)

**Response**: Returns the full updated `HomePageContent` entity.

---

### 4. Licensing Items CRUD (Protected — Admin)

Base path: `/api/admin/licensing-items`

#### 4a. List All Licensing Items

```
GET /api/admin/licensing-items
```

**Response**:
```json
[
  {
    "id": 1,
    "icon": "icon-commercial.svg",
    "title_en": "Commercial License",
    "title_ar": "ترخيص تجاري",
    "desc_en": "Full commercial licensing for businesses.",
    "desc_ar": "ترخيص تجاري كامل للشركات.",
    "tag_en": "Popular",
    "tag_ar": "شائع",
    "sort_order": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

Items ordered by `sort_order ASC`, then `id ASC`.

---

#### 4b. Create a Licensing Item

```
POST /api/admin/licensing-items
```

**Request Body**:
```json
{
  "icon": "icon-commercial.svg",
  "title_en": "Commercial License",
  "title_ar": "ترخيص تجاري",
  "desc_en": "Full commercial licensing for businesses operating in the region.",
  "desc_ar": "ترخيص تجاري كامل للشركات العاملة في المنطقة.",
  "tag_en": "Popular",
  "tag_ar": "شائع",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Validation**:
| Field | Rules |
|---|---|
| `icon` | Optional, string, max 100 chars |
| `title_en` | Optional, string, max 200 chars |
| `title_ar` | Optional, string, max 200 chars |
| `desc_en` | Optional, string, max 2000 chars |
| `desc_ar` | Optional, string, max 2000 chars |
| `tag_en` | Optional, string, max 100 chars |
| `tag_ar` | Optional, string, max 100 chars |
| `sort_order` | Optional, integer, min 0, default 0 |
| `homePageContentId` | Optional, integer, min 1 (auto-set to 1 if omitted) |

**Response**: Returns the created `LicensingItem`.

---

#### 4c. Update a Licensing Item

```
PUT /api/admin/licensing-items/:id
```

**Request Body** (same fields as Create, all optional):
```json
{
  "title_en": "Updated Commercial License",
  "tag_en": "Best Seller"
}
```

**Response**: Returns the updated `LicensingItem`.

**Error**: `404` if item not found.

---

#### 4d. Delete a Licensing Item

```
DELETE /api/admin/licensing-items/:id
```

**Response**: `200 OK` (empty body)

**Error**: `404` if item not found.

**Note**: Cascade delete — deleting the parent `HomePageContent` also deletes all licensing items.

---

### 5. Reordering Licensing Items

#### 5a. Single Item Reorder

```
PATCH /api/admin/licensing-items/:id/reorder
```

**Request Body**:
```json
{
  "sort_order": 2
}
```

**Response**: Returns the updated `LicensingItem`.

---

#### 5b. Bulk Reorder (Drag & Drop)

```
PATCH /api/admin/licensing-items/reorder
```

**Request Body**:
```json
{
  "ids": [3, 1, 4, 2]
}
```

**Behavior**:
- Assigns `sort_order` based on array position (1-indexed)
- `ids[0]` → `sort_order: 1`, `ids[1]` → `sort_order: 2`, etc.
- Executed in a database transaction (all or nothing)
- Returns all licensing items in their new order

**Validation**: `ids` array must not be empty.

---

## Frontend Integration Guide

### Public Display Component

```typescript
// Fetch licensing section for display
const response = await fetch('/api/home-page-content?locale=en');
const data = await response.json();

const { licensing } = data;

// Render section
// licensing.label       → small label text
// licensing.heading     → main heading
// licensing.description → description paragraph
// licensing.items       → array of licensing cards

licensing.items.forEach(item => {
  // item.icon   → render icon
  // item.title  → card title
  // item.desc   → card description
  // item.tag    → optional badge/tag (render conditionally)
});
```

### Admin Dashboard — Licensing Section Editor

#### Section Text Form
- 6 text inputs (label_en, label_ar, heading_en, heading_ar, description_en, description_ar)
- Character limits: label=100, heading=200, description=2000
- Submit via `PUT /api/admin/home-page-content`

#### Licensing Items List
- Fetch via `GET /api/admin/licensing-items`
- Display as a draggable list (ordered by `sort_order`)
- Each item shows: icon, title_en, title_ar, tag_en, tag_ar, description preview

#### Add/Edit Licensing Item Form
- Fields: icon, title_en, title_ar, desc_en, desc_ar, tag_en, tag_ar
- `sort_order` auto-managed by drag-and-drop
- Create: `POST /api/admin/licensing-items`
- Update: `PUT /api/admin/licensing-items/:id`

#### Drag-and-Drop Reorder
- On drop, collect new order of IDs
- Send via `PATCH /api/admin/licensing-items/reorder` with `{ ids: [...] }`
- Refresh list after successful response

---

## Display Logic Recommendations

### Tag/Badge Rendering
- `tag` is optional — only render a badge if the value is present and non-empty
- Tags are typically short labels like "Popular", "New", "Best Seller"
- Style as a small pill/badge above or beside the item title

### Icon Rendering
- `icon` field stores a string — interpret as:
  - SVG filename (e.g. `"icon-commercial.svg"`) → resolve from assets
  - Icon class name (e.g. `"fa-building"`) → use with icon library
  - URL path → use directly as `<img src>`
- Coordinate with backend on the expected format

### Description Text
- `desc` field is `text` type (up to 2000 chars) — longer than titles
- Consider truncating in card previews with a "read more" expand
- No HTML sanitization is applied — treat as plain text on the frontend

### Empty States
- If `licensing.items` is empty, hide the entire licensing section
- If `label`, `heading`, or `description` are null, hide those elements (don't render empty containers)

### Locale Switching
- Public API returns only one locale — re-fetch on language change
- Admin API returns both `_en` and `_ar` — show both in a bilingual form with tabs or side-by-side fields

---

## Error Handling

| Scenario | HTTP Status | Frontend Action |
|---|---|---|
| Content not yet seeded | 404 | Show fallback/empty state, notify admin to run seed |
| Invalid JWT / expired | 401 | Redirect to login |
| Insufficient permissions | 403 | Show "access denied" |
| Validation error | 400 | Display field-level errors from response |
| Item not found (update/delete) | 404 | Refresh list, show "item no longer exists" |

---

## Quick Reference: Field Mapping

### Public Response → Admin Entity

| Public Field (`licensing.*`) | Admin Entity Field |
|---|---|
| `licensing.label` | `licensing_label_en` or `licensing_label_ar` |
| `licensing.heading` | `licensing_heading_en` or `licensing_heading_ar` |
| `licensing.description` | `licensing_description_en` or `licensing_description_ar` |
| `licensing.items[].icon` | `licensingItems[].icon` |
| `licensing.items[].title` | `licensingItems[].title_en` or `licensingItems[].title_ar` |
| `licensing.items[].desc` | `licensingItems[].desc_en` or `licensingItems[].desc_ar` |
| `licensing.items[].tag` | `licensingItems[].tag_en` or `licensingItems[].tag_ar` |

### DTO Validation Summary

| Field | Create/Update Max Length | Type |
|---|---|---|
| `icon` | 100 | string |
| `title_en` / `title_ar` | 200 | string |
| `desc_en` / `desc_ar` | 2000 | string (text) |
| `tag_en` / `tag_ar` | 100 | string |
| `sort_order` | — | integer, min 0 |

---

## Notes

1. **Single-row pattern**: `home_page_content` is a single-row table (id=1). The section text fields are shared — updating them affects the entire licensing section.
2. **Cascade delete**: Licensing items are deleted automatically if the parent home page content row is deleted.
3. **No visibility toggle**: Currently, licensing items have no `is_active` or `is_visible` flag. All items in the table are displayed. If you need this, request a backend enhancement.
4. **No pagination**: Licensing items are expected to be a small set (3-8 items). No pagination is implemented.
5. **Sort order is manual**: The backend does not auto-assign `sort_order` on create. The frontend should either send an explicit value or default to placing new items at the end.
6. **Description is text type**: Unlike `title` and `tag` which are varchar, `desc` uses the `text` column type — suitable for longer content but still max 2000 chars by validation.
