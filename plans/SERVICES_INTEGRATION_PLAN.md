# Services Integration Plan

> **Scope**: Full CRUD + toggle + reorder + bulk reorder + public consumption for the `Service` entity.
> **Date**: 2026-05-16
> **Status**: Draft

---

## 1. Overview

Services are independent cards displayed on the home page. Unlike hero content, services are a **multi-row table** with full CRUD, ordering, and active/inactive toggling. They are managed by admins and consumed publicly (active-only, locale-filtered).

| Surface | Endpoint | Auth | Purpose |
|---|---|---|---|
| **Admin** | `GET /api/admin/services` | JWT + Admin | Paginated list |
| **Admin** | `POST /api/admin/services` | JWT + Admin | Create |
| **Admin** | `GET /api/admin/services/:id` | JWT + Admin | Get single *(via list or direct)* |
| **Admin** | `PUT /api/admin/services/:id` | JWT + Admin | Update |
| **Admin** | `DELETE /api/admin/services/:id` | JWT + Admin | Delete |
| **Admin** | `PATCH /api/admin/services/:id/toggle` | JWT + Admin | Toggle `is_active` |
| **Admin** | `PATCH /api/admin/services/:id/reorder` | JWT + Admin | Reorder single |
| **Admin** | `PATCH /api/admin/services/reorder` | JWT + Admin | Bulk reorder |
| **Public** | `GET /api/services?locale=en\|ar` | None | Active services, locale-filtered |

---

## 2. Data Model

### 2.1 Database Columns (`services` table)

| Column | Type | Nullable | Default | Max Length | Description |
|---|---|---|---|---|---|
| `id` | `int` (PK, auto) | no | — | — | Auto-increment primary key |
| `icon` | `varchar` | yes | null | 100 | Icon identifier/class name |
| `title_en` | `varchar` | yes | null | 200 | EN title |
| `title_ar` | `varchar` | yes | null | 200 | AR title |
| `desc_en` | `text` | yes | null | 2000 | EN description |
| `desc_ar` | `text` | yes | null | 2000 | AR description |
| `button_label_en` | `varchar` | yes | null | 100 | EN button label |
| `button_label_ar` | `varchar` | yes | null | 100 | AR button label |
| `metric_value` | `varchar` | yes | null | 100 | Metric number (e.g. "500") |
| `metric_suffix` | `varchar` | yes | null | 20 | Metric suffix (e.g. "+") |
| `metric_label_en` | `varchar` | yes | null | 200 | EN metric label |
| `metric_label_ar` | `varchar` | yes | null | 200 | AR metric label |
| `is_active` | `boolean` | no | `true` | — | Visibility toggle |
| `sort_order` | `int` | no | `0` | — | Display order (ASC) |
| `createdAt` | `timestamp` | no | NOW() | — | Auto-set on create |
| `updatedAt` | `timestamp` | no | NOW() | — | Auto-set on update |

### 2.2 Key Design Decisions

- **No HTML sanitization**: Service fields are plain text — no `@Transform()` with `sanitizeHtml()`. The frontend should not render them as HTML.
- **Independent entity**: No foreign key to `home_page_content`. Services are managed separately.
- **Soft delete via toggle**: `is_active` controls visibility; `DELETE` is a hard delete.
- **Sort order**: Default `0`. Lower values appear first. Gaps are allowed.

---

## 3. Admin CRUD Operations

### 3.1 CREATE — `POST /api/admin/services`

**Request Body**: `CreateServiceDto` — all fields optional.

**Integration Logic**:

```
Frontend → POST /api/admin/services
  │
  ├─ Body: { title_en: "Service A", desc_en: "...", icon: "icon-name", is_active: true, sort_order: 0 }
  │
  ├─ ValidationPipe (global)
  │   ├─ whitelist: true          → strips unknown properties
  │   ├─ forbidNonWhitelisted: true → 400 if unknown property sent
  │   └─ transform: true          → runs @Type(() => Number) on numeric fields
  │
  ├─ class-validator checks
  │   ├─ @IsString() + @MaxLength(N) on all text fields
  │   ├─ @IsBoolean() on is_active
  │   ├─ @Type(() => Number) + @IsInt() + @Min(0) on sort_order
  │   └─ All fields @IsOptional() → empty body {} is valid
  │
  ├─ ServicesService.create(dto)
  │   ├─ repository.create(dto)   → creates managed entity instance
  │   │   ├─ is_active defaults to true (if not provided)
  │   │   └─ sort_order defaults to 0 (if not provided)
  │   └─ repository.save(entity)  → INSERT + returns saved entity with id, createdAt, updatedAt
  │
  └─ Response: Service entity (201)
       { id: 5, icon: "icon-name", title_en: "Service A", ..., is_active: true, sort_order: 0, createdAt: "...", updatedAt: "..." }
```

**Key behaviors**:
- **All fields optional**: An empty `{}` body creates a service with all nulls, `is_active: true`, `sort_order: 0`.
- **Auto-generated ID**: `PrimaryGeneratedColumn()` assigns the next auto-increment value.
- **Auto timestamps**: `createdAt` and `updatedAt` are set by TypeORM on insert.
- **No uniqueness constraint**: Duplicate titles are allowed.

### 3.2 READ (List) — `GET /api/admin/services?page=1&limit=20`

**Query Params**: `PaginationQueryDto`

| Param | Type | Required | Default | Validation |
|---|---|---|---|---|
| `page` | number | No | 1 | `@IsInt()`, `@Min(1)` |
| `limit` | number | No | 20 | `@IsInt()`, `@Min(1)` |

**Integration Logic**:

```
Frontend → GET /api/admin/services?page=1&limit=10
  │
  ├─ PaginationQueryDto validation
  │
  ├─ ServicesService.findAll({ page: 1, limit: 10 })
  │   ├─ skip = (1 - 1) * 10 = 0
  │   ├─ findAndCount({ order: { sort_order: 'ASC', id: 'ASC' }, skip: 0, take: 10 })
  │   │   ├─ Returns [data[10], total(45)]
  │   └─ Returns PaginatedResponseDto<Service>
  │
  └─ Response (200):
       {
         "data": [ { id: 1, ... }, { id: 2, ... }, ... ],
         "meta": { "total": 45, "page": 1, "limit": 10, "totalPages": 5 }
       }
```

**Key behaviors**:
- **Ordering**: Always sorted by `sort_order ASC`, then `id ASC` as tiebreaker.
- **Includes inactive**: Admin list shows ALL services regardless of `is_active`.
- **Page 1-indexed**: `page=1` is the first page.
- **Empty result**: Returns `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`.

### 3.3 READ (Single) — Internal `findOne(id)`

**Note**: There is no dedicated `GET /api/admin/services/:id` endpoint. The single-entity lookup is used internally by `update`, `remove`, `toggle`, and `reorder`. If a direct GET is needed, it can be added.

**Integration Logic**:

```
ServicesService.findOne(id)
  ├─ repository.findOne({ where: { id } })
  ├─ if !entity → throw NotFoundException(`Service with ID ${id} not found`)
  └─ return entity
```

### 3.4 UPDATE — `PUT /api/admin/services/:id`

**Request Body**: `UpdateServiceDto` — identical to `CreateServiceDto`, all fields optional.

**Integration Logic**:

```
Frontend → PUT /api/admin/services/5
  │
  ├─ Param: id = 5 (ParseIntPipe → 400 if not integer)
  │
  ├─ Body: { title_en: "Updated Title", desc_ar: "وصف جديد" }
  │
  ├─ ValidationPipe → same rules as CreateServiceDto
  │
  ├─ ServicesService.update(5, dto)
  │   ├─ findOne(5) → loads entity (throws 404 if missing)
  │   ├─ Object.assign(entity, dto) → merges only provided fields
  │   │   ├─ title_en → "Updated Title"
  │   │   ├─ desc_ar → "وصف جديد"
  │   │   └─ all other fields → unchanged
  │   └─ repository.save(entity) → UPDATE + returns updated entity
  │       └─ updatedAt auto-updated by TypeORM
  │
  └─ Response: Service entity (200)
```

**Key behaviors**:
- **Partial update**: Only fields in the body are modified. Omitted fields retain existing values.
- **404 on missing**: Throws `NotFoundException` if `id` doesn't exist.
- **`id` cannot be changed**: `id` is not in the DTO.
- **`createdAt` is immutable**: Only `updatedAt` changes on update.

### 3.5 DELETE — `DELETE /api/admin/services/:id`

**Integration Logic**:

```
Frontend → DELETE /api/admin/services/5
  │
  ├─ Param: id = 5 (ParseIntPipe)
  │
  ├─ ServicesService.remove(5)
  │   ├─ repository.delete(5) → DELETE FROM services WHERE id = 5
  │   ├─ if result.affected === 0 → throw NotFoundException
  │   └─ return void
  │
  └─ Response: 200 (empty body or { message: "Service deleted" })
```

**Key behaviors**:
- **Hard delete**: Row is permanently removed from the database.
- **No cascade**: Services have no child relations — safe to delete.
- **Idempotent concern**: Deleting the same ID twice returns 404 on the second call.
- **Sort order gap**: Deleting a service leaves a gap in `sort_order` values. Use bulk reorder to close gaps.

### 3.6 TOGGLE ACTIVE — `PATCH /api/admin/services/:id/toggle`

**Integration Logic**:

```
Frontend → PATCH /api/admin/services/5/toggle
  │
  ├─ Param: id = 5 (ParseIntPipe)
  │
  ├─ ServicesService.toggleActive(5)
  │   ├─ queryBuilder.update(Service)
  │   │   .set({ is_active: () => 'NOT is_active' })  ← SQL-level toggle
  │   │   .where('id = :id', { id: 5 })
  │   │   .execute()                                   ← single UPDATE query
  │   └─ findOne(5) → returns updated entity
  │
  └─ Response: Service entity (200) with is_active flipped
```

**Key behaviors**:
- **SQL-level toggle**: Uses `NOT is_active` in SQL — no race condition from read-then-write.
- **No body required**: The endpoint toggles regardless of request body.
- **Public visibility**: When `is_active` becomes `false`, the service disappears from the public API immediately.
- **Returns updated entity**: Frontend gets the new `is_active` value in the response.

### 3.7 REORDER (Single) — `PATCH /api/admin/services/:id/reorder`

**Request Body**: `ReorderDto` — `{ sort_order: number }`

**Integration Logic**:

```
Frontend → PATCH /api/admin/services/5/reorder
  │
  ├─ Param: id = 5 (ParseIntPipe)
  │
  ├─ Body: { sort_order: 3 }
  │
  ├─ ValidationPipe
  │   ├─ @Type(() => Number) → transforms string "3" to number 3
  │   ├─ @IsInt() → must be integer
  │   └─ @Min(0) → must be ≥ 0
  │
  ├─ ServicesService.reorder(5, 3)
  │   ├─ repository.update(5, { sort_order: 3 }) → UPDATE services SET sort_order = 3 WHERE id = 5
  │   └─ findOne(5) → returns updated entity
  │
  └─ Response: Service entity (200) with new sort_order
```

**Key behaviors**:
- **No automatic shifting**: Setting `sort_order: 3` does NOT shift other services. Two services can share the same `sort_order`. The tiebreaker is `id ASC`.
- **Default fallback**: If `sort_order` is omitted from body, defaults to `0` (controller: `dto.sort_order ?? 0`).
- **Gaps allowed**: `sort_order` values don't need to be sequential.

### 3.8 BULK REORDER — `PATCH /api/admin/services/reorder`

**Request Body**: `BulkReorderDto` — `{ ids: number[] }`

**Integration Logic**:

```
Frontend → PATCH /api/admin/services/reorder
  │
  ├─ Body: { ids: [3, 1, 5, 2, 4] }
  │   └─ Array order determines sort_order: 3→1, 1→2, 5→3, 2→4, 4→5
  │
  ├─ ValidationPipe
  │   ├─ @Type(() => Number, { each: true }) → transforms each element
  │   └─ @IsInt({ each: true }) → each must be integer
  │
  ├─ ServicesService.bulkReorder([3, 1, 5, 2, 4])
  │   ├─ if !ids.length → throw BadRequestException('ids array must not be empty')
  │   │
  │   ├─ dataSource.transaction(async (manager) => {
  │   │   ├─ Promise.all(
  │   │   │   ids.map((id, i) =>
  │   │   │     manager.update(Service, id, { sort_order: i + 1 })
  │   │   │   )
  │   │   │ )  ← parallel UPDATEs within transaction
  │   │   │     id=3 → sort_order=1
  │   │   │     id=1 → sort_order=2
  │   │   │     id=5 → sort_order=3
  │   │   │     id=2 → sort_order=4
  │   │   │     id=4 → sort_order=5
  │   │   │
  │   │   └─ manager.find(Service, { order: { sort_order: 'ASC', id: 'ASC' } })
  │   │       ← returns all services in new order
  │   │ })
  │   └─ if any update fails → transaction ROLLBACK
  │
  └─ Response: Service[] (200) — all services in new sorted order
```

**Key behaviors**:
- **Transaction atomicity**: All updates succeed or all fail. No partial reorders.
- **1-indexed assignment**: Position 0 → `sort_order: 1`, position 1 → `sort_order: 2`, etc.
- **Missing IDs**: If an ID in the array doesn't exist, `manager.update()` returns `affected: 0` but does NOT throw. The transaction still commits. The missing ID is silently skipped.
- **Returns all services**: Response includes the full service list, not just the reordered ones.
- **Parallel execution**: `Promise.all` fires all updates concurrently within the transaction.

---

## 4. Public Integration

### 4.1 Fetch Active Services — `GET /api/services?locale=en`

**Query Params**: `LocaleQueryDto`

| Param | Type | Required | Default |
|---|---|---|---|
| `locale` | `en` \| `ar` | No | `en` |

**Integration Logic**:

```
Frontend → GET /api/services?locale=en
  │
  ├─ LocaleQueryDto validation
  │
  ├─ PublicController.getServices({ locale: 'en' })
  │   ├─ servicesService.findActive()
  │   │   ├─ repository.find({
  │   │   │   where: { is_active: true },
  │   │   │   order: { sort_order: 'ASC', id: 'ASC' }
  │   │   │ })
  │   │   └─ returns Service[] (active only)
  │   │
  │   └─ .map(s => ({
  │       id: s.id,
  │       icon: s.icon,
  │       title: locale === 'en' ? s.title_en : s.title_ar,
  │       desc: locale === 'en' ? s.desc_en : s.desc_ar,
  │       button_label: locale === 'en' ? s.button_label_en : s.button_label_ar,
  │       metric_value: s.metric_value,
  │       metric_suffix: s.metric_suffix,
  │       metric_label: locale === 'en' ? s.metric_label_en : s.metric_label_ar,
  │     }))
  │
  └─ Response: PublicServiceResponseDto[] (200)
       [
         {
           "id": 1,
           "icon": "icon-name",
           "title": "Service A",
           "desc": "Description here",
           "button_label": "Learn More",
           "metric_value": "500",
           "metric_suffix": "+",
           "metric_label": "Projects"
         },
         ...
       ]
```

**Key behaviors**:
- **Active only**: `is_active: true` filter — inactive services are excluded.
- **Sorted**: `sort_order ASC`, `id ASC` tiebreaker.
- **Locale mapping**: Each service returns a single `title`, `desc`, `button_label`, `metric_label` based on the requested locale.
- **No pagination**: Returns all active services (expected to be a small set, typically < 20).
- **Null fields**: Missing locale fields appear as `null`/`undefined`. Frontend must handle gracefully.

---

## 5. DTO Validation Summary

### 5.1 CreateServiceDto / UpdateServiceDto

| Field | Validators | Max Length | Notes |
|---|---|---|---|
| `icon` | `@IsOptional()`, `@IsString()` | 100 | Icon class/identifier |
| `title_en` | `@IsOptional()`, `@IsString()` | 200 | |
| `title_ar` | `@IsOptional()`, `@IsString()` | 200 | |
| `desc_en` | `@IsOptional()`, `@IsString()` | 2000 | |
| `desc_ar` | `@IsOptional()`, `@IsString()` | 2000 | |
| `button_label_en` | `@IsOptional()`, `@IsString()` | 100 | |
| `button_label_ar` | `@IsOptional()`, `@IsString()` | 100 | |
| `metric_value` | `@IsOptional()`, `@IsString()` | 100 | e.g. "500" |
| `metric_suffix` | `@IsOptional()`, `@IsString()` | 20 | e.g. "+" |
| `metric_label_en` | `@IsOptional()`, `@IsString()` | 200 | |
| `metric_label_ar` | `@IsOptional()`, `@IsString()` | 200 | |
| `is_active` | `@IsOptional()`, `@IsBoolean()` | — | Default: `true` |
| `sort_order` | `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)` | — | Default: `0` |

### 5.2 ReorderDto

| Field | Validators | Notes |
|---|---|---|
| `sort_order` | `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)` | Defaults to `0` if omitted |

### 5.3 BulkReorderDto

| Field | Validators | Notes |
|---|---|---|
| `ids` | `@IsOptional()`, `@Type(() => Number, { each: true })`, `@IsInt({ each: true })` | Empty array → 400 |

---

## 6. Error Handling Matrix

| Scenario | HTTP Status | Response Body | Frontend Action |
|---|---|---|---|
| Service not found (update/delete/toggle/reorder) | 404 | `{ "message": "Service with ID X not found", "error": "Not Found", "statusCode": 404 }` | Remove from list / show not found |
| Validation failure (bad input) | 400 | `{ "message": ["title_en must not be longer than 200 characters"], "error": "Bad Request", "statusCode": 400 }` | Display field-level errors |
| sort_order not an integer or < 0 | 400 | `{ "message": ["sort_order must be an integer number", "sort_order must not be less than 0"] }` | Show numeric validation error |
| Bulk reorder with empty array | 400 | `{ "message": "ids array must not be empty", "error": "Bad Request", "statusCode": 400 }` | Require at least one item |
| Unauthorized (no token) | 401 | `{ "message": "Unauthorized", "statusCode": 401 }` | Redirect to login |
| Forbidden (non-admin) | 403 | `{ "message": "Forbidden resource", "statusCode": 403 }` | Show access denied |
| Invalid page/limit (non-integer, < 1) | 400 | `{ "message": ["page must be an integer number", "page must not be less than 1"] }` | Reset to defaults |
| Non-integer :id param | 400 | `{ "message": "ID must be an integer", "statusCode": 400 }` | ParseIntPipe auto-rejects |

---

## 7. Security Notes

| Concern | Mitigation |
|---|---|
| XSS | Service fields are plain text — no HTML sanitization needed. Frontend should NOT use `dangerouslySetInnerHTML` or equivalent. |
| Authorization | All admin endpoints protected by `JwtAuthGuard` + `RolesGuard` (admin only). |
| Input validation | `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` — rejects unknown fields. |
| SQL injection | TypeORM parameterized queries throughout — no raw SQL string interpolation. |
| Bulk reorder transaction | `DataSource.transaction()` ensures atomicity — partial failures roll back. |
| Rate limiting | Global throttler applied; no specific throttle on services endpoints (consider adding for high-traffic scenarios). |

---

## 8. Performance Considerations

| Aspect | Detail |
|---|---|
| Pagination | `findAndCount` runs 2 queries (SELECT + COUNT) — efficient for large datasets |
| Index recommendation | Add index on `(is_active, sort_order)` for public `findActive()` query |
| Bulk reorder | `Promise.all` with parallel `UPDATE` within transaction — O(n) queries, n = ids.length |
| Public endpoint | No pagination — expects small dataset (< 20 services). Consider adding `LIMIT` if growth is expected. |
| Caching opportunity | Public services change infrequently — `CacheInterceptor` (TTL 300s) recommended |
| N+1 risk | None — services have no relations that are eagerly loaded |

---

## 9. Frontend Integration Checklist

### 9.1 Admin Dashboard — Services Manager

| Task | Details |
|---|---|
| List view | `GET /api/admin/services?page=1&limit=20` → table with pagination |
| Create | `POST /api/admin/services` → modal/form with all fields |
| Edit | `PUT /api/admin/services/:id` → pre-populated form |
| Delete | `DELETE /api/admin/services/:id` → confirmation dialog |
| Toggle active | `PATCH /api/admin/services/:id/toggle` → switch/toggle UI element |
| Single reorder | `PATCH /api/admin/services/:id/reorder` → drag-and-drop or number input |
| Bulk reorder | `PATCH /api/admin/services/reorder` → drag-and-drop list, send ordered IDs on drop |
| Active filter | Client-side filter by `is_active` in list view |
| Sort indicator | Show `sort_order` column in admin table |
| Error handling | 400 (validation), 401/403 (auth), 404 (not found) |
| Loading states | Disable form/buttons during mutations |
| Optimistic updates | For toggle, update UI immediately then reconcile with server response |

### 9.2 Public Site — Services Section

| Task | Details |
|---|---|
| Fetch on mount | `GET /api/services?locale={currentLocale}` |
| Locale switching | Re-fetch on locale change (`en` ↔ `ar`) |
| RTL support | When `locale === 'ar'`, apply `dir="rtl"` |
| Card rendering | Map each service to a card component |
| Metric display | Combine `metric_value` + `metric_suffix` (e.g. "500+") |
| Button rendering | Use `button_label` for CTA text |
| Empty state | Show placeholder when no active services exist |
| Caching | Consider caching response (TTL ~5 min) |

---

## 10. File Map

| File | Role |
|---|---|
| `src/services/schema/service.schema.ts` | Entity definition — all columns |
| `src/services/dto/service.dto.ts` | `CreateServiceDto`, `UpdateServiceDto` — validation |
| `src/services/dto/public-service-response.dto.ts` | `PublicServiceResponseDto` — public response shape |
| `src/services/dto/index.ts` | Barrel exports |
| `src/services/services.controller.ts` | Admin endpoints (CRUD + toggle + reorder + bulk reorder) |
| `src/services/services.service.ts` | Business logic (findAll, findOne, create, update, remove, toggleActive, reorder, bulkReorder, findActive) |
| `src/services/services.module.ts` | Module registration |
| `src/public/public.controller.ts` | Public GET endpoint (active + locale-filtered) |
| `src/common/dto/pagination-query.dto.ts` | `PaginationQueryDto` — list pagination |
| `src/common/dto/reorder.dto.ts` | `ReorderDto`, `BulkReorderDto` — reorder requests |
| `src/common/dto/paginated-response.dto.ts` | `PaginatedResponseDto<T>` — paginated response wrapper |

---

## 11. Integration Sequence Diagrams

### 11.1 CREATE

```
┌──────────┐     ┌──────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  POST /api/admin/services    │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                             │                 │
     │── { title_en, desc_en } ─►│                             │                 │
     │                          │── ValidationPipe ───────────►│                 │
     │                          │                             │── create(dto) ──►│
     │                          │                             │                 │
     │                          │                             │── repository.create(dto)
     │                          │                             │── repository.save(entity)
     │                          │                             │                 │
     │◄── Service entity (201) ──│◄── entity ─────────────────│◄── saved entity │
```

### 11.2 UPDATE

```
┌──────────┐     ┌──────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PUT /api/admin/services/:id     │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                 │                 │
     │── PUT /5 { title_en: ".." } ──────────────────────────────►│                 │
     │                          │── ParseIntPipe(id=5) ──────────►│                 │
     │                          │── ValidationPipe ──────────────►│                 │
     │                          │                                 │── update(5, dto)─►│
     │                          │                                 │                 │
     │                          │                                 │── findOne(5) ────►│ (404 if missing)
     │                          │                                 │◄── entity ───────│
     │                          │                                 │                 │
     │                          │                                 │── Object.assign(entity, dto)
     │                          │                                 │── repository.save(entity)
     │                          │                                 │                 │
     │◄── Service entity (200) ──│◄── entity ─────────────────────│◄── saved entity │
```

### 11.3 DELETE

```
┌──────────┐     ┌──────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  DELETE /api/admin/services/:id  │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                 │                 │
     │── DELETE /5 ──────────────►│                                 │                 │
     │                          │── ParseIntPipe(id=5) ──────────►│                 │
     │                          │                                 │── remove(5) ────►│
     │                          │                                 │                 │
     │                          │                                 │── repository.delete(5)
     │                          │                                 │── affected === 0? → 404
     │                          │                                 │                 │
     │◄── 200 (void) ────────────│◄── void ───────────────────────│◄── void ────────│
```

### 11.4 TOGGLE

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PATCH /api/admin/services/:id/toggle│     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── PATCH /5/toggle ────────►│                                     │                 │
     │                          │── ParseIntPipe(id=5) ──────────────►│                 │
     │                          │                                     │── toggleActive(5)─►│
     │                          │                                     │                 │
     │                          │                                     │── queryBuilder  │
     │                          │                                     │   .set({ is_active: () => 'NOT is_active' })
     │                          │                                     │   .execute()    │
     │                          │                                     │── findOne(5) ───►│
     │                          │                                     │◄── entity ──────│
     │                          │                                     │                 │
     │◄── Service (is_active flipped) ◄── entity ─────────────────────│◄── entity ──────│
```

### 11.5 BULK REORDER

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PATCH /api/admin/services/reorder   │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── { ids: [3,1,5,2,4] } ──►│                                     │                 │
     │                          │── ValidationPipe ──────────────────►│                 │
     │                          │                                     │── bulkReorder(ids)─►│
     │                          │                                     │                 │
     │                          │                                     │── if !ids.length → 400
     │                          │                                     │                 │
     │                          │                                     │── dataSource.transaction(
     │                          │                                     │     Promise.all(
     │                          │                                     │       ids.map((id,i) =>
     │                          │                                     │         update(id, {sort_order: i+1})
     │                          │                                     │       )
     │                          │                                     │     )
     │                          │                                     │     find(all, order)
     │                          │                                     │   )
     │                          │                                     │                 │
     │◄── Service[] (sorted) ────│◄── Service[] ──────────────────────│◄── Service[] ───│
```

### 11.6 PUBLIC FETCH

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  GET /api/services?locale=en         │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── GET ?locale=en ────────►│                                     │                 │
     │                          │── LocaleQueryDto ──────────────────►│                 │
     │                          │                                     │── getServices(en)─►│
     │                          │                                     │                 │
     │                          │                                     │── findActive() ──►│
     │                          │                                     │   (is_active=true,
     │                          │                                     │    sort_order ASC)
     │                          │                                     │◄── Service[] ───│
     │                          │                                     │                 │
     │                          │                                     │── .map(locale)  │
     │                          │                                     │   (pick en/ar fields)
     │                          │                                     │                 │
     │◄── PublicServiceResponseDto[] ◄── mapped array ───────────────│◄── mapped array │
```

---

## 12. Open Questions / TODOs

| # | Question | Impact |
|---|---|---|
| 1 | Should a dedicated `GET /api/admin/services/:id` endpoint be added? | Currently only accessible via list or as part of mutation responses |
| 2 | Should bulk reorder validate that all IDs exist before committing? | Currently silently skips missing IDs — could lead to unexpected ordering |
| 3 | Should `sort_order` auto-shift on single reorder (like drag-and-drop)? | Currently allows duplicate `sort_order` values — may cause inconsistent display order |
| 4 | Should services support file uploads (custom icons)? | Currently `icon` is a string identifier — no upload endpoint exists |
| 5 | Should the public endpoint support pagination? | Currently returns all active services — could grow over time |
| 6 | Should caching be added to the public endpoint? | Content changes infrequently — cache would reduce DB load |
| 7 | Should soft delete replace hard delete? | Currently `DELETE` is permanent — `is_active` toggle already provides soft-hide |
| 8 | Should there be a `PATCH /api/admin/services/:id/status` endpoint as alias for toggle? | `toggle` is clear but some teams prefer explicit `activate`/`deactivate` |
