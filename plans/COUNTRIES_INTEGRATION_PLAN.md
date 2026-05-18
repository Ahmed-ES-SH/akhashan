# Countries Integration Plan

> **Scope**: Full CRUD + toggle + reorder + bulk reorder + public consumption for the `Country` entity.
> **Date**: 2026-05-16
> **Status**: Draft

---

## 1. Overview

Countries are independent records displayed on the home page (destinations section). Like services, countries are a **multi-row table** with full CRUD, ordering, and active/inactive toggling. They include a `region` enum (`asia` / `africa`) and a `flag_emoji` field.

| Surface | Endpoint | Auth | Purpose |
|---|---|---|---|
| **Admin** | `GET /api/admin/countries` | JWT + Admin | Paginated list |
| **Admin** | `POST /api/admin/countries` | JWT + Admin | Create |
| **Admin** | `PUT /api/admin/countries/:id` | JWT + Admin | Update |
| **Admin** | `DELETE /api/admin/countries/:id` | JWT + Admin | Delete |
| **Admin** | `PATCH /api/admin/countries/:id/toggle` | JWT + Admin | Toggle `is_active` |
| **Admin** | `PATCH /api/admin/countries/:id/reorder` | JWT + Admin | Reorder single |
| **Admin** | `PATCH /api/admin/countries/reorder` | JWT + Admin | Bulk reorder |
| **Public** | `GET /api/countries?locale=en\|ar` | None | Active countries, locale-filtered |

---

## 2. Data Model

### 2.1 Database Columns (`countries` table)

| Column | Type | Nullable | Default | Max Length | Description |
|---|---|---|---|---|---|
| `id` | `int` (PK, auto) | no | — | — | Auto-increment primary key |
| `flag_emoji` | `varchar` | yes | null | 10 | Country flag emoji (e.g. 🇸🇦) |
| `name_en` | `varchar` | yes | null | 200 | EN country name |
| `name_ar` | `varchar` | yes | null | 200 | AR country name |
| `specialty` | `varchar` | yes | null | 500 | Specialty/description text |
| `region` | `enum` | yes | null | — | `asia` or `africa` |
| `workers_label` | `varchar` | yes | null | 200 | Workers count label (e.g. "500+ workers") |
| `is_active` | `boolean` | no | `true` | — | Visibility toggle |
| `sort_order` | `int` | no | `0` | — | Display order (ASC) |
| `createdAt` | `timestamp` | no | NOW() | — | Auto-set on create |
| `updatedAt` | `timestamp` | no | NOW() | — | Auto-set on update |

### 2.2 Region Enum (`CountryRegion`)

| Value | Database Value | Description |
|---|---|---|
| `CountryRegion.ASIA` | `'asia'` | Asian countries |
| `CountryRegion.AFRICA` | `'africa'` | African countries |

**TypeScript**:
```ts
export enum CountryRegion {
  ASIA = 'asia',
  AFRICA = 'africa',
}
```

### 2.3 Key Design Decisions

- **No HTML sanitization**: Country fields are plain text — no `@Transform()` with `sanitizeHtml()`.
- **Independent entity**: No foreign key to `home_page_content`.
- **Soft delete via toggle**: `is_active` controls visibility; `DELETE` is a hard delete.
- **Sort order**: Default `0`. Lower values appear first. Gaps are allowed.
- **Emoji support**: `flag_emoji` is stored as `varchar(10)` — supports multi-byte emoji characters.
- **Region is optional**: A country can exist without a region assignment.

---

## 3. Admin CRUD Operations

### 3.1 CREATE — `POST /api/admin/countries`

**Request Body**: `CreateCountryDto` — all fields optional.

**Integration Logic**:

```
Frontend → POST /api/admin/countries
  │
  ├─ Body: { name_en: "Saudi Arabia", name_ar: "السعودية", flag_emoji: "🇸🇦", region: "asia", is_active: true }
  │
  ├─ ValidationPipe (global)
  │   ├─ whitelist: true          → strips unknown properties
  │   ├─ forbidNonWhitelisted: true → 400 if unknown property sent
  │   └─ transform: true          → runs @Type(() => Number) on numeric fields
  │
  ├─ class-validator checks
  │   ├─ @IsString() + @MaxLength(N) on all text fields
  │   ├─ @IsEnum(CountryRegion) on region → must be 'asia' or 'africa'
  │   ├─ @IsBoolean() on is_active
  │   ├─ @Type(() => Number) + @IsInt() + @Min(0) on sort_order
  │   └─ All fields @IsOptional() → empty body {} is valid
  │
  ├─ CountriesService.create(dto)
  │   ├─ repository.create(dto)   → creates managed entity instance
  │   │   ├─ is_active defaults to true (if not provided)
  │   │   └─ sort_order defaults to 0 (if not provided)
  │   └─ repository.save(entity)  → INSERT + returns saved entity with id, createdAt, updatedAt
  │
  └─ Response: Country entity (201)
       { id: 3, flag_emoji: "🇸🇦", name_en: "Saudi Arabia", name_ar: "السعودية", region: "asia", ..., is_active: true, sort_order: 0, createdAt: "...", updatedAt: "..." }
```

**Key behaviors**:
- **All fields optional**: An empty `{}` body creates a country with all nulls, `is_active: true`, `sort_order: 0`.
- **Auto-generated ID**: `PrimaryGeneratedColumn()` assigns the next auto-increment value.
- **Auto timestamps**: `createdAt` and `updatedAt` are set by TypeORM on insert.
- **Enum validation**: Only `'asia'` or `'africa'` accepted for `region`. Any other value → 400.
- **No uniqueness constraint**: Duplicate country names are allowed.

### 3.2 READ (List) — `GET /api/admin/countries?page=1&limit=20`

**Query Params**: `PaginationQueryDto`

| Param | Type | Required | Default | Validation |
|---|---|---|---|---|
| `page` | number | No | 1 | `@IsInt()`, `@Min(1)` |
| `limit` | number | No | 20 | `@IsInt()`, `@Min(1)` |

**Integration Logic**:

```
Frontend → GET /api/admin/countries?page=1&limit=10
  │
  ├─ PaginationQueryDto validation
  │
  ├─ CountriesService.findAll({ page: 1, limit: 10 })
  │   ├─ skip = (1 - 1) * 10 = 0
  │   ├─ findAndCount({ order: { sort_order: 'ASC', id: 'ASC' }, skip: 0, take: 10 })
  │   │   ├─ Returns [data[10], total(25)]
  │   └─ Returns PaginatedResponseDto<Country>
  │
  └─ Response (200):
       {
         "data": [ { id: 1, ... }, { id: 2, ... }, ... ],
         "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
       }
```

**Key behaviors**:
- **Ordering**: Always sorted by `sort_order ASC`, then `id ASC` as tiebreaker.
- **Includes inactive**: Admin list shows ALL countries regardless of `is_active`.
- **Page 1-indexed**: `page=1` is the first page.
- **Empty result**: Returns `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`.

### 3.3 READ (Single) — Internal `findOne(id)`

**Note**: There is no dedicated `GET /api/admin/countries/:id` endpoint. The single-entity lookup is used internally by `update`, `remove`, `toggle`, and `reorder`.

**Integration Logic**:

```
CountriesService.findOne(id)
  ├─ repository.findOne({ where: { id } })
  ├─ if !entity → throw NotFoundException(`Country with ID ${id} not found`)
  └─ return entity
```

### 3.4 UPDATE — `PUT /api/admin/countries/:id`

**Request Body**: `UpdateCountryDto` — identical to `CreateCountryDto`, all fields optional.

**Integration Logic**:

```
Frontend → PUT /api/admin/countries/3
  │
  ├─ Param: id = 3 (ParseIntPipe → 400 if not integer)
  │
  ├─ Body: { name_en: "Updated Name", specialty: "New specialty text" }
  │
  ├─ ValidationPipe → same rules as CreateCountryDto
  │
  ├─ CountriesService.update(3, dto)
  │   ├─ repository.update(3, dto)  → UPDATE countries SET name_en = '...', specialty = '...' WHERE id = 3
  │   │   └─ Does NOT load entity first — direct UPDATE query
  │   │   └─ Only provided fields are updated; omitted fields are untouched
  │   └─ findOne(3) → returns updated entity (throws 404 if id doesn't exist)
  │       └─ updatedAt auto-updated by TypeORM on the UPDATE
  │
  └─ Response: Country entity (200)
```

**Key behaviors**:
- **Partial update**: Only fields in the body are modified. Omitted fields retain existing values.
- **Direct UPDATE**: Uses `repository.update(id, dto)` — does NOT load the entity first. This is more efficient than the Services pattern (which loads then assigns then saves).
- **404 on missing**: `findOne(id)` throws `NotFoundException` if `id` doesn't exist. Note: the `update()` call itself does NOT throw if the ID is missing — it silently returns `affected: 0`. The 404 comes from the subsequent `findOne()`.
- **`id` cannot be changed**: `id` is not in the DTO.
- **`createdAt` is immutable**: Only `updatedAt` changes on update.

### 3.5 DELETE — `DELETE /api/admin/countries/:id`

**Integration Logic**:

```
Frontend → DELETE /api/admin/countries/3
  │
  ├─ Param: id = 3 (ParseIntPipe)
  │
  ├─ CountriesService.remove(3)
  │   ├─ repository.delete(3) → DELETE FROM countries WHERE id = 3
  │   ├─ if result.affected === 0 → throw NotFoundException
  │   └─ return void
  │
  └─ Response: 200 (empty body)
```

**Key behaviors**:
- **Hard delete**: Row is permanently removed from the database.
- **No cascade**: Countries have no child relations — safe to delete.
- **Idempotent concern**: Deleting the same ID twice returns 404 on the second call.
- **Sort order gap**: Deleting a country leaves a gap in `sort_order` values. Use bulk reorder to close gaps.

### 3.6 TOGGLE ACTIVE — `PATCH /api/admin/countries/:id/toggle`

**Integration Logic**:

```
Frontend → PATCH /api/admin/countries/3/toggle
  │
  ├─ Param: id = 3 (ParseIntPipe)
  │
  ├─ CountriesService.toggleActive(3)
  │   ├─ findOne(3) → loads entity (throws 404 if missing)
  │   ├─ entity.is_active = !entity.is_active  ← JS-level flip
  │   └─ repository.save(entity) → UPDATE with new is_active value
  │
  └─ Response: Country entity (200) with is_active flipped
```

**Key behaviors**:
- **Read-then-write pattern**: Loads entity, flips in JS, then saves. This is a **two-query** operation (SELECT + UPDATE).
- **Race condition risk**: Unlike the Services toggle (which uses atomic SQL `NOT is_active`), this pattern has a small window where concurrent toggles could overwrite each other. In practice, this is unlikely for admin operations but worth noting.
- **No body required**: The endpoint toggles regardless of request body.
- **Public visibility**: When `is_active` becomes `false`, the country disappears from the public API immediately.
- **Returns updated entity**: Frontend gets the new `is_active` value in the response.

### 3.7 REORDER (Single) — `PATCH /api/admin/countries/:id/reorder`

**Request Body**: `ReorderDto` — `{ sort_order: number }`

**Integration Logic**:

```
Frontend → PATCH /api/admin/countries/3/reorder
  │
  ├─ Param: id = 3 (ParseIntPipe)
  │
  ├─ Body: { sort_order: 2 }
  │
  ├─ ValidationPipe
  │   ├─ @Type(() => Number) → transforms string "2" to number 2
  │   ├─ @IsInt() → must be integer
  │   └─ @Min(0) → must be ≥ 0
  │
  ├─ CountriesService.reorder(3, 2)
  │   ├─ repository.update(3, { sort_order: 2 }) → UPDATE countries SET sort_order = 2 WHERE id = 3
  │   └─ findOne(3) → returns updated entity
  │
  └─ Response: Country entity (200) with new sort_order
```

**Key behaviors**:
- **No automatic shifting**: Setting `sort_order: 2` does NOT shift other countries. Two countries can share the same `sort_order`. The tiebreaker is `id ASC`.
- **Default fallback**: If `sort_order` is omitted from body, defaults to `0` (controller: `dto.sort_order ?? 0`).
- **Gaps allowed**: `sort_order` values don't need to be sequential.

### 3.8 BULK REORDER — `PATCH /api/admin/countries/reorder`

**Request Body**: `BulkReorderDto` — `{ ids: number[] }`

**Integration Logic**:

```
Frontend → PATCH /api/admin/countries/reorder
  │
  ├─ Body: { ids: [3, 1, 5, 2, 4] }
  │   └─ Array order determines sort_order: 3→1, 1→2, 5→3, 2→4, 4→5
  │
  ├─ ValidationPipe
  │   ├─ @Type(() => Number, { each: true }) → transforms each element
  │   └─ @IsInt({ each: true }) → each must be integer
  │
  ├─ Controller check
  │   ├─ if !dto.ids || !dto.ids.length → return findAll({ page: 1, limit: 1000 })
  │   │   └─ Returns paginated list instead of 400 (DIFFERENT from Services)
  │   └─ else → countriesService.bulkReorder(dto.ids)
  │
  ├─ CountriesService.bulkReorder([3, 1, 5, 2, 4])
  │   ├─ if !ids.length → throw BadRequestException('ids array must not be empty')
  │   │   └─ NOTE: Controller guards against this, so this throw is unreachable
  │   │
  │   ├─ dataSource.transaction(async (manager) => {
  │   │   ├─ for (let i = 0; i < ids.length; i++) {
  │   │   │   await manager.update(Country, ids[i], { sort_order: i + 1 })
  │   │   │ }  ← SEQUENTIAL updates within transaction (DIFFERENT from Services)
  │   │   │     id=3 → sort_order=1
  │   │   │     id=1 → sort_order=2
  │   │   │     id=5 → sort_order=3
  │   │   │     id=2 → sort_order=4
  │   │   │     id=4 → sort_order=5
  │   │   │
  │   │   └─ manager.find(Country, { order: { sort_order: 'ASC', id: 'ASC' } })
  │   │       ← returns all countries in new order
  │   │ })
  │   └─ if any update fails → transaction ROLLBACK
  │
  └─ Response: Country[] (200) — all countries in new sorted order
```

**Key behaviors**:
- **Transaction atomicity**: All updates succeed or all fail. No partial reorders.
- **1-indexed assignment**: Position 0 → `sort_order: 1`, position 1 → `sort_order: 2`, etc.
- **Sequential execution**: Uses `for` loop with `await` — updates one at a time. This is slower than `Promise.all` but guarantees ordering within the transaction.
- **Empty array fallback**: Controller returns `findAll({ page: 1, limit: 1000 })` instead of 400. This is a **design difference** from Services.
- **Missing IDs**: If an ID in the array doesn't exist, `manager.update()` returns `affected: 0` but does NOT throw. The transaction still commits. The missing ID is silently skipped.
- **Returns all countries**: Response includes the full country list, not just the reordered ones.

---

## 4. Public Integration

### 4.1 Fetch Active Countries — `GET /api/countries?locale=en`

**Query Params**: `LocaleQueryDto`

| Param | Type | Required | Default |
|---|---|---|---|
| `locale` | `en` \| `ar` | No | `en` |

**Integration Logic**:

```
Frontend → GET /api/countries?locale=en
  │
  ├─ LocaleQueryDto validation
  │
  ├─ PublicController.getCountries({ locale: 'en' })
  │   ├─ countriesService.findActive('en')
  │   │   ├─ repository.find({
  │   │   │   where: { is_active: true },
  │   │   │   order: { sort_order: 'ASC', id: 'ASC' }
  │   │   │ })
  │   │   └─ returns Country[] (active only)
  │   │       NOTE: locale param is passed but NOT used in the query
  │   │
  │   └─ .map(c => ({
  │       id: c.id,
  │       flag_emoji: c.flag_emoji,
  │       name: locale === 'en' ? c.name_en : c.name_ar,
  │       specialty: c.specialty,
  │       region: c.region,
  │       workers_label: c.workers_label,
  │     }))
  │
  └─ Response: PublicCountryResponseDto[] (200)
       [
         {
           "id": 1,
           "flag_emoji": "🇸🇦",
           "name": "Saudi Arabia",
           "specialty": "Commercial licensing",
           "region": "asia",
           "workers_label": "500+ workers"
         },
         ...
       ]
```

**Key behaviors**:
- **Active only**: `is_active: true` filter — inactive countries are excluded.
- **Sorted**: `sort_order ASC`, `id ASC` tiebreaker.
- **Locale mapping**: Each country returns a single `name` based on the requested locale. The `locale` parameter is passed to `findActive()` but **not used** in the query — locale filtering happens entirely in the controller's `.map()`.
- **No pagination**: Returns all active countries (expected to be a small set, typically < 30).
- **Null fields**: Missing locale fields appear as `null`/`undefined`. Frontend must handle gracefully.
- **Region enum in response**: `region` is returned as-is (`'asia'` or `'africa'`).

---

## 5. DTO Validation Summary

### 5.1 CreateCountryDto / UpdateCountryDto

| Field | Validators | Max Length | Notes |
|---|---|---|---|
| `flag_emoji` | `@IsOptional()`, `@IsString()` | 10 | Unicode emoji (e.g. 🇸🇦) |
| `name_en` | `@IsOptional()`, `@IsString()` | 200 | |
| `name_ar` | `@IsOptional()`, `@IsString()` | 200 | |
| `specialty` | `@IsOptional()`, `@IsString()` | 500 | |
| `region` | `@IsOptional()`, `@IsEnum(CountryRegion)` | — | `'asia'` or `'africa'` |
| `workers_label` | `@IsOptional()`, `@IsString()` | 200 | |
| `is_active` | `@IsOptional()`, `@IsBoolean()` | — | Default: `true` |
| `sort_order` | `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)` | — | Default: `0` |

### 5.2 ReorderDto

| Field | Validators | Notes |
|---|---|---|
| `sort_order` | `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)` | Defaults to `0` if omitted |

### 5.3 BulkReorderDto

| Field | Validators | Notes |
|---|---|---|
| `ids` | `@IsOptional()`, `@Type(() => Number, { each: true })`, `@IsInt({ each: true })` | Empty array → returns full list (not 400) |

---

## 6. Error Handling Matrix

| Scenario | HTTP Status | Response Body | Frontend Action |
|---|---|---|---|
| Country not found (update/delete/toggle/reorder) | 404 | `{ "message": "Country with ID X not found", "error": "Not Found", "statusCode": 404 }` | Remove from list / show not found |
| Validation failure (bad input) | 400 | `{ "message": ["name_en must not be longer than 200 characters"], "error": "Bad Request", "statusCode": 400 }` | Display field-level errors |
| Invalid region value | 400 | `{ "message": ["region must be one of the following values: asia, africa"], "error": "Bad Request", "statusCode": 400 }` | Show dropdown with valid options |
| sort_order not an integer or < 0 | 400 | `{ "message": ["sort_order must be an integer number", "sort_order must not be less than 0"] }` | Show numeric validation error |
| Bulk reorder with empty array | 200 | Returns paginated list of all countries | Not an error — returns data |
| Unauthorized (no token) | 401 | `{ "message": "Unauthorized", "statusCode": 401 }` | Redirect to login |
| Forbidden (non-admin) | 403 | `{ "message": "Forbidden resource", "statusCode": 403 }` | Show access denied |
| Invalid page/limit (non-integer, < 1) | 400 | `{ "message": ["page must be an integer number", "page must not be less than 1"] }` | Reset to defaults |
| Non-integer :id param | 400 | `{ "message": "ID must be an integer", "statusCode": 400 }` | ParseIntPipe auto-rejects |

---

## 7. Security Notes

| Concern | Mitigation |
|---|---|
| XSS | Country fields are plain text — no HTML sanitization needed. Frontend should NOT use `dangerouslySetInnerHTML` or equivalent. |
| Emoji handling | `flag_emoji` stored as `varchar(10)` — supports multi-byte UTF-8 emoji. Database must use `UTF8` encoding. |
| Authorization | All admin endpoints protected by `JwtAuthGuard` + `RolesGuard` (admin only). |
| Input validation | `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` — rejects unknown fields. |
| SQL injection | TypeORM parameterized queries throughout — no raw SQL string interpolation. |
| Bulk reorder transaction | `DataSource.transaction()` ensures atomicity — partial failures roll back. |
| Enum validation | `@IsEnum(CountryRegion)` prevents arbitrary string injection into the `region` column. |

---

## 8. Performance Considerations

| Aspect | Detail |
|---|---|
| Pagination | `findAndCount` runs 2 queries (SELECT + COUNT) — efficient for large datasets |
| Index recommendation | Add index on `(is_active, sort_order)` for public `findActive()` query |
| Index recommendation | Add index on `region` if filtering by region becomes a requirement |
| Bulk reorder | Sequential `for` loop with `await` — O(n) queries executed one at a time. For large lists (>50), consider switching to `Promise.all` (parallel) like the Services module. |
| Public endpoint | No pagination — expects small dataset (< 30 countries). |
| Caching opportunity | Public countries change infrequently — `CacheInterceptor` (TTL 300s) recommended |
| N+1 risk | None — countries have no relations that are eagerly loaded |
| Update efficiency | `repository.update(id, dto)` is more efficient than load-assign-save pattern (single UPDATE query vs SELECT + UPDATE) |

---

## 9. Frontend Integration Checklist

### 9.1 Admin Dashboard — Countries Manager

| Task | Details |
|---|---|
| List view | `GET /api/admin/countries?page=1&limit=20` → table with pagination |
| Create | `POST /api/admin/countries` → modal/form with all fields |
| Edit | `PUT /api/admin/countries/:id` → pre-populated form |
| Delete | `DELETE /api/admin/countries/:id` → confirmation dialog |
| Toggle active | `PATCH /api/admin/countries/:id/toggle` → switch/toggle UI element |
| Single reorder | `PATCH /api/admin/countries/:id/reorder` → drag-and-drop or number input |
| Bulk reorder | `PATCH /api/admin/countries/reorder` → drag-and-drop list, send ordered IDs on drop |
| Region filter | Client-side or server-side filter by `region` (asia/africa) |
| Active filter | Client-side filter by `is_active` in list view |
| Emoji picker | For `flag_emoji` field, consider an emoji picker component |
| Sort indicator | Show `sort_order` column in admin table |
| Error handling | 400 (validation), 401/403 (auth), 404 (not found) |
| Loading states | Disable form/buttons during mutations |
| Optimistic updates | For toggle, update UI immediately then reconcile with server response |

### 9.2 Public Site — Countries/Destinations Section

| Task | Details |
|---|---|
| Fetch on mount | `GET /api/countries?locale={currentLocale}` |
| Locale switching | Re-fetch on locale change (`en` ↔ `ar`) |
| RTL support | When `locale === 'ar'`, apply `dir="rtl"` |
| Card rendering | Map each country to a card/flag component |
| Flag rendering | Use `flag_emoji` as text content (not image) |
| Region grouping | Optionally group countries by `region` (asia/africa) |
| Workers label | Display `workers_label` as a badge/tag |
| Empty state | Show placeholder when no active countries exist |
| Caching | Consider caching response (TTL ~5 min) |

---

## 10. File Map

| File | Role |
|---|---|
| `src/countries/schema/country.schema.ts` | Entity definition + `CountryRegion` enum |
| `src/countries/dto/country.dto.ts` | `CreateCountryDto`, `UpdateCountryDto` — validation |
| `src/countries/dto/public-country-response.dto.ts` | `PublicCountryResponseDto` — public response shape |
| `src/countries/dto/index.ts` | Barrel exports (only Create/Update DTOs) |
| `src/countries/countries.controller.ts` | Admin endpoints (CRUD + toggle + reorder + bulk reorder) |
| `src/countries/countries.service.ts` | Business logic (findAll, findOne, create, update, remove, toggleActive, reorder, bulkReorder, findActive) |
| `src/countries/countries.module.ts` | Module registration |
| `src/public/public.controller.ts` | Public GET endpoint (active + locale-filtered) |
| `src/common/dto/pagination-query.dto.ts` | `PaginationQueryDto` — list pagination |
| `src/common/dto/reorder.dto.ts` | `ReorderDto`, `BulkReorderDto` — reorder requests |
| `src/common/dto/paginated-response.dto.ts` | `PaginatedResponseDto<T>` — paginated response wrapper |

---

## 11. Integration Sequence Diagrams

### 11.1 CREATE

```
┌──────────┐     ┌──────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  POST /api/admin/countries   │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                             │                 │
     │── { name_en, flag_emoji } ─►│                             │                 │
     │                          │── ValidationPipe ───────────►│                 │
     │                          │                             │── create(dto) ──►│
     │                          │                             │                 │
     │                          │                             │── repository.create(dto)
     │                          │                             │── repository.save(entity)
     │                          │                             │                 │
     │◄── Country entity (201) ──│◄── entity ─────────────────│◄── saved entity │
```

### 11.2 UPDATE

```
┌──────────┐     ┌──────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PUT /api/admin/countries/:id    │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                 │                 │
     │── PUT /3 { name_en: ".." } ───────────────────────────────►│                 │
     │                          │── ParseIntPipe(id=3) ──────────►│                 │
     │                          │── ValidationPipe ──────────────►│                 │
     │                          │                                 │── update(3, dto)─►│
     │                          │                                 │                 │
     │                          │                                 │── repository.update(3, dto)
     │                          │                                 │   (direct UPDATE, no SELECT first)
     │                          │                                 │── findOne(3) ────►│ (404 if missing)
     │                          │                                 │◄── entity ───────│
     │                          │                                 │                 │
     │◄── Country entity (200) ──│◄── entity ─────────────────────│◄── entity ──────│
```

### 11.3 DELETE

```
┌──────────┐     ┌──────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  DELETE /api/admin/countries/:id │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                 │                 │
     │── DELETE /3 ──────────────►│                                 │                 │
     │                          │── ParseIntPipe(id=3) ──────────►│                 │
     │                          │                                 │── remove(3) ────►│
     │                          │                                 │                 │
     │                          │                                 │── repository.delete(3)
     │                          │                                 │── affected === 0? → 404
     │                          │                                 │                 │
     │◄── 200 (void) ────────────│◄── void ───────────────────────│◄── void ────────│
```

### 11.4 TOGGLE

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PATCH /api/admin/countries/:id/toggle│    │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── PATCH /3/toggle ────────►│                                     │                 │
     │                          │── ParseIntPipe(id=3) ──────────────►│                 │
     │                          │                                     │── toggleActive(3)─►│
     │                          │                                     │                 │
     │                          │                                     │── findOne(3) ────►│ (404 if missing)
     │                          │                                     │◄── entity ──────│
     │                          │                                     │                 │
     │                          │                                     │── entity.is_active = !entity.is_active
     │                          │                                     │── repository.save(entity)
     │                          │                                     │                 │
     │◄── Country (is_active flipped) ◄── entity ────────────────────│◄── saved entity │
```

### 11.5 BULK REORDER

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  PATCH /api/admin/countries/reorder  │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── { ids: [3,1,5,2,4] } ──►│                                     │                 │
     │                          │── ValidationPipe ──────────────────►│                 │
     │                          │                                     │                 │
     │                          │── if !ids.length → return findAll() │                 │
     │                          │── else → bulkReorder(ids) ──────────►│                 │
     │                          │                                     │── if !ids.length → 400
     │                          │                                     │                 │
     │                          │                                     │── dataSource.transaction(
     │                          │                                     │     for i in ids:
     │                          │                                     │       await update(id, {sort_order: i+1})
     │                          │                                     │     find(all, order)
     │                          │                                     │   )
     │                          │                                     │                 │
     │◄── Country[] (sorted) ────│◄── Country[] ──────────────────────│◄── Country[] ───│
```

### 11.6 PUBLIC FETCH

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │  GET /api/countries?locale=en        │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────┬───────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                          │                                     │                 │
     │── GET ?locale=en ────────►│                                     │                 │
     │                          │── LocaleQueryDto ──────────────────►│                 │
     │                          │                                     │── getCountries(en)─►│
     │                          │                                     │                 │
     │                          │                                     │── findActive('en')─►│
     │                          │                                     │   (is_active=true,
     │                          │                                     │    sort_order ASC)
     │                          │                                     │   NOTE: locale not used in query
     │                          │                                     │◄── Country[] ───│
     │                          │                                     │                 │
     │                          │                                     │── .map(locale)  │
     │                          │                                     │   (pick en/ar name)
     │                          │                                     │                 │
     │◄── PublicCountryResponseDto[] ◄── mapped array ───────────────│◄── mapped array │
```

---

## 12. Key Differences from Services Module

| Aspect | Services | Countries |
|---|---|---|
| **Update pattern** | `findOne` → `Object.assign` → `save` (2 queries: SELECT + UPDATE) | `repository.update` → `findOne` (2 queries: UPDATE + SELECT) |
| **Toggle pattern** | Atomic SQL: `SET is_active = NOT is_active` (1 query + SELECT) | Read-then-write: `findOne` → flip → `save` (2 queries: SELECT + UPDATE) |
| **Bulk reorder** | `Promise.all` (parallel updates) | `for` loop with `await` (sequential updates) |
| **Empty bulk reorder** | Throws `BadRequestException` (400) | Returns `findAll({ page: 1, limit: 1000 })` (200) |
| **Unique field** | None | `region` enum (`asia`/`africa`) |
| **Public locale handling** | Service receives locale, maps in controller | Service receives locale but ignores it; controller does all mapping |
| **Public DTO export** | Exported in barrel `index.ts` | NOT exported in barrel `index.ts` |

---

## 13. Open Questions / TODOs

| # | Question | Impact |
|---|---|---|
| 1 | Should a dedicated `GET /api/admin/countries/:id` endpoint be added? | Currently only accessible via list or as part of mutation responses |
| 2 | Should toggle use atomic SQL (`NOT is_active`) like Services? | Current read-then-write has a small race condition window |
| 3 | Should bulk reorder use `Promise.all` (parallel) like Services? | Current sequential loop is slower for large lists |
| 4 | Should empty bulk reorder return 400 (like Services) instead of full list? | Inconsistent behavior between modules |
| 5 | Should `findActive` actually use the `locale` parameter? | Currently passed but ignored — could filter/select locale-specific columns at DB level |
| 6 | Should `PublicCountryResponseDto` be exported in barrel `index.ts`? | Currently only accessible via direct import |
| 7 | Should countries support region-based filtering in the public API? | `GET /api/countries?locale=en&region=asia` |
| 8 | Should soft delete replace hard delete? | Currently `DELETE` is permanent — `is_active` toggle already provides soft-hide |
| 9 | Should there be a seed endpoint for default countries? | No seed method exists — countries must be created manually |
| 10 | Should `flag_emoji` have validation (emoji regex)? | Currently accepts any string up to 10 chars |
