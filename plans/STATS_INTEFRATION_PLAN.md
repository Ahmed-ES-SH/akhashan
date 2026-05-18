# Stats Section — Frontend Integration Plan

## Overview

The Stats Section is part of the Home Page Content system. It consists of:
1. **Section-level text** (label, heading, description) stored in `home_page_content` table
2. **Individual stat items** (icon, target number, suffix, label) stored in `stat_items` table with a ManyToOne relationship to `home_page_content`

All text fields are bilingual (`_en` / `_ar`). Items are ordered by `sort_order`.

---

## Data Model

### Section-Level Fields (from `home_page_content`)

| Field | Type | Max Length | Description |
|---|---|---|---|
| `stats_label_en` / `stats_label_ar` | string | 100 | Small label above heading (e.g. "Our Numbers") |
| `stats_heading_en` / `stats_heading_ar` | string | 200 | Main section heading |
| `stats_description_en` / `stats_description_ar` | string | 2000 | Description paragraph |

### Stat Item Fields (from `stat_items`)

| Field | Type | Max Length | Description |
|---|---|---|---|
| `id` | number | — | Auto-generated primary key |
| `icon` | string | 100 | Icon identifier/path (e.g. SVG name, icon class) |
| `target` | number | — | Numeric target value (e.g. 10000). Min: 0 |
| `suffix` | string | 20 | Suffix after number (e.g. "+", "%", "K") |
| `label_en` / `label_ar` | string | 200 | Item label (e.g. "Happy Clients") |
| `sort_order` | number | — | Display order (0-based). Lower = first |

---

## API Endpoints

### 1. Fetch Stats Section (Public — with locale)

> **Note**: This endpoint lives on the public home-page-content route. Check your `app.controller.ts` or a public controller for the exact path. Based on the service, it is:

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
  "stats": {
    "label": "Our Numbers",
    "heading": "Trusted by Thousands",
    "description": "We deliver excellence across every project",
    "items": [
      {
        "icon": "icon-clients.svg",
        "target": 10000,
        "suffix": "+",
        "label": "Happy Clients"
      },
      {
        "icon": "icon-projects.svg",
        "target": 500,
        "suffix": "+",
        "label": "Projects Completed"
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

**Response** (full entity with `_en`/`_ar` fields):
```json
{
  "id": 1,
  "stats_label_en": "Our Numbers",
  "stats_label_ar": "أرقامنا",
  "stats_heading_en": "Trusted by Thousands",
  "stats_heading_ar": "موثوق من الآلاف",
  "stats_description_en": "We deliver excellence...",
  "stats_description_ar": "نقدم التميز...",
  "statItems": [
    {
      "id": 1,
      "icon": "icon-clients.svg",
      "target": 10000,
      "suffix": "+",
      "label_en": "Happy Clients",
      "label_ar": "عملاء سعداء",
      "sort_order": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Use this endpoint for**: Admin dashboard editing of the stats section.

---

### 3. Update Section-Level Text (Protected — Admin)

```
PUT /api/admin/home-page-content
```

**Auth**: JWT + Admin role required

**Request Body** (only stats fields shown):
```json
{
  "stats_label_en": "Our Numbers",
  "stats_label_ar": "أرقامنا",
  "stats_heading_en": "Trusted by Thousands",
  "stats_heading_ar": "موثوق من الآلاف",
  "stats_description_en": "We deliver excellence across every project",
  "stats_description_ar": "نقدم التميز في كل مشروع"
}
```

**Validation rules**:
- All fields optional — only send what you're updating
- `label`: max 100 chars
- `heading`: max 200 chars
- `description`: max 2000 chars
- All fields are plain strings (no HTML sanitization applied to stats fields)

**Response**: Returns the full updated `HomePageContent` entity.

---

### 4. Stat Items CRUD (Protected — Admin)

Base path: `/api/admin/stat-items`

#### 4a. List All Stat Items

```
GET /api/admin/stat-items
```

**Response**:
```json
[
  {
    "id": 1,
    "icon": "icon-clients.svg",
    "target": 10000,
    "suffix": "+",
    "label_en": "Happy Clients",
    "label_ar": "عملاء سعداء",
    "sort_order": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

Items ordered by `sort_order ASC`, then `id ASC`.

---

#### 4b. Create a Stat Item

```
POST /api/admin/stat-items
```

**Request Body**:
```json
{
  "icon": "icon-clients.svg",
  "target": 10000,
  "suffix": "+",
  "label_en": "Happy Clients",
  "label_ar": "عملاء سعداء",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Validation**:
| Field | Rules |
|---|---|
| `icon` | Optional, string, max 100 chars |
| `target` | Optional, integer, min 0 |
| `suffix` | Optional, string, max 20 chars |
| `label_en` | Optional, string, max 200 chars |
| `label_ar` | Optional, string, max 200 chars |
| `sort_order` | Optional, integer, min 0, default 0 |
| `homePageContentId` | Optional, integer, min 1 (auto-set to 1 if omitted) |

**Response**: Returns the created `StatItem`.

---

#### 4c. Update a Stat Item

```
PUT /api/admin/stat-items/:id
```

**Request Body** (same fields as Create, all optional):
```json
{
  "target": 15000,
  "label_en": "Satisfied Clients"
}
```

**Response**: Returns the updated `StatItem`.

**Error**: `404` if item not found.

---

#### 4d. Delete a Stat Item

```
DELETE /api/admin/stat-items/:id
```

**Response**: `200 OK` (empty body)

**Error**: `404` if item not found.

**Note**: Cascade delete — deleting the parent `HomePageContent` also deletes all stat items.

---

### 5. Reordering Stat Items

#### 5a. Single Item Reorder

```
PATCH /api/admin/stat-items/:id/reorder
```

**Request Body**:
```json
{
  "sort_order": 2
}
```

**Response**: Returns the updated `StatItem`.

---

#### 5b. Bulk Reorder (Drag & Drop)

```
PATCH /api/admin/stat-items/reorder
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
- Returns all stat items in their new order

**Validation**: `ids` array must not be empty.

---

## Frontend Integration Guide

### Public Display Component

```typescript
// Fetch stats for display
const response = await fetch('/api/home-page-content?locale=en');
const data = await response.json();

const { stats } = data;

// Render section
// stats.label     → small label text
// stats.heading   → main heading
// stats.description → description paragraph
// stats.items     → array of stat cards

stats.items.forEach(item => {
  // item.icon     → render icon
  // item.target   → animate number to this value
  // item.suffix   → append after number (e.g. "+")
  // item.label    → item label text
});
```

### Admin Dashboard — Stats Section Editor

#### Section Text Form
- 6 text inputs (label_en, label_ar, heading_en, heading_ar, description_en, description_ar)
- Character limits: label=100, heading=200, description=2000
- Submit via `PUT /api/admin/home-page-content`

#### Stat Items List
- Fetch via `GET /api/admin/stat-items`
- Display as a draggable list (ordered by `sort_order`)
- Each item shows: icon, target+suffix, label_en, label_ar

#### Add/Edit Stat Item Form
- Fields: icon, target, suffix, label_en, label_ar
- `sort_order` auto-managed by drag-and-drop
- Create: `POST /api/admin/stat-items`
- Update: `PUT /api/admin/stat-items/:id`

#### Drag-and-Drop Reorder
- On drop, collect new order of IDs
- Send via `PATCH /api/admin/stat-items/reorder` with `{ ids: [...] }`
- Refresh list after successful response

---

## Display Logic Recommendations

### Number Animation
- Use `target` as the end value for a counting animation
- Append `suffix` after the animated number (e.g. `10,000+`)
- If `target` is null/undefined, display nothing or a dash

### Icon Rendering
- `icon` field stores a string — interpret as:
  - SVG filename (e.g. `"icon-clients.svg"`) → resolve from assets
  - Icon class name (e.g. `"fa-users"`) → use with icon library
  - URL path → use directly as `<img src>`
- Coordinate with backend on the expected format

### Empty States
- If `stats.items` is empty, hide the entire stats section
- If `label`, `heading`, or `description` are null, hide those elements (don't render empty containers)

### Locale Switching
- Public API returns only one locale — re-fetch on language change
- Admin API returns both `_en` and `_ar` — show both in a bilingual form

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

| Public Field (`stats.*`) | Admin Entity Field |
|---|---|
| `stats.label` | `stats_label_en` or `stats_label_ar` |
| `stats.heading` | `stats_heading_en` or `stats_heading_ar` |
| `stats.description` | `stats_description_en` or `stats_description_ar` |
| `stats.items[].icon` | `statItems[].icon` |
| `stats.items[].target` | `statItems[].target` |
| `stats.items[].suffix` | `statItems[].suffix` |
| `stats.items[].label` | `statItems[].label_en` or `statItems[].label_ar` |

---

## Notes

1. **Single-row pattern**: `home_page_content` is a single-row table (id=1). The section text fields are shared — updating them affects the entire stats section.
2. **Cascade delete**: Stat items are deleted automatically if the parent home page content row is deleted.
3. **No visibility toggle**: Currently, stat items have no `is_active` or `is_visible` flag. All items in the table are displayed. If you need this, request a backend enhancement.
4. **No pagination**: Stat items are expected to be a small set (3-8 items). No pagination is implemented.
5. **Sort order is manual**: The backend does not auto-assign `sort_order` on create. The frontend should either send an explicit value or default to placing new items at the end.
