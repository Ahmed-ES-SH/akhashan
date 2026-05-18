# Admin Hero Section Control — Refactor Plan

> **Scope**: `AdminHeroSectionControl.tsx` + supporting files — full rebuild to work correctly with the backend API defined in `HERO_SECTION_INTEGRATION.md`
> **Date**: 2026-05-16

---

## 1. Current Issues Analysis

### 1.1 Critical Bugs

| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | **Duplicate import** — `HeroApiResponse, Locale` imported twice (lines 11 & 13) | `AdminHeroSectionControl.tsx` | TypeScript error |
| 2 | **Wrong background image source** — Uses `hero.background_image` (public API shape) instead of locale-specific `hero_background_image_en/ar` from admin content | `AdminHeroSectionControl.tsx:54` | Background image doesn't update after admin changes |
| 3 | **Wrong upload API endpoint** — Calls `/api/admin/upload/image` but backend expects `/api/admin/home-page-content/upload` | `adminApi.ts:44` | Image upload fails |
| 4 | **Wrong upload request shape** — Sends `{ file, locale, section }` but backend expects `FormData` with fields `image_en` / `image_ar` | `adminApi.ts:39-42` | Upload rejected by backend |
| 5 | **Wrong upload response shape** — Expects `{ url }` but backend returns `{ imageUrl_en, imageUrl_ar }` | `adminApi.ts:38` | URL extraction fails |
| 6 | **Wrong field key mapping for images** — Maps to `background_image_en/ar` but admin API keys are `hero_background_image_en/ar` | `AdminHeroSectionControl.tsx:36` | Image URL not saved to correct field |

### 1.2 Missing Functionality

| # | Missing Feature | Details |
|---|---|---|
| 1 | **`cta_primary` not editable** | Primary CTA button text is displayed but not clickable/editable |
| 2 | **`cta_whatsapp` not editable** | WhatsApp CTA label is not editable (only number is) |
| 3 | **No WhatsApp validation** | No client-side regex `/^\+?[0-9\s-]{6,20}$/` before submit |
| 4 | **No loading/error states** | No visual feedback during initial content fetch |
| 5 | **No HTML preview for heading/description** | Plan requires live preview of sanitized HTML |
| 6 | **Background image edit button always visible** | Should have proper admin-mode gating |

### 1.3 Structural Issues

| # | Issue | Details |
|---|---|---|
| 1 | **Image upload popup receives wrong props** | `HeroApiResponse` doesn't have `background_image_en/ar` — it has `background_image` |
| 2 | **Heading structure mismatch** | `heading` and `highlight_text` rendered as separate blocks, but backend `heading` field supports inline `<span class="highlight">` HTML |
| 3 | **Hardcoded English text** | "Change Background" button text is not i18n'd |

---

## 2. Files to Modify

| File | Change Type | Rationale |
|---|---|---|
| `app/_components/website/_admin/AdminHeroSectionControl.tsx` | **Rebuild** | Core component — all issues originate here |
| `app/helpers/api/adminApi.ts` | **Modify** | Fix upload endpoint, request shape, and response type |
| `app/types/website/admin.types.ts` | **Modify** | Add upload response type |
| `app/contexts/AdminEditorContext.tsx` | **No change** | Already correct — provides editing infrastructure |
| `app/hooks/admin/useAdminHomeContent.ts` | **No change** | Already correct — handles dirty tracking + save |
| `app/_components/website/_admin/ImageUploadPopup.tsx` | **No change** | Already correct — handles bilingual upload UI |
| `app/_components/website/_admin/EditableText.tsx` | **No change** | Already correct |

---

## 3. Detailed Changes

### 3.1 `adminApi.ts` — Fix Upload Function

**Current**:
```ts
export async function adminUploadImage(
  file: File, locale: "en" | "ar", section: "hero",
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("locale", locale);
  formData.append("section", section);
  return api.post<{ url: string }>(
    "/api/admin/upload/image", formData as unknown as Record<string, unknown>,
    undefined, true, true,
  );
}
```

**New**:
```ts
export interface HeroImageUploadResponse {
  imageUrl_en?: string;
  imageUrl_ar?: string;
}

export async function adminUploadHeroImages(
  fileEn?: File | null,
  fileAr?: File | null,
): Promise<HeroImageUploadResponse> {
  const formData = new FormData();
  if (fileEn) formData.append("image_en", fileEn);
  if (fileAr) formData.append("image_ar", fileAr);

  return api.post<HeroImageUploadResponse>(
    "/api/admin/home-page-content/upload",
    formData as unknown as Record<string, unknown>,
    undefined, true, true,
  );
}
```

### 3.2 `admin.types.ts` — Add Upload Response Type

Add to the file:
```ts
export interface HeroImageUploadResponse {
  imageUrl_en?: string;
  imageUrl_ar?: string;
}
```

### 3.3 `AdminHeroSectionControl.tsx` — Full Rebuild

#### 3.3.1 Props & State

```tsx
interface AdminHeroSectionControlProps {
  locale: Locale;
}

// No hero prop needed — all data comes from AdminEditorContext
```

#### 3.3.2 Image Upload Flow

```tsx
const handleImageUpload = async (fileEn?: File | null, fileAr?: File | null) => {
  setIsUploading(true);
  try {
    const response = await adminUploadHeroImages(fileEn, fileAr);

    // Map response to admin API field keys and mark dirty
    if (response.imageUrl_en) {
      setField("background_image_en", response.imageUrl_en);
    }
    if (response.imageUrl_ar) {
      setField("background_image_ar", response.imageUrl_ar);
    }
  } finally {
    setIsUploading(false);
  }
};
```

#### 3.3.3 Background Image Resolution

```tsx
// Priority: dirty field → admin content → SSR fallback → default
const backgroundImage = locale === "ar"
  ? (getFieldValue("background_image_ar") || "/hero-image-RTL.webp")
  : (getFieldValue("background_image_en") || "/Hero-image.webp");
```

#### 3.3.4 All Editable Fields

| UI Element | Field Key | Editable | Type |
|---|---|---|---|
| Badge | `badge` | Yes | Bilingual text |
| Heading | `heading` | Yes | Bilingual HTML (with `<span class="highlight">`) |
| Description | `description` | Yes | Bilingual HTML |
| License | `license` | Yes | Bilingual text |
| Primary CTA | `cta_primary` | Yes | Bilingual text |
| WhatsApp CTA Label | `cta_whatsapp` | Yes | Bilingual text |
| WhatsApp Number | `whatsapp_number` | Yes | Single field (validated) |
| Background Image | `background_image_en/ar` | Yes | File upload |

#### 3.3.5 WhatsApp Validation

```tsx
const WHATSAPP_REGEX = /^\+?[0-9\s-]{6,20}$/;

// In handlePopupSave for whatsapp_number field:
if (editingField === "whatsapp_number" && !WHATSAPP_REGEX.test(valueEn)) {
  toast.error("Invalid WhatsApp number format");
  return;
}
```

#### 3.3.6 Component Structure

```tsx
export default function AdminHeroSectionControl({ locale }: Props) {
  const { getFieldValue, openEditor, setField } = useAdminEditor();
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Background image resolution
  const backgroundImage = ...

  // Image upload handler
  const handleImageUpload = ...

  return (
    <section dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Background layer with edit button */}
      <div className="...">
        <div style={{ backgroundImage: `url(${backgroundImage})` }} />
        <Overlay />
        <EditButton onClick={() => setImageUploadOpen(true)} />
      </div>

      {/* Content */}
      <div className="c-container ...">
        <div className="hero-entrance ...">
          {/* Badge — editable */}
          <EditableText value={getFieldValue("badge")} fieldKey="badge" ... />

          {/* Heading — editable with highlight */}
          <EditableText value={getFieldValue("heading")} fieldKey="heading" ... />

          {/* Description — editable */}
          <EditableText value={getFieldValue("description")} fieldKey="description" ... />

          {/* License — editable */}
          <div className="...">
            <EditableText value={getFieldValue("license")} fieldKey="license" ... />
          </div>

          {/* CTA Buttons */}
          <div className="...">
            {/* Primary CTA — editable */}
            <span onClick={() => openEditor("cta_primary", HERO_FIELD_API_MAP)} ...>
              {getFieldValue("cta_primary")}
            </span>

            {/* WhatsApp CTA — editable label + number */}
            <span onClick={() => openEditor("cta_whatsapp", HERO_FIELD_API_MAP)} ...>
              {getFieldValue("cta_whatsapp")}
            </span>
          </div>
        </div>
      </div>

      {/* Image upload popup */}
      <ImageUploadPopup
        isOpen={imageUploadOpen}
        onClose={() => setImageUploadOpen(false)}
        onUpload={handleImageUpload}
        currentImageUrlEn={getFieldValue("background_image_en") || null}
        currentImageUrlAr={getFieldValue("background_image_ar") || null}
        label="Hero Background Image"
        isUploading={isUploading}
      />
    </section>
  );
}
```

---

## 4. ImageUploadPopup Adaptation

The current `ImageUploadPopup` expects `onUpload: (file: File, locale: "en" | "ar") => Promise<string>` — called once per file.

The new API accepts both files in one request. Two options:

### Option A: Keep current popup, call upload twice
- **Pros**: No popup changes needed
- **Cons**: Two HTTP requests, not matching backend design

### Option B: Update popup to batch upload (Recommended)
- Change `onUpload` signature to `(fileEn?: File, fileAr?: File) => Promise<void>`
- Upload button sends both files at once
- **Pros**: Matches backend design, single request, cleaner

**Decision**: Option B — update the popup's `onUpload` prop signature and internal upload logic.

---

## 5. WhatsApp Number Validation

Add client-side validation in `AdminEditorContext.handlePopupSave`:

```tsx
const WHATSAPP_REGEX = /^\+?[0-9\s-]{6,20}$/;

const handlePopupSave = useCallback(async (valueEn: string, valueAr: string) => {
  if (!editingField || !activeFieldMap) return;

  // WhatsApp number validation
  if (editingField === "whatsapp_number" && !WHATSAPP_REGEX.test(valueEn)) {
    toast.error("Invalid WhatsApp number format. Use: +[digits][spaces][-]");
    return; // Don't close popup
  }

  // ... existing save logic
}, [...]);
```

---

## 6. Error Handling

| Scenario | Frontend Action |
|---|---|
| `GET /api/admin/home-page-content` fails (404) | Show "Content not seeded" banner with placeholder values |
| `PUT /api/admin/home-page-content` fails (400) | Show field-level validation errors from response |
| Upload fails (413) | Show "File too large (max 5MB)" toast |
| Upload fails (400 — wrong type) | Show "Only JPEG, PNG, WebP allowed" toast |
| Network error | Show "Network error, please retry" toast |

---

## 7. Implementation Order

1. **`adminApi.ts`** — Replace `adminUploadImage` with `adminUploadHeroImages`
2. **`admin.types.ts`** — Add `HeroImageUploadResponse` type
3. **`ImageUploadPopup.tsx`** — Update `onUpload` prop signature for batch upload
4. **`AdminEditorContext.tsx`** — Add WhatsApp validation in `handlePopupSave`
5. **`AdminHeroSectionControl.tsx`** — Full rebuild with all fixes
6. **Verify** — Run `pnpm lint` and type-check

---

## 8. Testing Checklist

| Test | Expected Result |
|---|---|
| Load admin page | Hero section renders with content from admin API |
| Click badge text | Bilingual edit popup opens with current EN/AR values |
| Edit & save badge | Dirty count increments, save bar appears |
| Click "Save All" | PUT request sent, success toast shown |
| Upload EN image only | Image uploaded, background updates for EN locale |
| Upload both images | Both uploaded, both locale backgrounds update |
| Edit WhatsApp number with invalid format | Validation error, popup stays open |
| Edit WhatsApp number with valid format | Saved successfully |
| Edit primary CTA text | Bilingual popup opens, saves correctly |
| Edit WhatsApp CTA label | Bilingual popup opens, saves correctly |
| Switch locale | All fields show correct locale values |
| Revert changes | Dirty fields cleared, original values restored |
