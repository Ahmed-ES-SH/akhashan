# ADMIN SECTION CONTROLS PLAN

> Extend the admin editing pattern from `AdminHeroSectionControl` to StatsSection, LicensingSection, and ProcessSection
> Created: 2026-05-16
> Status: Pending Approval

---

## Overview

The `AdminHeroSectionControl` component demonstrates the admin editing pattern:
1. Uses `useAdminHomeContent` hook for dirty tracking, bilingual values, and save-all logic
2. Wraps text elements with `EditableText` to trigger inline editing
3. Uses a single `InlineEditPopup` instance for all fields
4. Shows a floating save bar with unsaved changes count
5. Renders the section layout with admin editing capabilities

We need to create equivalent admin control components for:
- **StatsSection** → `AdminStatsSectionControl`
- **LicensingSection** → `AdminLicensingSectionControl`
- **ProcessSection** → `AdminProcessSectionControl`

Each section has:
- **Section header fields** (label, heading, description) — bilingual text editing
- **Child items** (statItems, licensingItems, processSteps) — CRUD operations (future phase)

This plan covers **section header text editing only**. Child item CRUD is a separate phase.

---

## Architecture

```
AdminGate
  ├── AdminHeroSectionControl (existing)
  ├── AdminStatsSectionControl (new)
  ├── AdminLicensingSectionControl (new)
  └── AdminProcessSectionControl (new)
```

All four components share:
- The same `useAdminHomeContent` hook instance (provided via context or lifted state)
- The same `InlineEditPopup` (managed at a parent level to have ONE popup for ALL sections)
- The same floating save bar (managed at a parent level)

**Key decision:** Lift the popup + save bar to `AdminGate` level so there is truly ONE popup and ONE save bar for the entire admin page, not one per section.

---

## Phase 1 — Extend Types & Field Mapping

### 1.1 Extend `admin.types.ts`

Add field API mappings for stats, licensing, and process section headers:

```typescript
// Add to admin.types.ts

export const STATS_FIELD_API_MAP: Record<string, { en: string; ar: string } | string> = {
  label: { en: "stats_label_en", ar: "stats_label_ar" },
  heading: { en: "stats_heading_en", ar: "stats_heading_ar" },
  description: { en: "stats_description_en", ar: "stats_description_ar" },
};

export const LICENSING_FIELD_API_MAP: Record<string, { en: string; ar: string } | string> = {
  label: { en: "licensing_label_en", ar: "licensing_label_ar" },
  heading: { en: "licensing_heading_en", ar: "licensing_heading_ar" },
  description: { en: "licensing_description_en", ar: "licensing_description_ar" },
};

export const PROCESS_FIELD_API_MAP: Record<string, { en: string; ar: string } | string> = {
  label: { en: "process_label_en", ar: "process_label_ar" },
  heading: { en: "process_heading_en", ar: "process_heading_ar" },
  description: { en: "process_description_en", ar: "process_description_ar" },
};
```

### 1.2 Extend `AdminHomeContentUpdatePayload`

Add the new fields to the update payload type.

### 1.3 Extend `AdminHomePageContent`

Add the new bilingual fields to the content interface.

---

## Phase 2 — Create Unified Admin Editor Context

### 2.1 Problem

Currently each `AdminHeroSectionControl` creates its own popup state and calls `useAdminHomeContent` independently. If we do the same for 3 more sections, we'll have:
- 4 separate `InlineEditPopup` instances (wasteful)
- 4 separate save bars (confusing)
- 4 separate dirty tracking states (inconsistent)

### 2.2 Solution: `AdminEditorContext`

**File:** `app/contexts/AdminEditorContext.tsx`

Create a context that provides:
- Single `editingField` state (which field across ALL sections is being edited)
- Single `editingValueEn` / `editingValueAr` state
- `openEditor(fieldKey, fieldMap)` — opens popup with the correct field mapping
- `closeEditor()` — closes popup
- `handlePopupSave(valueEn, valueAr)` — saves to the correct field via the hook
- All `useAdminHomeContent` return values (getFieldValue, setBilingualField, saveAll, reset, isDirty, dirtyCount, isSaving)
- Reference to the active field map (so popup knows if it's bilingual or single-field)

```typescript
interface AdminEditorContextValue {
  // Popup state
  editingField: string | null;
  editingValueEn: string;
  editingValueAr: string;
  activeFieldMap: Record<string, { en: string; ar: string } | string>;
  openEditor: (fieldKey: string, fieldMap: Record<string, { en: string; ar: string } | string>) => void;
  closeEditor: () => void;
  handlePopupSave: (valueEn: string, valueAr: string) => Promise<void>;

  // From useAdminHomeContent
  getFieldValue: (uiFieldKey: string) => string;
  getBilingualValue: (uiFieldKey: string) => { en: string; ar: string };
  setBilingualField: (uiFieldKey: string, valueEn: string, valueAr: string) => void;
  setField: (uiFieldKey: string, newValue: string) => void;
  saveAll: () => Promise<boolean>;
  reset: () => void;
  isDirty: boolean;
  dirtyCount: number;
  isSaving: boolean;
}
```

### 2.3 `AdminEditorProvider`

**File:** `app/contexts/AdminEditorContext.tsx`

Wraps the admin content after auth gate. Manages all popup state and delegates to `useAdminHomeContent`.

---

## Phase 3 — Create Section Control Components

### 3.1 `AdminStatsSectionControl`

**File:** `app/_components/website/_admin/AdminStatsSectionControl.tsx`

**Props:**
```typescript
interface AdminStatsSectionControlProps {
  stats: StatsSectionApiResponse;
  locale: Locale;
}
```

**Logic:**
- Uses `useAdminEditor()` context for all editing state
- Renders the same layout as `StatsSection.tsx`
- Wraps `label`, `heading`, `description` with `EditableText`
- On edit: calls `openEditor(fieldKey, STATS_FIELD_API_MAP)`
- Renders stat items (non-editable for now, just display)

**Editable fields:**
| UI Key | Label | Type |
|--------|-------|------|
| label | Stats Label | text |
| heading | Stats Heading | text |
| description | Stats Description | textarea |

### 3.2 `AdminLicensingSectionControl`

**File:** `app/_components/website/_admin/AdminLicensingSectionControl.tsx`

**Props:**
```typescript
interface AdminLicensingSectionControlProps {
  licensing: LicensingSectionApiResponse;
  locale: Locale;
}
```

**Logic:**
- Same pattern as stats section
- Wraps `label`, `heading`, `description` with `EditableText`
- On edit: calls `openEditor(fieldKey, LICENSING_FIELD_API_MAP)`

**Editable fields:**
| UI Key | Label | Type |
|--------|-------|------|
| label | Licensing Label | text |
| heading | Licensing Heading | text |
| description | Licensing Description | textarea |

### 3.3 `AdminProcessSectionControl`

**File:** `app/_components/website/_admin/AdminProcessSectionControl.tsx`

**Props:**
```typescript
interface AdminProcessSectionControlProps {
  process: ProcessSectionApiResponse;
  locale: Locale;
}
```

**Logic:**
- Same pattern as stats section
- Wraps `label`, `heading`, `description` with `EditableText`
- On edit: calls `openEditor(fieldKey, PROCESS_FIELD_API_MAP)`

**Editable fields:**
| UI Key | Label | Type |
|--------|-------|------|
| label | Process Label | text |
| heading | Process Heading | text |
| description | Process Description | textarea |

---

## Phase 4 — Refactor `AdminHeroSectionControl`

### 4.1 Update to use context

Replace local state (`editingField`, `editingValueEn`, `editingValueAr`) with `useAdminEditor()` context.

Remove the local `InlineEditPopup` and save bar — they move to `AdminGate`.

### 4.2 Updated structure

```typescript
export default function AdminHeroSectionControl({ hero, locale }: HeroSectionProps) {
  const { getFieldValue, openEditor } = useAdminEditor();

  return (
    <section>
      {/* ... same layout ... */}
      <EditableText value={getFieldValue("badge")} fieldKey="badge" onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)} />
      {/* ... other editable fields ... */}
    </section>
  );
}
```

---

## Phase 5 — Update `AdminGate`

### 5.1 Wrap sections with `AdminEditorProvider`

```typescript
// AdminGate.tsx
return (
  <div className="min-h-screen bg-gray-50">
    {/* Admin header */}
    <header>...</header>

    <AdminEditorProvider hero={data.hero} locale={locale}>
      <AdminHeroSectionControl hero={data.hero} locale={locale} />
      <AdminStatsSectionControl stats={data.stats} locale={locale} />
      <AdminLicensingSectionControl licensing={data.licensing} locale={locale} />
      <AdminProcessSectionControl process={data.process} locale={locale} />

      {/* Single InlineEditPopup for ALL sections */}
      <AdminEditPopup />

      {/* Single Save Bar for ALL sections */}
      <AdminSaveBar />
    </AdminEditorProvider>
  </div>
);
```

### 5.2 `AdminEditPopup` — thin wrapper around `InlineEditPopup`

**File:** `app/_components/website/_admin/AdminEditPopup.tsx`

Reads from `AdminEditorContext` and renders the popup. No local state.

### 5.3 `AdminSaveBar` — thin wrapper around save bar markup

**File:** `app/_components/website/_admin/AdminSaveBar.tsx`

Reads from `AdminEditorContext` and renders the save bar. No local state.

---

## Phase 6 — Update Admin Page Server Component

### 6.1 Pass stats, licensing, process data

**File:** `app/[locale]/admin/page.tsx`

Update the data object to include all sections:

```typescript
const data = {
  hero: homeContent.hero,
  stats: homeContent.stats,
  licensing: homeContent.licensing,
  process: homeContent.process,
  services,
  countries,
};
```

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `app/_components/website/_admin/AdminStatsSectionControl.tsx` | Admin stats section with editable headers |
| `app/_components/website/_admin/AdminLicensingSectionControl.tsx` | Admin licensing section with editable headers |
| `app/_components/website/_admin/AdminProcessSectionControl.tsx` | Admin process section with editable headers |
| `app/contexts/AdminEditorContext.tsx` | Unified editor context (popup state + hook access) |
| `app/_components/website/_admin/AdminEditPopup.tsx` | Popup wrapper using context |
| `app/_components/website/_admin/AdminSaveBar.tsx` | Save bar wrapper using context |

### Modified Files
| File | Change |
|------|--------|
| `app/types/website/admin.types.ts` | Add field maps + extend content/update types |
| `app/_components/website/_admin/AdminHeroSectionControl.tsx` | Refactor to use context, remove local popup/save bar |
| `app/_components/website/_admin/AdminGate.tsx` | Add provider + all section controls + popup + save bar |
| `app/[locale]/admin/page.tsx` | Pass stats, licensing, process data |

---

## Data Flow

```
AdminGate
  └── AdminEditorProvider (creates useAdminHomeContent + popup state)
        ├── AdminHeroSectionControl
        ├── AdminStatsSectionControl
        ├── AdminLicensingSectionControl
        ├── AdminProcessSectionControl
        ├── AdminEditPopup (reads context, renders InlineEditPopup)
        └── AdminSaveBar (reads context, renders save bar)

User clicks EditableText → openEditor(fieldKey, fieldMap) → context sets editing state
  → AdminEditPopup opens with bilingual inputs
  → User saves → handlePopupSave → setBilingualField → marks dirty
  → Save bar appears with count
  → User clicks "Save All" → saveAll() → PUT /api/admin/home-page-content
```

---

## Out of Scope (Future Phases)

- **Child item CRUD** (statItems, licensingItems, processSteps) — add/edit/delete/reorder individual items
- **Image editing** (hero background image upload/change)
- **Services/Countries admin pages** — separate pages as per ADMIN_INTEGRATE_PLAN.md
- **Drag-and-drop reordering** of child items
