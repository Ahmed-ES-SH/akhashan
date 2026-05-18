# Hero Section Integration Plan

> **Scope**: Hero section only — all bilingual fields, image upload, public/admin consumption, validation, and sanitization.
> **Date**: 2026-05-16
> **Status**: Draft

---

## 1. Overview

The hero section is the top-most visual block on the home page. It is stored as a flat set of bilingual columns on the `home_page_content` table (single-row, `id = 1`). The frontend consumes it through two distinct API surfaces:

| Surface | Endpoint | Auth | Purpose |
|---|---|---|---|
| **Admin** | `PUT /api/admin/home-page-content` | JWT + Admin role | Update all hero text fields |
| **Admin** | `POST /api/admin/home-page-content/upload` | JWT + Admin role | Upload hero background images (en/ar) |
| **Public** | `GET /api/home-page-content?locale=en\|ar` | None | Read locale-filtered hero payload |

---

## 2. Data Model — Hero Fields

### 2.1 Database Columns (`home_page_content` table)

| Column | Type | Nullable | Max Length | Sanitized | Description |
|---|---|---|---|---|---|
| `hero_background_image_en` | `varchar` | yes | 500 | no | EN hero background image URL/path |
| `hero_background_image_ar` | `varchar` | yes | 500 | no | AR hero background image URL/path |
| `hero_badge_en` | `varchar` | yes | 100 | no | EN badge text (e.g. "Trusted & Certified") |
| `hero_badge_ar` | `varchar` | yes | 100 | no | AR badge text |
| `hero_heading_en` | `text` | yes | 2000 | **yes** | EN heading — supports limited HTML |
| `hero_heading_ar` | `text` | yes | 2000 | **yes** | AR heading — supports limited HTML |
| `hero_highlight_text_en` | `varchar` | yes | 200 | no | EN highlight/inline emphasized text |
| `hero_highlight_text_ar` | `varchar` | yes | 200 | no | AR highlight text |
| `hero_description_en` | `text` | yes | 3000 | **yes** | EN description — supports limited HTML |
| `hero_description_ar` | `text` | yes | 3000 | **yes** | AR description — supports limited HTML |
| `hero_license_en` | `varchar` | yes | 500 | no | EN license text below CTA |
| `hero_license_ar` | `varchar` | yes | 500 | no | AR license text |
| `hero_cta_primary_en` | `varchar` | yes | 100 | no | EN primary CTA button label |
| `hero_cta_primary_ar` | `varchar` | yes | 100 | no | AR primary CTA button label |
| `hero_whatsapp_number` | `varchar` | yes | 50 | no | WhatsApp number (validated format) |
| `hero_cta_whatsapp_en` | `varchar` | yes | 100 | no | EN WhatsApp CTA button label |
| `hero_cta_whatsapp_ar` | `varchar` | yes | 100 | no | AR WhatsApp CTA button label |

### 2.2 HTML Sanitization Rules

Fields marked **sanitized** pass through `sanitizeHtml()` via `@Transform()` in the DTO:

| Allowed Tags | Allowed Attributes |
|---|---|
| `<br>`, `<span>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`, `<p>`, `<a>` | `span`: `class`, `style` · `a`: `href`, `title`, `target` |

Dangerous tags (`script`, `style`, `iframe`, `object`, `embed`) and their bodies are stripped entirely.

### 2.3 WhatsApp Number Validation

Pattern: `/^\+?[0-9\s-]{6,20}$/`
- Allows optional leading `+`
- Digits, spaces, and hyphens only
- 6–20 characters total

---

## 3. Admin Integration

### 3.1 Update Hero Text Fields

**Endpoint**: `PUT /api/admin/home-page-content`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Request Body**: `UpdateHomePageContentDto` — all hero fields are optional, allowing partial updates. Only the fields sent in the body are modified; omitted fields retain their current DB values.

**Integration Logic**:

```
Frontend → PUT /api/admin/home-page-content
  │
  ├─ Body: { hero_heading_en: "...", hero_badge_ar: "...", ... }
  │
  ├─ ValidationPipe (global)
  │   ├─ whitelist: true          → strips unknown properties
  │   ├─ forbidNonWhitelisted: true → rejects unknown properties with 400
  │   └─ transform: true          → runs @Transform() decorators
  │
  ├─ @Transform() on sanitized fields → sanitizeHtml()
  │
  ├─ class-validator decorators
  │   ├─ @IsOptional() on every field
  │   ├─ @IsString() on every field
  │   ├─ @MaxLength(N) per field (see §2.1)
  │   └─ @Matches() on hero_whatsapp_number
  │
  ├─ HomePageContentService.update(dto)
  │   ├─ findOne() → loads entity with id=1 (throws 404 if missing)
  │   ├─ Object.assign(entity, dto) → merges only provided fields
  │   └─ repository.save(entity) → persists
  │
  └─ Response: HomePageContent entity (full row)
```

**Key behaviors**:
- **Partial update**: Only fields present in the request body are changed. `undefined` fields are not written because `Object.assign` skips keys that don't exist on the source object.
- **404 if no seed**: If `home_page_content` row `id=1` does not exist, the update returns `404`. The frontend should handle this gracefully or ensure seeding has run.
- **Idempotent**: Sending the same payload twice produces the same result.

### 3.2 Upload Hero Background Images

**Endpoint**: `POST /api/admin/home-page-content/upload`

**Auth**: `JwtAuthGuard` + `RolesGuard` (admin)

**Content-Type**: `multipart/form-data`

**Fields**:
| Field | Max Count | Required |
|---|---|---|
| `image_en` | 1 | At least one of `image_en` or `image_ar` |
| `image_ar` | 1 | At least one of `image_en` or `image_ar` |

**File Constraints**:
| Constraint | Value |
|---|---|
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max file size | 5 MB |
| Storage destination | `./uploads/hero/` |
| Filename pattern | `hero-{locale}-{timestamp}-{random}.{ext}` |

**Integration Logic**:

```
Frontend → POST /api/admin/home-page-content/upload
  │
  ├─ FormData: { image_en: File, image_ar: File }
  │
  ├─ FileFieldsInterceptor
  │   ├─ storage: diskStorage → ./uploads/hero/
  │   ├─ fileFilter: rejects non-image/jpeg|png|webp → 400
  │   └─ limits: fileSize ≤ 5MB → 413 if exceeded
  │
  ├─ Controller validation
  │   └─ !image_en && !image_ar → BadRequestException(400)
  │
  ├─ HomePageContentService.uploadHeroImages({ image_en, image_ar })
  │   ├─ findOne() → loads entity id=1
  │   ├─ if image_en: entity.hero_background_image_en = "/uploads/hero/{filename}"
  │   ├─ if image_ar: entity.hero_background_image_ar = "/uploads/hero/{filename}"
  │   └─ repository.save(entity)
  │
  └─ Response: HeroImageUploadResponseDto
       { imageUrl_en: "/uploads/hero/hero-en-...", imageUrl_ar: "/uploads/hero/hero-ar-..." }
```

**Key behaviors**:
- **Either/or**: At least one image must be provided. Both can be sent simultaneously.
- **Overwrites**: Each upload replaces the previous image path in the DB. The old file is **not** deleted from disk (cleanup is not implemented).
- **Static serving**: `main.ts` registers `uploads/` as static assets at `/uploads/` prefix, so the returned paths are directly accessible by the frontend.

### 3.3 Recommended Upload + Update Flow

For a complete hero update that includes a new image:

```
Step 1: POST /api/admin/home-page-content/upload
  → receives { imageUrl_en, imageUrl_ar }

Step 2: PUT /api/admin/home-page-content
  → body includes the returned image URLs + any text field updates
```

Alternatively, the frontend can skip step 1 and set `hero_background_image_en/ar` directly to an external URL in step 2 (the DTO accepts any string up to 500 chars).

---

## 4. Public Integration

### 4.1 Fetch Locale-Filtered Hero

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
  ├─ LocaleQueryDto validation (locale must be 'en' or 'ar' if provided)
  │
  ├─ HomePageContentService.findPublic(locale)
  │   ├─ findOne() → loads entity + relations (statItems, licensingItems, processSteps)
  │   ├─ Maps hero fields to locale-specific HeroResponseDto:
  │   │   background_image = locale === 'en' ? entity.hero_background_image_en
  │   │                                      : entity.hero_background_image_ar
  │   │   badge          = locale === 'en' ? entity.hero_badge_en
  │   │                                      : entity.hero_badge_ar
  │   │   ... (all 9 hero fields)
  │   │
  │   └─ Returns HomePageContentResponseDto { hero, stats, licensing, process, services_header, countries_header }
  │
  └─ Response: { hero: { background_image, badge, heading, highlight_text, description, license, cta_primary, whatsapp_number, cta_whatsapp } }
```

**Response Shape (hero only)**:

```json
{
  "hero": {
    "background_image": "/uploads/hero/hero-en-1234567890.webp",
    "badge": "Trusted & Certified",
    "heading": "Your text here with <span class=\"highlight\">highlighted</span>",
    "highlight_text": "highlighted",
    "description": "Description text with <span class=\"highlight\">highlight</span>",
    "license": "Licensed text",
    "cta_primary": "Contact Us",
    "whatsapp_number": "966XXXXXXXXX",
    "cta_whatsapp": "WhatsApp"
  }
}
```

**Key behaviors**:
- **Null fields**: All hero fields are nullable. Missing fields appear as `null` (or omitted if `undefined`) in the response. The frontend must handle `null`/`undefined` gracefully.
- **HTML in response**: `heading` and `description` may contain safe HTML. The frontend should render them with `dangerouslySetInnerHTML` (React) or `v-html` (Vue) — the content is already sanitized server-side.
- **404 if no seed**: Returns `404` if the `home_page_content` row does not exist.

---

## 5. Frontend Integration Checklist

### 5.1 Admin Dashboard — Hero Editor

| Task | Details |
|---|---|
| Fetch current content | `GET /api/admin/home-page-content` → populate form |
| Text fields | 14 input fields (7 en + 7 ar) — all optional |
| HTML preview | For `heading` and `description`, show a live preview of sanitized HTML |
| WhatsApp validation | Client-side regex match before submit: `/^\+?[0-9\s-]{6,20}$/` |
| Image upload | `POST /api/admin/home-page-content/upload` with `FormData` |
| Save changes | `PUT /api/admin/home-page-content` with updated fields |
| Error handling | 400 (validation), 401/403 (auth), 404 (no seed), 413 (file too large) |
| Loading states | Disable form during upload/save |

### 5.2 Public Site — Hero Rendering

| Task | Details |
|---|---|
| Fetch on mount | `GET /api/home-page-content?locale={currentLocale}` |
| Locale switching | Re-fetch on locale change (`en` ↔ `ar`) |
| RTL support | When `locale === 'ar'`, apply `dir="rtl"` and appropriate CSS |
| Image rendering | Use `background_image` as `src` or `background-image` CSS property |
| HTML rendering | Render `heading` and `description` with safe HTML injection |
| CTA links | Primary CTA → configurable link; WhatsApp CTA → `https://wa.me/{whatsapp_number}` |
| Fallbacks | Show defaults or hide elements when fields are `null`/`undefined` |
| Caching | Consider caching the response (TTL ~5 min) — content changes infrequently |

---

## 6. Error Handling Matrix

| Scenario | HTTP Status | Response Body | Frontend Action |
|---|---|---|---|
| No `home_page_content` row (seed not run) | 404 | `{ "message": "Home page content not found. Run the seed command first.", "error": "Not Found", "statusCode": 404 }` | Show placeholder / prompt admin to seed |
| Validation failure (bad input) | 400 | `{ "message": ["hero_heading_en must not be longer than 2000 characters", ...], "error": "Bad Request", "statusCode": 400 }` | Display field-level errors |
| Invalid WhatsApp format | 400 | `{ "message": ["Invalid WhatsApp number format"], "error": "Bad Request", "statusCode": 400 }` | Show format hint to user |
| Unauthorized (no token) | 401 | `{ "message": "Unauthorized", "statusCode": 401 }` | Redirect to login |
| Forbidden (non-admin) | 403 | `{ "message": "Forbidden resource", "statusCode": 403 }` | Show access denied |
| File too large (>5MB) | 413 | `{ "message": "File too large", "statusCode": 413 }` | Show size limit message |
| Wrong file type | 400 | `{ "message": "Only JPEG, PNG, and WebP images are allowed", "statusCode": 400 }` | Show allowed types |
| No image in upload | 400 | `{ "message": "At least one image (image_en or image_ar) must be provided", "statusCode": 400 }` | Require at least one file |

---

## 7. Security Notes

| Concern | Mitigation |
|---|---|
| XSS via HTML fields | `sanitizeHtml()` strips all dangerous tags/attributes; whitelist-only approach |
| File upload abuse | MIME type filter + 5MB size limit + disk storage in dedicated directory |
| Path traversal in filenames | `diskStorage` generates safe filenames (`hero-{locale}-{timestamp}-{random}.{ext}`) — original filename is discarded |
| CSRF on admin endpoints | JWT stored in HTTP-only cookie + `credentials: true` CORS |
| Rate limiting on public endpoint | `@nestjs/throttler` applied globally; contact endpoint has specific throttle (5 req/min) |
| CORS | Configured to `FRONTEND_URL` env var — no wildcards in production |

---

## 8. Performance Considerations

| Aspect | Detail |
|---|---|
| Single-row query | `findOne({ where: { id: 1 } })` is O(1) — no index needed |
| Relations loaded eagerly | `statItems`, `licensingItems`, `processSteps` are always loaded — consider lazy loading if hero-only endpoint is needed |
| Image serving | Static files served via Express `useStaticAssets` — consider CDN in production |
| Caching opportunity | Hero content changes rarely — implement `CacheInterceptor` (TTL 300s) on public GET |
| Response size | Hero section alone is ~500 bytes JSON — negligible |

---

## 9. Seed Data Defaults

Running `POST /api/admin/home-page-content/seed` (idempotent) creates the row with these hero defaults:

| Field | EN Default | AR Default |
|---|---|---|
| `background_image` | `/Hero-image.webp` | `/Hero-image.webp` |
| `badge` | `Trusted & Certified` | `موثوق ومعتمد` |
| `heading` | `Your text here with` | `النص الخاص بك هنا مع` |
| `highlight_text` | `highlighted` | `مميز` |
| `description` | `Description text with <span class="highlight">highlight</span>` | `نص الوصف مع <span class="highlight">تمييز</span>` |
| `license` | `Licensed text` | `نص مرخص` |
| `cta_primary` | `Contact Us` | `اتصل بنا` |
| `whatsapp_number` | `966XXXXXXXXX` | — |
| `cta_whatsapp` | `WhatsApp` | `واتساب` |

---

## 10. File Map

| File | Role in Hero Integration |
|---|---|
| `src/home-page-content/schema/home-page-content.schema.ts` | Entity definition — all hero columns |
| `src/home-page-content/dto/home-page-content.dto.ts` | `UpdateHomePageContentDto` — validation + sanitization |
| `src/home-page-content/dto/home-page-content-response.dto.ts` | `HeroResponseDto` — public response shape |
| `src/home-page-content/dto/home-page-content-upload-response.dto.ts` | `HeroImageUploadResponseDto` — upload response |
| `src/home-page-content/home-page-content.controller.ts` | Admin endpoints (GET, PUT, POST upload, POST seed) |
| `src/home-page-content/home-page-content.service.ts` | Business logic (findOne, update, findPublic, uploadHeroImages, seed) |
| `src/home-page-content/home-page-content.module.ts` | Module registration |
| `src/public/public.controller.ts` | Public GET endpoint with locale filtering |
| `src/common/utils/sanitize-html.util.ts` | `sanitizeHtml()` — XSS protection |
| `src/common/utils/file-upload.util.ts` | `heroImageStorage`, `heroImageFileFilter`, `HERO_IMAGE_MAX_SIZE` |
| `src/main.ts` | Static asset serving (`/uploads/`), global ValidationPipe, CORS |

---

## 11. Integration Sequence Diagrams

### 11.1 Admin: Full Hero Update (Text + Image)

```
┌──────────┐     ┌─────────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │       POST /api/admin/.../upload        │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────────┬──────────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                              │                                   │                 │
     │── FormData(image_en, image_ar) ──►│                                   │                 │
     │                              │── FileFieldsInterceptor ──►│                 │
     │                              │                                   │── findOne(id=1) ──►│
     │                              │                                   │◄── entity ────────│
     │                              │                                   │                 │
     │                              │                                   │── save(entity) ──►│
     │                              │◄── { imageUrl_en, imageUrl_ar } ──│◄── saved ───────│
     │◄── { imageUrl_en, imageUrl_ar } ──│                                   │                 │
     │                              │                                   │                 │
     │── PUT /api/admin/.../home-page-content ──►│                                   │
     │   { hero_heading_en, hero_badge_en,        │── ValidationPipe ──►│                 │
     │     hero_background_image_en: imageUrl_en }│── @Transform sanitize ──►│                 │
     │                              │                                   │── findOne(id=1) ──►│
     │                              │                                   │◄── entity ────────│
     │                              │                                   │                 │
     │                              │                                   │── Object.assign  │
     │                              │                                   │── save(entity) ──►│
     │◄── HomePageContent entity ────│◄── entity ──────────────────────│◄── saved ───────│
```

### 11.2 Public: Fetch Hero by Locale

```
┌──────────┐     ┌──────────────────────────────────────┐     ┌───────────┐     ┌────────────┐
│ Frontend │     │    GET /api/home-page-content?locale=en   │     │ Controller│     │   Service   │
└────┬─────┘     └──────────────────┬───────────────────┘     └─────┬─────┘     └─────┬──────┘
     │                              │                                   │                 │
     │── GET ?locale=en ────────────►│                                   │                 │
     │                              │── LocaleQueryDto ─────────────────►│                 │
     │                              │                                   │── findPublic(en)─►│
     │                              │                                   │                 │
     │                              │                                   │── findOne(id=1) ──►│ (with relations)
     │                              │                                   │◄── entity ────────│
     │                              │                                   │                 │
     │                              │                                   │── Map hero fields │
     │                              │                                   │   (locale === en) │
     │                              │                                   │                 │
     │◄── { hero: { ...en fields... } } ◄── HomePageContentResponseDto ◄──│◄── dto ─────────│
```

---

## 12. Open Questions / TODOs

| # | Question | Impact |
|---|---|---|
| 1 | Should old hero images be deleted from disk on upload? | Storage cleanup, currently orphaned files accumulate |
| 2 | Should a hero-only public endpoint exist (`GET /api/hero?locale=en`)? | Reduce payload size for hero-only consumers |
| 3 | Should caching be added to the public endpoint? | Performance — content changes rarely |
| 4 | Should the WhatsApp CTA link be a separate configurable field? | Currently frontend constructs `https://wa.me/{number}` |
| 5 | Should image URLs support external URLs (CDN, S3)? | Currently assumes local `/uploads/hero/` paths |
| 6 | Should there be an endpoint to delete/reset hero images? | Currently only overwrite is possible |
