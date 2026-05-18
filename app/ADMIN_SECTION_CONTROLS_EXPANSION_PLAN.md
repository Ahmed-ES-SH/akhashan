# ADMIN SECTION CONTROLS EXPANSION PLAN

> Akhashan Frontend — Admin Section Controls Expansion
> Created: 2026-05-16
> Status: Pending Approval

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Feature 1 — Hero Background Image Upload](#feature-1--hero-background-image-upload)
4. [Feature 2 — Stats Items Inline Editing](#feature-2--stats-items-inline-editing)
5. [Feature 3 — Licensing Items Inline Editing](#feature-3--licensing-items-inline-editing)
6. [Feature 4 — Process Steps Inline Editing](#feature-4--process-steps-inline-editing)
7. [Feature 5 — AdminStatusBadge Translation Fix](#feature-5--adminstatusbadge-translation-fix)
8. [File Structure Changes](#file-structure-changes)
9. [API Contract Additions](#api-contract-additions)
10. [Implementation Order](#implementation-order)
11. [Risk & Edge Cases](#risk--edge-cases)

---

## 1. Overview

This plan expands the admin dashboard to allow inline editing of:

- **Hero background image** — bilingual (EN/AR) file upload
- **Stat items** — inline edit `target`, `suffix`, `label` for each stat card
- **Licensing items** — inline edit `icon`, `title`, `desc`, `tag` for each badge card
- **Process steps** — inline edit `title`, `desc` for each process step
- **AdminStatusBadge** — fix hardcoded English labels to use translations

All inline editing follows the existing pattern: click → `InlineEditPopup` → save → dirty tracking → batch save.

---

## 2. Current State Analysis

| Component | Editable | Hardcoded |
|-----------|----------|-----------|
| **AdminHeroSectionControl** | badge, heading, highlight_text, description, license, cta_primary, cta_whatsapp, whatsapp_number | background_image (no UI control) |
| **AdminStatsSectionControl** | label, heading, description | Stat items (icon, target, suffix, label) |
| **AdminLicensingSectionControl** | label, heading, description | Licensing items (icon, title, desc, tag) |
| **AdminProcessSectionControl** | label, heading, description | Process steps (step_number, title, desc) |
| **AdminStatusBadge** | — | Boolean labels "Active"/"Inactive" hardcoded in English |

---

## Feature 1 — Hero Background Image Upload

### 1.1 What Changes

Add a clickable overlay on the hero background image that opens an image upload popup. Admin can upload separate images for EN and AR locales.

### 1.2 New Components

#### `ImageUploadPopup.tsx`
**File:** `app/_components/website/_admin/ImageUploadPopup.tsx`

```typescript
interface ImageUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, locale: "en" | "ar") => Promise<string>;
  currentImageUrlEn: string | null;
  currentImageUrlAr: string | null;
  label: string;
  isUploading?: boolean;
}
```

**Behavior:**
- Shows current EN/AR images as previews
- Two file input areas (one for EN, one for AR)
- Drag-and-drop support
- File validation (image type, max size 5MB)
- Upload button calls `onUpload` which returns the new URL
- Cancel button closes without changes
- Keyboard: Escape to close

### 1.3 API Layer Changes

#### `adminApi.ts` — Add upload method

```typescript
export async function adminUploadImage(
  file: File,
  locale: "en" | "ar",
  section: "hero",
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("locale", locale);
  formData.append("section", section);

  return api.post<{ url: string }>(
    "/api/admin/upload/image",
    formData,
    true,  // withCredentials
    true,  // isFormData — NEW parameter in apiClient
  );
}
```

#### `apiClient.ts` — Add FormData support

Add optional `isFormData` parameter to `post`, `put`, `patch` methods:
- When `true`, skip `JSON.stringify(body)` and `Content-Type: application/json`
- Let browser set `Content-Type: multipart/form-data` automatically

### 1.4 Types Changes

#### `admin.types.ts` — Add to HERO_FIELD_API_MAP

```typescript
export const HERO_FIELD_API_MAP = {
  // ... existing fields
  background_image_en: "hero_background_image_en",  // single-value (URL)
  background_image_ar: "hero_background_image_ar",  // single-value (URL)
};
```

### 1.5 Component Changes

#### `AdminHeroSectionControl.tsx`

Add an edit button overlay on the background image:

```tsx
{/* Background image — now clickable */}
<div className="absolute inset-0 scale-105 will-change-transform group">
  <div
    className="absolute inset-0 w-full h-full bg-cover bg-center"
    style={{
      backgroundImage: `url(${hero.background_image ?? (locale === "ar" ? "/hero-image-RTL.webp" : "/Hero-image.webp")})`,
    }}
  />
  <div className="bg-[#1E1E1E]/50 absolute inset-0 w-full h-full" />
  
  {/* NEW: Edit overlay */}
  <button
    onClick={() => setImageUploadOpen(true)}
    className="absolute top-4 right-4 z-20 bg-black/60 text-white rounded-lg px-3 py-2 text-sm opacity-0 group-hover:opacity-100 transition"
  >
    Change Background
  </button>
</div>

{/* NEW: Image upload popup */}
<ImageUploadPopup
  isOpen={imageUploadOpen}
  onClose={() => setImageUploadOpen(false)}
  onUpload={handleImageUpload}
  currentImageUrlEn={hero.background_image_en}
  currentImageUrlAr={hero.background_image_ar}
  label="Hero Background Image"
/>
```

### 1.6 Data Flow

```
User clicks "Change Background" → ImageUploadPopup opens
  → User selects EN file → adminUploadImage(file, "en", "hero")
    → Returns { url: "https://..." }
    → setField("background_image_en", url) → marks dirty
  → User selects AR file → adminUploadImage(file, "ar", "hero")
    → Returns { url: "https://..." }
    → setField("background_image_ar", url) → marks dirty
  → User clicks "Save All" in AdminSaveBar
    → PUT /api/admin/home-page-content with dirty fields
```

---

## Feature 2 — Stats Items Inline Editing

### 2.1 What Changes

Make individual stat items editable inline. Each stat card's `target`, `suffix`, and `label` becomes clickable and opens the `InlineEditPopup`.

**Note:** `AdminStatusBadge` has NO relation to stats — it's for contact messages and service status. Stats editing will be added to `AdminStatsSectionControl` via the existing `EditableText` pattern.

### 2.2 Types Changes

#### `home.types.ts` — Add StatItemApiResponse fields (verify existing)

```typescript
export interface StatItemApiResponse {
  id: number;
  icon: string;
  target: number;
  suffix: string;
  label: string;
  sortOrder: number;
}
```

#### `admin.types.ts` — Add STAT_ITEMS_FIELD_API_MAP

Since stat items are child entities with their own API endpoints (per the original plan), we need a mapping for inline editing:

```typescript
// For inline editing of stat item fields
export const STAT_ITEM_FIELD_API_MAP: Record<string, string> = {
  target: "target",
  suffix: "suffix",
  label: "label",
};
```

### 2.3 Component Changes

#### `AdminStatsSectionControl.tsx`

Wrap each stat item field in `EditableText`:

```tsx
function StatCard({
  item,
  index,
  onEditField,
}: {
  item: StatItemApiResponse;
  index: number;
  onEditField: (fieldKey: string, itemIndex: number) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-9 text-center ...">
      {/* Icon — not editable (icon picker is future phase) */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
        <Icon name={item.icon} className="w-6 h-6 text-gold" />
      </div>
      
      {/* Target — editable */}
      <div className="text-[clamp(2.8rem,4.5vw,3.8rem)] font-black text-green leading-none mb-1.5 tabular-nums">
        <EditableText
          value={item.target.toLocaleString("en-US")}
          fieldKey={`stat_item_${index}_target`}
          onEdit={() => onEditField("target", index)}
          as="span"
          className="text-gold"
        />
        {/* Suffix — editable */}
        <EditableText
          value={item.suffix}
          fieldKey={`stat_item_${index}_suffix`}
          onEdit={() => onEditField("suffix", index)}
          as="span"
        />
      </div>
      
      {/* Label — editable */}
      <EditableText
        value={item.label}
        fieldKey={`stat_item_${index}_label`}
        onEdit={() => onEditField("label", index)}
        as="div"
        className="text-sm text-muted font-medium"
      />
    </div>
  );
}
```

### 2.4 Context Changes

#### `AdminEditorContext.tsx`

The context needs to handle stat item edits. Since stat items are child entities with their own API, we have two options:

**Option A: Include in batch save (simpler)**
- Stat item changes are tracked as dirty fields with keys like `stat_item_0_target`
- On save, the context sends them as part of the PUT payload
- Backend parses and updates child items

**Option B: Immediate save (more complex)**
- Stat item changes are saved immediately via PATCH to `/api/admin/stat-items/:id`
- No dirty tracking needed

**Recommendation: Option A** — keeps the pattern consistent with other inline edits. The backend already supports partial updates.

### 2.5 Data Flow

```
User clicks stat target → openEditor("stat_item_0_target", STAT_ITEM_FIELD_API_MAP)
  → InlineEditPopup opens with current value
  → User changes "150" to "200" → Save
  → setField("stat_item_0_target", "200") → marks dirty
  → AdminSaveBar shows dirty count +1
  → User clicks "Save All" → PUT includes stat item changes
```

---

## Feature 3 — Licensing Items Inline Editing

### 3.1 What Changes

Make individual licensing badge cards editable inline. Each card's `icon`, `title`, `desc`, `tag` becomes clickable.

### 3.2 Types Changes

#### `home.types.ts` — Verify LicensingItemApiResponse

```typescript
export interface LicensingItemApiResponse {
  id: number;
  icon: string;
  title: string;
  desc: string;
  tag: string;
  sortOrder: number;
}
```

#### `admin.types.ts` — Add LICENSING_ITEMS_FIELD_API_MAP

```typescript
export const LICENSING_ITEM_FIELD_API_MAP: Record<string, string> = {
  icon: "icon",
  title: "title",
  desc: "desc",
  tag: "tag",
};
```

### 3.3 Component Changes

#### `AdminLicensingSectionControl.tsx`

```tsx
function BadgeCard({
  item,
  index,
  onEditField,
}: {
  item: LicensingItemApiResponse;
  index: number;
  onEditField: (fieldKey: string, itemIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-9 ...">
      {/* Icon — not editable (icon picker is future phase) */}
      <div className="w-15 h-15 flex-shrink-0 rounded-2xl ...">
        <Icon name={item.icon} className="w-[30px] h-[30px] text-gold" />
      </div>
      
      {/* Title — editable */}
      <EditableText
        value={item.title}
        fieldKey={`licensing_item_${index}_title`}
        onEdit={() => onEditField("title", index)}
        as="h3"
        className="text-lg font-bold mb-1"
      />
      
      {/* Description — editable */}
      <EditableText
        value={item.desc}
        fieldKey={`licensing_item_${index}_desc`}
        onEdit={() => onEditField("desc", index)}
        as="p"
        className="text-sm text-muted leading-relaxed flex-1"
      />
      
      {/* Tag — editable */}
      <EditableText
        value={item.tag}
        fieldKey={`licensing_item_${index}_tag`}
        onEdit={() => onEditField("tag", index)}
        as="span"
        className="inline-block self-start px-3 py-1 rounded-full text-[0.72rem] font-bold bg-gold/12 text-gold-dark"
      />
    </div>
  );
}
```

### 3.4 Data Flow

Same pattern as stats items — click → popup → save → dirty → batch save.

---

## Feature 4 — Process Steps Inline Editing

### 4.1 What Changes

Make individual process steps editable inline. Each step's `title` and `desc` becomes clickable.

### 4.2 Types Changes

#### `home.types.ts` — Verify ProcessStepApiResponse

```typescript
export interface ProcessStepApiResponse {
  id: number;
  step_number: number;
  title: string;
  desc: string;
  sortOrder: number;
}
```

#### `admin.types.ts` — Add PROCESS_ITEMS_FIELD_API_MAP

```typescript
export const PROCESS_ITEM_FIELD_API_MAP: Record<string, string> = {
  title: "title",
  desc: "desc",
};
```

### 4.3 Component Changes

#### `AdminProcessSectionControl.tsx`

```tsx
function ProcessStepCard({
  step,
  index,
  isLast,
  onEditField,
}: {
  step: ProcessStepApiResponse;
  index: number;
  isLast: boolean;
  onEditField: (fieldKey: string, itemIndex: number) => void;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-5 text-xl font-black text-green-dark relative">
        {step.step_number}
        {!isLast && (
          <div className="absolute top-1/2 left-[calc(100%+12px)] w-[calc(100%-80px)] h-px bg-gold/25 max-md:hidden" />
        )}
      </div>
      
      {/* Title — editable */}
      <EditableText
        value={step.title}
        fieldKey={`process_item_${index}_title`}
        onEdit={() => onEditField("title", index)}
        as="h4"
        className="text-base font-bold mb-1.5 text-white"
      />
      
      {/* Description — editable */}
      <EditableText
        value={step.desc}
        fieldKey={`process_item_${index}_desc`}
        onEdit={() => onEditField("desc", index)}
        as="p"
        className="text-sm text-white/60 leading-relaxed max-w-[220px] mx-auto"
      />
    </div>
  );
}
```

### 4.4 Data Flow

Same pattern as stats and licensing items.

---

## Feature 5 — AdminStatusBadge Translation Fix

### 5.1 What Changes

The boolean status labels ("Active"/"Inactive") are hardcoded in English. They should use translation keys.

### 5.2 Translation Keys to Add

#### `translations/en.json`
```json
{
  "admin": {
    "common": {
      "statusActive": "Active",
      "statusInactive": "Inactive"
    }
  }
}
```

#### `translations/ar.json`
```json
{
  "admin": {
    "common": {
      "statusActive": "نشط",
      "statusInactive": "غير نشط"
    }
  }
}
```

### 5.3 Component Changes

#### `AdminStatusBadge.tsx`

```tsx
// Before (line 26):
{status ? "Active" : "Inactive"}

// After:
{status ? t.common.statusActive : t.common.statusInactive}
```

---

## File Structure Changes

### New Files

| File | Purpose |
|------|---------|
| `app/_components/website/_admin/ImageUploadPopup.tsx` | Image upload popup for hero background |

### Modified Files

| File | Changes |
|------|---------|
| `app/helpers/api/apiClient.ts` | Add `isFormData` parameter to post/put/patch |
| `app/helpers/api/adminApi.ts` | Add `adminUploadImage` method |
| `app/types/website/admin.types.ts` | Add field API maps for stat items, licensing items, process items |
| `app/_components/website/_admin/AdminHeroSectionControl.tsx` | Add background image upload UI |
| `app/_components/website/_admin/AdminStatsSectionControl.tsx` | Make stat items inline editable |
| `app/_components/website/_admin/AdminLicensingSectionControl.tsx` | Make licensing items inline editable |
| `app/_components/website/_admin/AdminProcessSectionControl.tsx` | Make process steps inline editable |
| `app/_components/website/_admin/AdminStatusBadge.tsx` | Fix hardcoded labels to use translations |
| `app/contexts/AdminEditorContext.tsx` | Handle child item field keys in dirty tracking |
| `translations/en.json` | Add admin.common.statusActive, admin.common.statusInactive |
| `translations/ar.json` | Add admin.common.statusActive, admin.common.statusInactive |

---

## API Contract Additions

### Upload Endpoint (Backend Required)

```
POST /api/admin/upload/image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  file: <File>
  locale: "en" | "ar"
  section: "hero"

Response:
{
  "url": "https://cdn.example.com/hero-bg-en-abc123.webp"
}
```

### Home Content Update — Child Items

The existing `PUT /api/admin/home-page-content` endpoint needs to accept child item updates in the payload:

```json
{
  "stat_item_0_target": 200,
  "stat_item_0_suffix": "+",
  "stat_item_0_label": "Projects Completed",
  "licensing_item_0_title": "Updated Title",
  "licensing_item_0_desc": "Updated description",
  "licensing_item_0_tag": "Updated tag",
  "process_item_0_title": "Updated step title",
  "process_item_0_desc": "Updated step description"
}
```

**Note:** This requires backend changes. If the backend doesn't support this pattern, we need individual PATCH endpoints for each child item type.

---

## Implementation Order

| Phase | Feature | Estimated Effort | Dependencies |
|-------|---------|-----------------|--------------|
| 1 | AdminStatusBadge translation fix | 15 min | None |
| 2 | API client FormData support + upload method | 30 min | None |
| 3 | ImageUploadPopup component | 1 hour | Phase 2 |
| 4 | AdminHeroSectionControl background upload | 30 min | Phase 3 |
| 5 | Types & field API maps for child items | 15 min | None |
| 6 | AdminStatsSectionControl inline editing | 45 min | Phase 5 |
| 7 | AdminLicensingSectionControl inline editing | 45 min | Phase 5 |
| 8 | AdminProcessSectionControl inline editing | 45 min | Phase 5 |
| 9 | AdminEditorContext child item handling | 30 min | Phase 5 |
| 10 | Translation keys for all new UI strings | 15 min | None |
| 11 | pnpm lint + type check | 15 min | All phases |

---

## Risk & Edge Cases

### 1. Backend Upload Endpoint
- **Risk:** Backend may not have `/api/admin/upload/image` endpoint
- **Mitigation:** Verify with backend team. If not available, use URL input as fallback (Phase 1.1 alternative).

### 2. Child Item Update Pattern
- **Risk:** Backend may not accept `stat_item_0_target` style keys in PUT payload
- **Mitigation:** If backend requires individual PATCH endpoints, change data flow to immediate save instead of batch save.

### 3. Image Upload Size
- **Risk:** Large images could slow down page load
- **Mitigation:** Validate file size (max 5MB) and type (image/*) in ImageUploadPopup. Backend should also validate and optimize.

### 4. Icon Editing
- **Risk:** Stat items and licensing items have `icon` fields that are string identifiers (e.g., "star", "shield")
- **Mitigation:** Icon editing is out of scope for this phase. Icons remain non-editable. A future icon picker component can be added.

### 5. Stat Item Target as Number
- **Risk:** `target` is a number but InlineEditPopup handles strings
- **Mitigation:** Convert string to number on save. Show formatted value (with commas) in the UI, send raw number to API.

### 6. Concurrent Edits
- **Risk:** Two admins editing the same item simultaneously
- **Mitigation:** Optimistic update with rollback on error. Existing dirty tracking already handles this.

### 7. i18n Compliance
- **Risk:** New UI strings not added to translations
- **Mitigation:** All UI strings must be in `translations/en.json` and `translations/ar.json`. No hardcoded text.

---

## What Is NOT In Scope

| Feature | Reason |
|---------|--------|
| Icon picker for stat/licensing items | Requires icon library UI, complex |
| Drag-and-drop reordering of child items | Requires dnd library, complex |
| Add/delete child items | Requires form modals, validation |
| Image cropping/optimization | Requires image processing library |
| Undo/redo history | Complex state management |

---

## Summary

This plan adds inline editing capabilities to all admin section controls while following the existing patterns:

1. **Hero background image** — new `ImageUploadPopup` component with file upload
2. **Stats items** — inline edit `target`, `suffix`, `label` via existing `EditableText` + `InlineEditPopup`
3. **Licensing items** — inline edit `title`, `desc`, `tag` via existing `EditableText` + `InlineEditPopup`
4. **Process steps** — inline edit `title`, `desc` via existing `EditableText` + `InlineEditPopup`
5. **AdminStatusBadge** — fix hardcoded English labels to use translations

All changes are additive and follow the existing architecture: `page.tsx` = layout, hooks = data logic, components = presentation.
