# Process Section Integration Plan

> **Scope**: Process section only — section header (label, heading, description) + individual process steps (step_number, bilingual title/desc, sort_order, CRUD, reorder).
> **Date**: 2026-05-16
> **Status**: Draft

---

## 1. Overview

The process section is the "How It Works" block on the home page. It has two parts:

1. **Section Header** — stored as flat bilingual columns on the `home_page_content` table (single-row, `id = 1`) along with all other home page content.
2. **Process Steps** — stored as child rows in `process_steps` table, linked to `home_page_content` via `home_page_content_id` FK. Each step has `step_number` (visual badge), bilingual title/desc, and `sort_order` (display order).

The frontend consumes this through two distinct API surfaces:

| Surface | Endpoint(s) | Auth | Purpose |
|---|---|---|---|
| **Admin** | `PUT /api/admin/home-page-content` | JWT + Admin role | Update section header text (`process_label_*`, `process_heading_*`, `process_description_*`) |
| **Admin** | `GET /api/admin/process-steps` | JWT + Admin role | List all steps (for admin management UI) |
| **Admin** | `POST /api/admin/process-steps` | JWT + Admin role | Create a new step |
| **Admin** | `PUT /api/admin/process-steps/:id` | JWT + Admin role | Update a step |
| **Admin** | `DELETE /api/admin/process-steps/:id` | JWT + Admin role | Delete a step |
| **Admin** | `PATCH /api/admin/process-steps/:id/reorder` | JWT + Admin role | Reorder a single step |
| **Admin** | `PATCH /api/admin/process-steps/reorder` | JWT + Admin role | Bulk reorder all steps |
| **Public** | `GET /api/home-page-content?locale=en\|ar` | None | Read locale-filtered process section header + steps |

---

## 2. Data Model

### 2.1 Section Header Columns (`home_page_content` table)

These fields live on the **same single-row table** as hero, stats, licensing, etc. They are updated via `PUT /api/admin/home-page-content`.

| Column | Type | Nullable | Max Length | Description |
|---|---|---|---|---|
| `process_label_en` | `varchar` | yes | 100 | EN label/suptitle (e.g. "Process") |
| `process_label_ar` | `varchar` | yes | 100 | AR label (e.g. "العملية") |
| `process_heading_en` | `varchar` | yes | 200 | EN heading (e.g. "How It Works") |
| `process_heading_ar` | `varchar` | yes | 200 | AR heading (e.g. "كيف يعمل") |
| `process_description_en` | `text` | yes | 2000 | EN description paragraph |
| `process_description_ar` | `text` | yes | 2000 | AR description paragraph |

### 2.2 Process Steps Table (`process_steps`)

Each row represents one step in the process.

| Column | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | `int` (PK) | no | Auto-increment | Unique identifier |
| `step_number` | `int` | no | `>= 1` | Visual step number badge (e.g. 1, 2, 3) |
| `title_en` | `varchar(200)` | yes | — | EN step title |
| `title_ar` | `varchar(200)` | yes | — | AR step title |
| `desc_en` | `text` | yes | Max 2000 | EN step description |
| `desc_ar` | `text` | yes | Max 2000 | AR step description |
| `sort_order` | `int` | no | Default `0`, `>= 0` | Display order (ascending) |
| `home_page_content_id` | `int` (FK) | yes | References `home_page_content.id` | Parent row (always `1`) |
| `createdAt` | `timestamp` | no | Auto | Audit |
| `updatedAt` | `timestamp` | no | Auto | Audit |

**Indexes**: FK index on `home_page_content_id` (auto-created by TypeORM).

**Cascade**: `ON DELETE CASCADE` — deleting the home page content row deletes all steps.

### 2.3 Entity Relationship

```
home_page_content (id=1)
  │
  ├── processSteps: ProcessStep[]  ←  OneToMany / ManyToOne
  │     └── home_page_content_id (FK)
  │
  ├── statItems: StatItem[]        ←  (other sections, same pattern)
  ├── licensingItems: LicensingItem[]
  └── (no other children)
```

---

## 3. Admin Integration

### 3.1 Update Section Header

The Process section header (label, heading, description) is updated via the **same endpoint** used for all home page content.

**Endpoint**: `PUT /api/admin/home-page-content`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body (process fields only)**:
```json
{
  "process_label_en": "Process",
  "process_label_ar": "العملية",
  "process_heading_en": "How It Works",
  "process_heading_ar": "كيف يعمل",
  "process_description_en": "Simple steps to get started",
  "process_description_ar": "خطوات بسيطة للبدء"
}
```

**Note**: All fields are `@IsOptional()`. Only fields present in the body are updated (partial update). Omitted fields retain their existing DB values.

**Integration Logic**:
```
Frontend → PUT /api/admin/home-page-content
  │
  ├─ Body: { process_label_en: "...", process_heading_ar: "...", ... }
  │
  ├─ ValidationPipe (global)
  │   ├─ whitelist: true              → strips unknown properties
  │   ├─ forbidNonWhitelisted: true   → rejects unknown properties with 400
  │   └─ transform: true              → runs class-transformer decorators
  │
  ├─ class-validator decorators (on each field)
  │   ├─ @IsOptional()
  │   ├─ @IsString()
  │   └─ @MaxLength(N) per field (see §2.1)
  │
  ├─ HomePageContentService.update(dto)
  │   ├─ findOne() → loads entity with id=1 + all relations (throws 404 if missing)
  │   ├─ Object.assign(entity, dto) → merges only provided fields
  │   └─ repository.save(entity) → persists
  │
  └─ Response: full HomePageContent entity (all sections, all fields)
```

**Response Shape (process section fields in entity)**:
```json
{
  "process_label_en": "Process",
  "process_label_ar": "العملية",
  "process_heading_en": "How It Works",
  "process_heading_ar": "كيف يعمل",
  "process_description_en": "Simple steps to get started",
  "process_description_ar": "خطوات بسيطة للبدء",
  "processSteps": [
    { "id": 1, "step_number": 1, "title_en": "...", "title_ar": "...", "sort_order": 0, ... }
  ],
  "...": "... (other sections)"
}
```

### 3.2 List All Process Steps

**Endpoint**: `GET /api/admin/process-steps`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Response**:
```json
[
  {
    "id": 1,
    "step_number": 1,
    "title_en": "Submit Application",
    "title_ar": "تقديم الطلب",
    "desc_en": "Fill out the online application form",
    "desc_ar": "املأ نموذج الطلب عبر الإنترنت",
    "sort_order": 0,
    "homePageContentId": 1,
    "createdAt": "2026-05-16T10:00:00.000Z",
    "updatedAt": "2026-05-16T10:00:00.000Z"
  }
]
```

### 3.3 Create a Process Step

**Endpoint**: `POST /api/admin/process-steps`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body**:
```json
{
  "step_number": 1,
  "title_en": "Submit Application",
  "title_ar": "تقديم الطلب",
  "desc_en": "Fill out the application form with your details",
  "desc_ar": "املأ نموذج الطلب ببياناتك",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Validation Rules**:

| Field | Rule | Notes |
|---|---|---|
| `step_number` | `@IsInt()`, `@Min(1)`, **required** | Display badge number |
| `title_en` | `@IsString()`, `@MaxLength(200)`, optional | |
| `title_ar` | `@IsString()`, `@MaxLength(200)`, optional | |
| `desc_en` | `@IsString()`, `@MaxLength(2000)`, optional | |
| `desc_ar` | `@IsString()`, `@MaxLength(2000)`, optional | |
| `sort_order` | `@IsInt()`, `@Min(0)`, optional, default `0` | Leave `0` to append at end |
| `homePageContentId` | `@IsInt()`, `@Min(1)`, optional, default `1` | FK to home page content |

**Response**: The created `ProcessStep` entity.

**Integration Logic**:
```
Frontend → POST /api/admin/process-steps
  │
  ├─ Body: CreateProcessStepDto
  │
  ├─ ValidationPipe (whitelist + forbidNonWhitelisted + transform)
  │
  ├─ ProcessStepsService.create(dto)
  │   ├─ repository.create(dto) → entity instance
  │   └─ repository.save(entity) → persist
  │
  └─ Response: ProcessStep entity (with id, createdAt, updatedAt)
```

### 3.4 Update a Process Step

**Endpoint**: `PUT /api/admin/process-steps/:id`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body** (same fields as create, all optional):
```json
{
  "step_number": 2,
  "title_en": "Updated Title",
  "desc_en": "Updated description"
}
```

**Integration Logic**:
```
Frontend → PUT /api/admin/process-steps/1
  │
  ├─ Body: UpdateProcessStepDto (all optional for partial update)
  │
  ├─ ProcessStepsService.update(id, dto)
  │   ├─ repository.update(id, dto) → UPDATE query
  │   └─ findOne(id) → throws 404 if not found
  │
  └─ Response: updated ProcessStep entity
```

### 3.5 Delete a Process Step

**Endpoint**: `DELETE /api/admin/process-steps/:id`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Response**: `204 No Content` (void)

**Error**: `404` if `id` not found.

### 3.6 Reorder (Single)

**Endpoint**: `PATCH /api/admin/process-steps/:id/reorder`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body**:
```json
{
  "sort_order": 3
}
```

**Response**: The updated `ProcessStep` entity.

### 3.7 Bulk Reorder

**Endpoint**: `PATCH /api/admin/process-steps/reorder`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body**:
```json
{
  "ids": [3, 1, 2]
}
```

**Logic**: Server assigns `sort_order` based on array position (1-indexed). Executed in a DB transaction for atomicity.

| Array Index | `id` | Assigned `sort_order` |
|---|---|---|
| 0 | 3 | 1 |
| 1 | 1 | 2 |
| 2 | 2 | 3 |

**Response**: Full array of all `ProcessStep` entities, ordered by the new `sort_order`.

**Integration Logic**:
```
Frontend → PATCH /api/admin/process-steps/reorder
  │
  ├─ Body: { ids: [3, 1, 2] }
  │
  ├─ ProcessStepsService.bulkReorder(ids)
  │   ├─ dataSource.transaction(...)
  │   │   ├─ UPDATE process_steps SET sort_order = 1 WHERE id = 3
  │   │   ├─ UPDATE process_steps SET sort_order = 2 WHERE id = 1
  │   │   ├─ UPDATE process_steps SET sort_order = 3 WHERE id = 2
  │   │   └─ SELECT * FROM process_steps ORDER BY sort_order ASC, id ASC
  │   └─ returns ProcessStep[]
  │
  └─ Response: ordered ProcessStep[]
```

### 3.8 Recommended Admin Workflow

**Creating a new step**:
```
Step 1: POST /api/admin/process-steps
          → body includes step_number, title_en/ar, desc_en/ar, sort_order (optional)
          → receives created entity with id

Step 2 (if needed): PATCH /api/admin/process-steps/reorder
          → body: { ids: [...] } in desired display order
```

**Full section header update**:
```
PUT /api/admin/home-page-content
  → body includes ALL changed fields across ALL sections
  → (process fields are just a subset of the full payload)
```

> **Recommendation**: Since `PUT /api/admin/home-page-content` updates ALL sections at once, the frontend should:
> 1. First `GET /api/admin/home-page-content` to get current state.
> 2. Modify only the process header fields.
> 3. `PUT` with the full object (or just the changed fields — partial update works).

---

## 4. Public Integration

### 4.1 Fetch Locale-Filtered Process Section

The process section (header + steps) is returned as part of the full home page content response.

**Endpoint**: `GET /api/home-page-content?locale=en` (or `ar`)

**Auth**: None

**Query Params**:

| Param | Type | Required | Default |
|---|---|---|---|
| `locale` | `en` \| `ar` | No | `en` |

**Integration Logic**:
```
Frontend → GET /api/home-page-content?locale=en
  │
  ├─ HomePageContentService.findPublic(locale)
  │   ├─ findOne() → loads entity + relations:
  │   │     statItems, licensingItems, processSteps
  │   │     (ordered by sort_order ASC)
  │   │
  │   ├─ Map process fields → ProcessSectionResponseDto:
  │   │
  │   │   Section Header:
  │   │     label       = locale === 'en' ? entity.process_label_en
  │   │                                    : entity.process_label_ar
  │   │     heading     = locale === 'en' ? entity.process_heading_en
  │   │                                    : entity.process_heading_ar
  │   │     description = locale === 'en' ? entity.process_description_en
  │   │                                    : entity.process_description_ar
  │   │
  │   │   Steps (from entity.processSteps, mapped per locale):
  │   │     step_number = item.step_number
  │   │     title       = locale === 'en' ? item.title_en : item.title_ar
  │   │     desc        = locale === 'en' ? item.desc_en : item.desc_ar
  │   │
  │   └─ Returns HomePageContentResponseDto {
  │         hero, stats, licensing, process, services_header, countries_header
  │       }
  │
  └─ Response: { process: { label, heading, description, items: [...] } }
```

**Response Shape**:
```json
{
  "process": {
    "label": "Process",
    "heading": "How It Works",
    "description": "Simple steps to get started",
    "items": [
      {
        "step_number": 1,
        "title": "Submit Application",
        "desc": "Fill out the application form"
      },
      {
        "step_number": 2,
        "title": "Document Review",
        "desc": "Our team reviews your documents"
      },
      {
        "step_number": 3,
        "title": "Approval",
        "desc": "Receive your license and certification"
      }
    ]
  }
}
```

**Key behaviors**:
- **Steps ordered by `sort_order` ASC**, then `id` ASC as tiebreaker.
- **Bilingual filtering**: Only the requested locale's text fields are returned. The `_en` / `_ar` suffix is stripped.
- **Null handling**: All fields are nullable. If a step has no `title_ar` but `locale=ar` is requested, it returns `null`.
- **No DB/metadata fields**: `items` array only contains `step_number`, `title`, `desc` — no `id`, `sort_order`, `createdAt`, etc.
- **404 if no seed**: If `home_page_content` row does not exist, the public endpoint returns `404`.

### 4.2 Public Response DTO Structure

```
HomePageContentResponseDto
  ├── hero: HeroResponseDto
  ├── stats: StatsSectionResponseDto
  ├── licensing: LicensingSectionResponseDto
  ├── process: ProcessSectionResponseDto     ← THIS SECTION
  │     ├── label?: string                    ← section header
  │     ├── heading?: string
  │     ├── description?: string
  │     └── items: ProcessStepResponseDto[]  ← steps array
  │           ├── step_number?: number
  │           ├── title?: string
  │           └── desc?: string
  ├── services_header: SectionHeaderResponseDto
  └── countries_header: SectionHeaderResponseDto
```

---

## 5. Frontend Integration Checklist

### 5.1 Admin Dashboard — Process Section Editor

#### Section Header (3 bilingual fields)

| Task | Details |
|---|---|
| Fetch current content | `GET /api/admin/home-page-content` → populate form fields |
| Label inputs | `process_label_en` + `process_label_ar` — side-by-side for en/ar |
| Heading inputs | `process_heading_en` + `process_heading_ar` |
| Description inputs | `process_description_en` + `process_description_ar` — textarea (max 2000 chars) |
| Save header | `PUT /api/admin/home-page-content` with updated process fields |
| Partial save | Only changed fields are submitted |

#### Process Steps CRUD

| Task | Details |
|---|---|
| List steps | `GET /api/admin/process-steps` → render ordered list/table |
| Create step | Modal/form → `POST /api/admin/process-steps` → refresh list |
| Edit step | Modal/inline → `PUT /api/admin/process-steps/:id` → update row |
| Delete step | Confirmation dialog → `DELETE /api/admin/process-steps/:id` → remove from list |
| Step number | `step_number` input (int ≥ 1) — displayed as badge number on the step card |
| Title fields | `title_en` (max 200 chars) + `title_ar` (max 200 chars) |
| Description fields | `desc_en` (max 2000 chars, textarea) + `desc_ar` (max 2000 chars, textarea) |
| Sort order | Bound to `sort_order` field OR drag-and-drop reorder |

#### Reordering

| Task | Details |
|---|---|
| Drag-and-drop UI | Frontend tracks new order → `PATCH /api/admin/process-steps/reorder` with `{ ids: [...] }` |
| Single reorder | Alternative: `PATCH /api/admin/process-steps/:id/reorder` with `{ sort_order: N }` |
| Optimistic UI | Update list order immediately, revert on API error |
| Debounce | If using per-step reorder, debounce to avoid rapid-fire requests |

#### Create/Edit Form Fields Validation

| Field | Client Validation |
|---|---|
| `step_number` | Required, integer ≥ 1 |
| `title_en` | Optional, max 200 chars |
| `title_ar` | Optional, max 200 chars |
| `desc_en` | Optional, max 2000 chars — show character counter |
| `desc_ar` | Optional, max 2000 chars — show character counter |
| `homePageContentId` | Auto-set to `1`, not shown in form |

### 5.2 Public Site — Process Section Rendering

| Task | Details |
|---|---|
| Fetch section | The public endpoint `GET /api/home-page-content?locale=en` returns all sections — extract `process` from the response |
| Locale switching | Re-fetch on locale change (`en` ↔ `ar`) — the server returns the correct locale automatically |
| RTL support | When `locale === 'ar'`, apply `dir="rtl"` and appropriate CSS |
| Step number badge | Render `step_number` visually (e.g. numbered circle, "01", "02", "03") |
| Section label | Render `process.label` as a small suptitle above the heading |
| Section heading | Render `process.heading` as the main title |
| Section description | Render `process.description` below the heading |
| Step cards | Map over `process.items[]` — each with `step_number`, `title`, `desc` |
| Null/undefined handling | If any field is null/undefined, hide the element or show fallback |
| Empty state | If `items` is empty array, hide the entire section (or show "No steps configured") |
| Animation | Consider staggered entrance animation for step cards |

---

## 6. Error Handling Matrix

| Scenario | HTTP Status | Response Body | Frontend Action |
|---|---|---|---|
| No `home_page_content` row (seed not run) — admin | 404 | `{ "message": "Home page content not found...", "error": "Not Found", "statusCode": 404 }` | Prompt admin to run seed |
| No `home_page_content` row — public | 404 | Same shape | Show fallback / hide section |
| Process step not found (update/delete) | 404 | `{ "message": "ProcessStep with ID {id} not found", "error": "Not Found", "statusCode": 404 }` | Refresh list, show error toast |
| Validation failure | 400 | `{ "message": ["step_number must be an integer", ...], "error": "Bad Request", "statusCode": 400 }` | Display field-level errors |
| Unauthorized (no token) | 401 | `{ "message": "Unauthorized", "statusCode": 401 }` | Redirect to login |
| Forbidden (non-admin) | 403 | `{ "message": "Forbidden resource", "statusCode": 403 }` | Show access denied |
| Empty bulk reorder array | 400 | `{ "message": "ids array must not be empty", "error": "Bad Request", "statusCode": 400 }` | Require at least 2 steps |
| Unknown property in request | 400 | `{ "message": ["property someBadField should not exist"], "error": "Bad Request", "statusCode": 400 }` | Check DTO alignment |

---

## 7. Security Notes

| Concern | Mitigation |
|---|---|
| XSS via step fields | Process step fields (`title_en/ar`, `desc_en/ar`) are **not** HTML-sanitized — they are plain text strings. The frontend should use text rendering (not `innerHTML`) for these fields. If HTML support is added later, `sanitizeHtml()` must be applied. |
| Unauthorized CRUD | All admin endpoints guarded by `JwtAuthGuard` + `RolesGuard` (admin role). Public endpoint is read-only and unguarded. |
| Mass assignment | `UpdateProcessStepDto` only exposes fields intended for update. `whitelist: true` and `forbidNonWhitelisted: true` prevent injection of arbitrary entity fields. |
| SQL injection | TypeORM parameterized queries — no raw SQL. |
| Rate limiting | Public endpoint protected by global `@nestjs/throttler`. |

---

## 8. Performance Considerations

| Aspect | Detail |
|---|---|
| Steps query | `findAll()` is a simple `SELECT * FROM process_steps ORDER BY sort_order ASC, id ASC` — efficient with index. |
| Relation loading | Steps are loaded eagerly as part of `findOne()` (the GET all-content endpoint). If the response becomes large, consider lazy loading via query builder. |
| Transaction | `bulkReorder()` uses a DB transaction — atomic but locks rows briefly. For < 10 steps, this is negligible. |
| Caching | Process section changes infrequently. Consider caching the public response (TTL ~5 min). |
| Payload size | Typical response: ~1 KB for section header + ~500 bytes per step. Negligible. |

---

## 9. Seed Data Defaults

| Group | Field | EN Default | AR Default |
|---|---|---|---|
| **Header** | `process_label` | `Process` | `العملية` |
| **Header** | `process_heading` | `How It Works` | `كيف يعمل` |
| **Header** | `process_description` | `Simple steps to get started` | `خطوات بسيطة للبدء` |

There are **no seed defaults for process steps** — the admin creates them after seeding. The steps array is empty until the first step is created.

---

## 10. File Map

| File | Role in Process Integration |
|---|---|
| `src/home-page-content/schema/home-page-content.schema.ts` | Entity — `process_label_*`, `process_heading_*`, `process_description_*` columns + `@OneToMany(() => ProcessStep)` relation |
| `src/process-steps/schema/process-step.schema.ts` | Entity — `step_number`, `title_en/ar`, `desc_en/ar`, `sort_order`, FK to `home_page_content` |
| `src/home-page-content/dto/home-page-content.dto.ts` | `UpdateHomePageContentDto` — validation for process header fields (lines 210–244) |
| `src/home-page-content/dto/home-page-content-response.dto.ts` | `ProcessSectionResponseDto`, `ProcessStepResponseDto` — public response shape |
| `src/home-page-content/home-page-content.controller.ts` | Admin `PUT` endpoint for section header |
| `src/home-page-content/home-page-content.service.ts` | `findOne()` (loads steps via relations), `findPublic(locale)` (maps process header + steps per locale), `update(dto)` (updates header fields) |
| `src/home-page-content/home-page-content.module.ts` | Module registration |
| `src/process-steps/process-steps.controller.ts` | Admin CRUD + reorder endpoints |
| `src/process-steps/process-steps.service.ts` | Business logic — create, update, delete, reorder, bulkReorder |
| `src/process-steps/process-steps.module.ts` | Module registration |
| `src/process-steps/dto/process-step.dto.ts` | `CreateProcessStepDto`, `UpdateProcessStepDto` — validation |
| `src/common/dto/reorder.dto.ts` | `ReorderDto`, `BulkReorderDto` — shared reorder DTOs |
| `src/public/public.controller.ts` | Public `GET /api/home-page-content?locale=en\|ar` |
| `src/public/dto/locale-query.dto.ts` | `LocaleQueryDto` — locale query param validation |

---

## 11. Integration Sequence Diagrams

### 11.1 Admin: Create + Reorder Steps

```
┌──────────┐          ┌────────────────────────┐          ┌───────────────┐          ┌──────────────┐
│ Frontend │          │  POST /api/admin/       │          │  Controller   │          │   Service    │
│          │          │     process-steps       │          │               │          │              │
└────┬─────┘          └──────────┬─────────────┘          └──────┬────────┘          └──────┬───────┘
     │                            │                              │                          │
     │── POST /process-steps ─────►                              │                          │
     │   { step_number: 1,        │── ValidationPipe ───────────►│                          │
     │     title_en: "...",       │                              │── create(dto) ──────────►│
     │     title_ar: "..." }      │                              │                          │── repository.create(dto)
     │                            │                              │                          │── repository.save(entity)
     │                            │◄── 201: ProcessStep ────────│◄── entity ───────────────│
     │◄── 201: { id: 1, ... } ────│                              │                          │
     │                            │                              │                          │
     │                            │  ─ ─ ─ Repeat for step 2 ─ ─│                          │
     │                            │                              │                          │
     │── PATCH /process-steps/    │                              │                          │
     │     reorder                │── ValidationPipe ───────────►│                          │
     │   { ids: [2, 1] }         │                              │── bulkReorder([2,1]) ───►│
     │                            │                              │                          │── TRANSACTION:
     │                            │                              │                          │   ├─ UPDATE ... SET sort_order=1 WHERE id=2
     │                            │                              │                          │   ├─ UPDATE ... SET sort_order=2 WHERE id=1
     │                            │                              │                          │   └─ SELECT ... ORDER BY sort_order
     │                            │◄── 200: ProcessStep[] ──────│◄── steps[] ─────────────│
     │◄── 200: [{ id:2,... },    │                              │                          │
     │          { id:1,... }]    │                              │                          │
```

### 11.2 Admin: Update Section Header

```
┌──────────┐          ┌─────────────────────────────────┐          ┌───────────────┐          ┌──────────────┐
│ Frontend │          │  PUT /api/admin/home-page-content │          │  Controller   │          │   Service    │
└────┬─────┘          └───────────────┬─────────────────┘          └──────┬────────┘          └──────┬───────┘
     │                                 │                                  │                          │
     │── PUT /home-page-content ───────►                                  │                          │
     │   { process_label_en: "...",    │── ValidationPipe ───────────────►│                          │
     │     process_heading_ar: "...",  │                                  │── update(dto) ──────────►│
     │     process_description_en:     │                                  │                          │── findOne(id=1)
     │       "..." }                   │                                  │                          │── Object.assign(entity, dto)
     │                                 │                                  │                          │── repository.save(entity)
     │                                 │◄── 200: HomePageContent ────────│◄── entity ───────────────│
     │◄── 200: { process_label_en,    │                                  │                          │
     │          process_heading_ar,    │                                  │                          │
     │          processSteps: [...],   │                                  │                          │
     │          ... (full row) }       │                                  │                          │
```

### 11.3 Public: Fetch Process Section by Locale

```
┌──────────┐          ┌──────────────────────────────────────┐          ┌───────────────┐          ┌──────────────┐
│ Frontend │          │  GET /api/home-page-content?locale=en │          │  Controller   │          │   Service    │
└────┬─────┘          └─────────────────┬────────────────────┘          └──────┬────────┘          └──────┬───────┘
     │                                   │                                    │                          │
     │── GET ?locale=en ────────────────►│                                    │                          │
     │                                   │── LocaleQueryDto ────────────────►│                          │
     │                                   │                                    │── findPublic('en') ────►│
     │                                   │                                    │                          │── findOne(id=1)
     │                                   │                                    │                          │   (with processSteps
     │                                   │                                    │                          │    ordered by sort_order)
     │                                   │                                    │                          │
     │                                   │                                    │                          │── Map process section:
     │                                   │                                    │                          │   label = entity.process_label_en
     │                                   │                                    │                          │   heading = entity.process_heading_en
     │                                   │                                    │                          │   items = entity.processSteps.map(s => ({
     │                                   │                                    │                          │     step_number: s.step_number,
     │                                   │                                    │                          │     title: s.title_en,
     │                                   │                                    │                          │     desc: s.desc_en
     │                                   │                                    │                          │   }))
     │                                   │◄── 200: HomePageContentResponseDto│◄── dto ─────────────────│
     │◄── 200: { process: { label,      │                                    │                          │
     │            heading, description,  │                                    │                          │
     │            items: [{ ... }, ...]  │                                    │                          │
     │          }, ... other sections }  │                                    │                          │
```

---

## 12. Request/Response Examples (Full)

### 12.1 Create Process Step

**Request**:
```
POST /api/admin/process-steps
Authorization: Bearer <token>
Content-Type: application/json

{
  "step_number": 1,
  "title_en": "Submit Application",
  "title_ar": "تقديم الطلب",
  "desc_en": "Fill out the online application form with your personal and business details",
  "desc_ar": "املأ نموذج الطلب عبر الإنترنت ببياناتك الشخصية وبيانات عملك",
  "sort_order": 0,
  "homePageContentId": 1
}
```

**Response** (201):
```json
{
  "id": 1,
  "step_number": 1,
  "title_en": "Submit Application",
  "title_ar": "تقديم الطلب",
  "desc_en": "Fill out the online application form with your personal and business details",
  "desc_ar": "املأ نموذج الطلب عبر الإنترنت ببياناتك الشخصية وبيانات عملك",
  "sort_order": 0,
  "homePageContentId": 1,
  "createdAt": "2026-05-16T10:00:00.000Z",
  "updatedAt": "2026-05-16T10:00:00.000Z"
}
```

### 12.2 Update Section Header

**Request**:
```
PUT /api/admin/home-page-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "process_label_en": "Process",
  "process_label_ar": "العملية",
  "process_heading_en": "How It Works",
  "process_heading_ar": "كيف يعمل",
  "process_description_en": "Follow these simple steps to get started with your licensing journey",
  "process_description_ar": "اتبع هذه الخطوات البسيطة للبدء في رحلة الترخيص الخاصة بك"
}
```

**Response** (200): Full `HomePageContent` entity (truncated to process fields):
```json
{
  "id": 1,
  "...": "...",
  "process_label_en": "Process",
  "process_label_ar": "العملية",
  "process_heading_en": "How It Works",
  "process_heading_ar": "كيف يعمل",
  "process_description_en": "Follow these simple steps to get started with your licensing journey",
  "process_description_ar": "اتبع هذه الخطوات البسيطة للبدء في رحلة الترخيص الخاصة بك",
  "processSteps": [
    {
      "id": 1,
      "step_number": 1,
      "title_en": "Submit Application",
      "title_ar": "تقديم الطلب",
      "desc_en": "...",
      "desc_ar": "...",
      "sort_order": 1,
      "homePageContentId": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "...": "..."
}
```

### 12.3 Public Fetch (EN)

**Request**:
```
GET /api/home-page-content?locale=en
```

**Response** (200):
```json
{
  "hero": { "...": "..." },
  "stats": { "...": "..." },
  "licensing": { "...": "..." },
  "process": {
    "label": "Process",
    "heading": "How It Works",
    "description": "Follow these simple steps to get started with your licensing journey",
    "items": [
      {
        "step_number": 1,
        "title": "Submit Application",
        "desc": "Fill out the online application form with your personal and business details"
      },
      {
        "step_number": 2,
        "title": "Document Review",
        "desc": "Our team reviews your submitted documents for completeness"
      },
      {
        "step_number": 3,
        "title": "Approval & Issuance",
        "desc": "Receive your license and certification digitally"
      }
    ]
  },
  "services_header": { "...": "..." },
  "countries_header": { "...": "..." }
}
```

### 12.4 Public Fetch (AR)

**Request**:
```
GET /api/home-page-content?locale=ar
```

**Response** (200):
```json
{
  "hero": { "...": "..." },
  "stats": { "...": "..." },
  "licensing": { "...": "..." },
  "process": {
    "label": "العملية",
    "heading": "كيف يعمل",
    "description": "اتبع هذه الخطوات البسيطة للبدء في رحلة الترخيص الخاصة بك",
    "items": [
      {
        "step_number": 1,
        "title": "تقديم الطلب",
        "desc": "املأ نموذج الطلب عبر الإنترنت ببياناتك الشخصية وبيانات عملك"
      },
      {
        "step_number": 2,
        "title": "مراجعة المستندات",
        "desc": "يقوم فريقنا بمراجعة مستنداتك المقدمة للتأكد من اكتمالها"
      },
      {
        "step_number": 3,
        "title": "الموافقة والإصدار",
        "desc": "احصل على الترخيص والشهادة الخاصة بك إلكترونياً"
      }
    ]
  },
  "services_header": { "...": "..." },
  "countries_header": { "...": "..." }
}
```

---

## 13. Open Questions / TODOs

| # | Question | Impact |
|---|---|---|
| 1 | Should `title_en/ar` and `desc_en/ar` support limited HTML (like hero fields)? | Currently plain text — if rich text is needed, add `@Transform(sanitizeHtml)` to process step DTOs |
| 2 | Should there be a minimum number of steps? (e.g. at least 2) | UX — allows empty state currently |
| 3 | Should bulk reorder accept `{ orderedItems: [{id, sort_order}] }` instead of just `{ ids: [...] }`? | More explicit but less ergonomic |
| 4 | Should `step_number` be auto-assigned based on position in `items` array? | Currently manually set — could auto-assign on save |
| 5 | Should the frontend cache the public response? | Content changes infrequently — recommended TTL 5 min |
| 6 | Should there be a dedicated endpoint for just the process section? | Currently bundled in full home page content response |

---

## 14. Summary of Endpoints

| Method | Endpoint | Auth | Body / Params | Response |
|---|---|---|---|---|
| `GET` | `/api/home-page-content?locale=en\|ar` | Public | Query: `locale` | `HomePageContentResponseDto` (includes `process`) |
| `GET` | `/api/admin/home-page-content` | Admin | — | `HomePageContent` entity (full row + relations) |
| `PUT` | `/api/admin/home-page-content` | Admin | `UpdateHomePageContentDto` | `HomePageContent` entity |
| `GET` | `/api/admin/process-steps` | Admin | — | `ProcessStep[]` |
| `POST` | `/api/admin/process-steps` | Admin | `CreateProcessStepDto` | `ProcessStep` (201) |
| `PUT` | `/api/admin/process-steps/:id` | Admin | `UpdateProcessStepDto` | `ProcessStep` |
| `DELETE` | `/api/admin/process-steps/:id` | Admin | — | `204 No Content` |
| `PATCH` | `/api/admin/process-steps/:id/reorder` | Admin | `{ sort_order: number }` | `ProcessStep` |
| `PATCH` | `/api/admin/process-steps/reorder` | Admin | `{ ids: number[] }` | `ProcessStep[]` |

---

## 15. Data Flow Summary

```
                         ┌─────────────────────────────────────┐
                         │         Frontend (Admin)            │
                         │  ┌─────────────────────────────┐    │
                         │  │  Process Section Manager    │    │
                         │  │  ┌─────────────────────┐   │    │
                         │  │  │ Header Fields       │   │    │
                         │  │  │ [label_en/ar]       │   │    │
                         │  │  │ [heading_en/ar]     │───┼────┼─── PUT /api/admin/home-page-content
                         │  │  │ [description_en/ar] │   │    │
                         │  │  └─────────────────────┘   │    │
                         │  │  ┌─────────────────────┐   │    │
                         │  │  │ Steps List          │   │    │
                         │  │  │ [create] [edit] [x] │───┼────┼─── POST/PUT/DELETE /api/admin/process-steps
                         │  │  │ [↕ drag to reorder] │───┼────┼─── PATCH /api/admin/process-steps/reorder
                         │  │  └─────────────────────┘   │    │
                         │  └─────────────────────────────┘    │
                         └────────────┬────────────────────────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   ▼                  ▼                   ▼
          ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
          │  NestJS API    │ │  NestJS API    │ │  NestJS API      │
          │  (Admin)       │ │  (Admin)       │ │  (Public)        │
          │  home-page-    │ │  process-steps │ │  home-page-      │
          │  content.ctrl  │ │  .ctrl         │ │  content.ctrl    │
          └───────┬────────┘ └───────┬────────┘ └───────┬──────────┘
                  │                  │                   │
          ┌───────▼──────────────────▼───────────────────▼──────────┐
          │               PostgreSQL (home_page_content +          │
          │                process_steps tables)                    │
          └─────────────────────────────────────────────────────────┘
                                      │
                                      │
                         ┌────────────▼────────────────────────┐
                         │         Frontend (Public)           │
                         │  ┌─────────────────────────────┐    │
                         │  │  Home Page                  │    │
                         │  │  ┌─────────────────────┐   │    │
                         │  │  │ Process Section     │   │    │
                         │  │  │ [label]             │   │    │
                         │  │  │ [heading]           │   │    │
                         │  │  │ [description]       │   │    │
                         │  │  │ [Step 1 ○○○]        │   │    │
                         │  │  │ [Step 2 ○○○]        │   │    │
                         │  │  │ [Step 3 ○○○]        │   │    │
                         │  │  └─────────────────────┘   │    │
                         │  └─────────────────────────────┘    │
                         └─────────────────────────────────────┘
```

---

## 16. Quick Integration Reference

### Frontend (React) — Minimal Integration Example

```tsx
// ── Admin: Fetch steps ─────────────────────────────────────
const { data: steps } = useQuery({
  queryKey: ['admin', 'process-steps'],
  queryFn: () => fetch('/api/admin/process-steps', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json())
});

// ── Admin: Create step ─────────────────────────────────────
const createStep = useMutation({
  mutationFn: (step) => fetch('/api/admin/process-steps', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(step)
  }).then(res => res.json())
});

// ── Admin: Bulk reorder ────────────────────────────────────
const bulkReorder = useMutation({
  mutationFn: (orderedIds) => fetch('/api/admin/process-steps/reorder', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: orderedIds })
  }).then(res => res.json())
});

// ── Admin: Update section header ───────────────────────────
const updateHeader = useMutation({
  mutationFn: (data) => fetch('/api/admin/home-page-content', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
});

// ── Public: Fetch process section ──────────────────────────
const { data: pageContent } = useQuery({
  queryKey: ['home-page', locale],
  queryFn: () => fetch(`/api/home-page-content?locale=${locale}`)
    .then(res => res.json())
});

const processSection = pageContent?.process;
// processSection.label
// processSection.heading
// processSection.description
// processSection.items[].step_number
// processSection.items[].title
// processSection.items[].desc
```
