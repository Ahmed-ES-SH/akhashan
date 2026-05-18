# Admin Services Page — Full Refinement Plan (Revised)

**Target**: `app/[locale]/admin/services/page.tsx` and related admin components
**Scope**: All priority issues (3 P1, 2 P2) + minor observations
**Approach**: Phase-by-phase execution, each phase independently verifiable

---

## Phase Tracking

| Phase | Name | Status | Steps |
|-------|------|--------|-------|
| **Phase 1** | Foundation — IconPicker + Filter UI | ⬜ Pending | Step 1, Step 2 |
| **Phase 2** | Visual Cleanup — Contrast + Tokens + Hierarchy | ⬜ Pending | Step 3, Step 4, Step 5A, Step 5B |
| **Phase 3** | Interaction & Accessibility — Loading + Focus + i18n | ⬜ Pending | Step 6, Step 7, Step 8 |
| **Phase 4** | Verification — Lint + Test + RTL Check | ⬜ Pending | Step 9 |

---

## Non-Goals

The following are explicitly **out of scope** for this implementation:

- **No backend filtering yet** — filtering/sorting is client-side only; backend integration comes later
- **No drag-and-drop sorting** — the fake drag handle will be removed, not implemented
- **No virtualization for large tables** — pagination handles scale for now
- **No server actions migration** — keep existing API call patterns
- **No TanStack Table migration** — keep native HTML table
- **No major modal system rewrite** — keep existing modal pattern, improve accessibility incrementally
- **No new dependencies added** — use only what's already installed (react-icons, framer-motion, sonner)

---

## Design Token Verification (Pre-Flight Check)

**Status**: ✅ Verified — tokens exist in `app/globals.css` via `@theme inline`:

| Token | CSS Variable | Value |
|-------|-------------|-------|
| `bg-surface` | `--color-surface` | `oklch(0.998 0.003 160)` — near-white |
| `text-charcoal` | `--color-charcoal` | `oklch(0.22 0.012 160)` — dark green-tinted |
| `text-muted` | `--color-muted` | `oklch(0.52 0.025 220)` — medium gray-blue |
| `border-border` | `--color-border` | `oklch(0.91 0.008 220)` — light gray |
| `bg-bg` | `--color-bg` | `oklch(0.975 0.006 160)` — page background |
| `bg-green` | `--color-green` | `oklch(0.4 0.09 160)` — brand primary |
| `bg-gold` | `--color-gold` | `oklch(0.7 0.12 80)` — brand accent |

**Note**: No `bg-surface-hover` token exists. Use `bg-surface` + hover states or `bg-gray-50` fallback where needed. No dark mode is configured (`@custom-variant dark` exists but no dark overrides defined), so dark-mode compatibility is not a concern for this migration.

**Decision**: Migrate admin components to use design tokens (`bg-surface`, `text-charcoal`, `text-muted`, `border-border`) to match `AdminLoginForm.tsx`. This unifies the design vocabulary across all admin surfaces.

---

# Phase 1: Foundation — IconPicker + Filter UI

**Goal**: Replace developer-facing icon input with visual picker, add search + sort UI for power users.
**Status**: ⬜ Pending
**Files**: `AdminServiceForm.tsx`, `IconPicker.tsx`, `AdminServicesManager.tsx`, `translations/en.json`, `translations/ar.json`

---

## [Step 1] Replace Icon Text Input with IconPicker

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**File**: `app/_components/website/_admin/AdminServiceForm.tsx`

### Changes:
- Import `IconPicker` from `@/app/_components/IconPicker`
- Import `getIcon` from `@/app/helpers/getIcon`
- Add state: `const [showIconPicker, setShowIconPicker] = useState(false)`
- Replace the text input for icon with a controlled pattern:
  ```tsx
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-charcoal">
      {fieldLabels.icon ?? "Icon"}
    </label>
    <button
      type="button"
      onClick={() => setShowIconPicker(true)}
      className="flex items-center gap-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold/40"
    >
      {icon ? (
        <>
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
            {React.createElement(getIcon(icon), { className: "w-5 h-5 text-gold" })}
          </div>
          <span className="text-charcoal font-mono text-xs">{icon}</span>
        </>
      ) : (
        <span className="text-muted">{placeholders.icon ?? "Choose an icon..."}</span>
      )}
    </button>
    {errors.icon && <p className="text-xs text-red-500 mt-1">{errors.icon}</p>}
  </div>

  <IconPicker
    value={icon}
    onChange={(iconName: string) => { setIcon(iconName); setShowIconPicker(false); }}
    open={showIconPicker}
    onOpenChange={setShowIconPicker}
  />
  ```

### IconPicker Refactoring (`app/_components/IconPicker.tsx`):
Refactor to use a **controlled component API** pattern — do not tightly couple modal state internally:

```tsx
interface Props {
  value: string;
  onChange: (iconName: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Design Updates to IconPicker:
- Use `rounded-xl` instead of `rounded-lg` for consistency
- Use `bg-green` for selected icon instead of `bg-mid-primary`
- Use `text-charcoal` for labels, `text-muted` for placeholders
- Replace hardcoded Arabic "ابحث عن أيقونة..." with translation key from `admin.services.picker.searchPlaceholder`
- Replace hardcoded Arabic "إغلاق" with translation key from `admin.editor.popupCancel`
- Add proper `focus:` styles: `focus:outline-none focus:ring-2 focus:ring-gold/40`
- Use `border-border` instead of `border-gray-400`
- Add `role="dialog"` and `aria-modal="true"` for accessibility
- Memoize the filtered icons list with `useMemo` (already done — keep it)

### Memoization Guidance:
- `getIcon` is called once per icon grid cell during render. The IconPicker grid shows ~600+ icons — avoid calling `getIcon` inside the render loop without memoization
- Use `useMemo` to pre-build the icon component map:
  ```tsx
  const iconComponents = useMemo(() => {
    const map = new Map<string, React.ComponentType>();
    filteredIcons.forEach((name) => {
      map.set(name, (FaIcons as Record<string, React.ComponentType>)[name]);
    });
    return map;
  }, [filteredIcons]);
  ```
- This avoids repeated property lookups during re-renders

### Acceptance Criteria:
- [ ] Icon text input replaced with button that shows selected icon preview
- [ ] Clicking button opens IconPicker modal
- [ ] Selecting an icon in picker sets value and closes modal
- [ ] IconPicker uses controlled API (`value/onChange/open/onOpenChange`)
- [ ] IconPicker styled with design tokens (not raw Tailwind grays)
- [ ] Icon memoized with `useMemo` to avoid repeated lookups

---

## [Step 2] Add Filter UI (Frontend Only)

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**File**: `app/_components/website/_admin/AdminServicesManager.tsx`

### Data Flow — Critical Order:

```
services (from API)
  → filteredServices (status filter + search query)
    → sortedServices (sort by name/order/status)
      → paginatedServices (slice for current page)
        → rendered rows
```

**Warning**: Pagination MUST happen LAST. Applying pagination before filtering/sorting creates inconsistent UI behavior — items disappear when filters change because the page slice is computed against the wrong dataset.

### Changes:
- Add filter state:
  ```tsx
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "order" | "status">("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  ```
- Add debounced search with `useDeferredValue`:
  ```tsx
  const deferredSearch = useDeferredValue(searchQuery);
  ```
  This prevents expensive filtering on every keystroke, especially important because filtering searches both Arabic and English titles.

- Update filtering logic:
  ```tsx
  const filteredServices = services.filter((service) => {
    // Status filter
    if (filterStatus === "active") return service.is_active;
    if (filterStatus === "inactive") return !service.is_active;

    // Search filter (both EN and AR titles)
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      const matchesEn = service.title_en?.toLowerCase().includes(q);
      const matchesAr = service.title_ar?.includes(q);
      if (!matchesEn && !matchesAr) return false;
    }

    return true;
  });
  ```

- Add sorting logic:
  ```tsx
  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = (locale === "ar" ? a.title_ar : a.title_en).localeCompare(
          locale === "ar" ? b.title_ar : b.title_en
        );
      } else if (sortBy === "order") {
        comparison = a.sort_order - b.sort_order;
      } else if (sortBy === "status") {
        comparison = Number(b.is_active) - Number(a.is_active);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredServices, sortBy, sortDirection, locale]);
  ```

- Update pagination to use `sortedServices` instead of `filteredServices`:
  ```tsx
  const paginatedServices = sortedServices.slice(
    (meta.page - 1) * meta.perPage,
    meta.page * meta.perPage
  );
  ```

### UI Placement:
- **Search input**: Left side of the toolbar, below header, above filter tabs
  - Placeholder: "Search services..." / "ابحث عن الخدمات..."
  - Icon: `FiSearch` on the left (or right in RTL)
- **Sort dropdown**: Right side, before "Add Service" button
  - Options: "Name A-Z", "Name Z-A", "Sort Order", "Status (Active first)", "Status (Inactive first)"
- **Keep existing status filter tabs** (All/Active/Inactive) — they work well

### Translations needed:
- `admin.services.filters.searchPlaceholder` — "Search services..." / "ابحث عن الخدمات..."
- `admin.services.filters.sortByNameAsc` — "Name A-Z" / "أ-ي"
- `admin.services.filters.sortByNameDesc` — "Name Z-A" / "ي-أ"
- `admin.services.filters.sortByOrder` — "Sort Order" / "ترتيب العرض"
- `admin.services.filters.sortByStatusActive` — "Active first" / "النشط أولاً"
- `admin.services.filters.sortByStatusInactive` — "Inactive first" / "غير النشط أولاً"

### Acceptance Criteria:
- [ ] Search input filters services by EN and AR title
- [ ] Search uses `useDeferredValue` (no lag on typing)
- [ ] Sort dropdown supports name, order, status sorting
- [ ] Pagination uses `sortedServices` (not `filteredServices`)
- [ ] Filter UI renders correctly in RTL mode
- [ ] Filter translations added to both `en.json` and `ar.json`

---

# Phase 2: Visual Cleanup — Contrast + Tokens + Hierarchy

**Goal**: Remove fake drag handle, fix color contrast, unify design tokens, normalize radius/shadows.
**Status**: ⬜ Pending
**Dependencies**: Phase 1 must be complete before starting
**Files**: `AdminServiceRow.tsx`, `AdminServiceForm.tsx`, `AdminServicesManager.tsx`, `AdminLoginForm.tsx`

---

## [Step 3] Remove Fake Drag Handle + Fix Row Actions

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**File**: `app/_components/website/_admin/AdminServiceRow.tsx`

### Changes:
- Remove `FiMenu` import
- Remove the non-functional drag handle div (lines 165-167):
  ```tsx
  // REMOVE this:
  <div className="cursor-grab text-gray-300 hover:text-gray-500 ml-1">
    <FiMenu className="w-4 h-4" />
  </div>
  ```
- Remove `opacity-0 group-hover:opacity-100` from the actions container — make actions **always visible**:
  ```tsx
  // BEFORE:
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

  // AFTER:
  <div className="flex items-center gap-1">
  ```
- Add `focus:` styles to edit and delete buttons:
  ```tsx
  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-gold/40"
  ```
- Remove `group` class from `<tr>` since hover opacity is no longer used

### Acceptance Criteria:
- [ ] Drag handle icon removed from all rows
- [ ] Row actions (edit/delete) always visible (no hover-only)
- [ ] Edit and delete buttons have visible focus rings
- [ ] `group` class removed from `<tr>`

---

## [Step 4] Fix Color Contrast + Pure Black Issues

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

### AdminServiceRow.tsx:
- Line 150: `text-gray-400` on `hover:bg-blue-50` — change to `text-muted` for consistent contrast
- Line 159: `text-gray-400` on `hover:bg-red-50` — change to `text-muted`
- Line 175: `bg-black/50` in delete dialog backdrop — change to `bg-charcoal/50` (brand-aligned dark)

### AdminServiceForm.tsx:
- Line 253: `bg-black/50` in form backdrop — change to `bg-charcoal/50`
- Line 248: `text-gray-900` on `bg-red-50` — change to `text-red-900` for better error context
- Line 248: `text-gray-400` placeholder on `bg-red-50` — change to `text-red-300`

### Acceptance Criteria:
- [ ] No `bg-black` or `bg-black/*` in admin components
- [ ] Error state text uses `text-red-900` (not `text-gray-900`)
- [ ] Error state placeholders use `text-red-300` (not `text-gray-400`)
- [ ] Action button icons use `text-muted` (not `text-gray-400`)

---

## [Step 5A] Safe Token Migration — Colors, Borders, Text, Backgrounds

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**Rationale**: Split from the original Step 5 to reduce risk. Colors and text tokens are low-risk changes — they don't affect layout or interaction. Radius and shadow changes (Step 5B) are higher risk because they affect visual hierarchy and need careful judgment.

### Token Mapping (Safe — No Layout Impact):

| Raw Tailwind | Token | Reason |
|---|---|---|
| `bg-gray-50` | `bg-bg` | Page background token |
| `bg-white` (in card containers) | `bg-surface` | Card surface token |
| `text-gray-900` | `text-charcoal` | Primary text token |
| `text-gray-700` | `text-charcoal/80` | Secondary text |
| `text-gray-600` | `text-muted` | Tertiary text |
| `text-gray-500` | `text-muted` | Table headers, labels |
| `text-gray-400` | `text-muted/70` | Placeholders, disabled |
| `border-gray-200` | `border-border` | Card/table borders |
| `border-gray-100` | `border-border/50` | Subtle dividers |
| `bg-gray-100` | `bg-gray-100` | Keep — no token equivalent, used for hover states |
| `bg-blue-100` / `bg-emerald-100` | Keep as-is | EN/AR badges — semantic colors, not neutral palette |
| `bg-red-50` | Keep as-is | Error state background — semantic |

### Apply to:
- `AdminServicesManager.tsx`:
  - Loading skeleton: `bg-gray-50` → `bg-bg`, `border-gray-200` → `border-border`, `bg-white` → `bg-surface`
  - Error state: `bg-gray-50` → `bg-bg`
  - Main page: `bg-gray-50` → `bg-bg`
  - Header: `bg-white` → `bg-surface`, `border-gray-200` → `border-border`
  - Empty state: `bg-white` → `bg-surface`, `border-gray-200` → `border-border`
  - Table container: `bg-white` → `bg-surface`, `border-gray-200` → `border-border`
  - Table header row: `bg-gray-50/50` → `bg-bg/50`, `border-gray-100` → `border-border/50`
  - Filter tabs: `bg-white` → `bg-surface`, `border-gray-200` → `border-border`, `text-gray-600` → `text-muted`, `hover:bg-gray-100` → keep

- `AdminServiceRow.tsx`:
  - Row hover: `hover:bg-gray-50/50` → `hover:bg-bg/50`
  - Row border: `border-gray-100` → `border-border/50`
  - Title text: `text-gray-900` → `text-charcoal`
  - Description text: `text-gray-500` → `text-muted`
  - Metric label text: `text-gray-400` → `text-muted/70`
  - Sort order badge: `bg-gray-100` → keep, `text-gray-600` → `text-muted`
  - Toggle inactive: `bg-gray-300` → keep (no token equivalent)
  - Edit button: `text-gray-400` → `text-muted/70`, `hover:bg-blue-50` → keep, `hover:text-blue-600` → keep
  - Delete button: `text-gray-400` → `text-muted/70`, `hover:bg-red-50` → keep, `hover:text-red-600` → keep
  - Delete dialog backdrop: `bg-black/50` → `bg-charcoal/50`
  - Delete dialog container: `bg-white` → `bg-surface`
  - Delete dialog title: `text-gray-900` → `text-charcoal`
  - Delete dialog body: `text-gray-600` → `text-muted`
  - Cancel button: `text-gray-600` → `text-muted`, `hover:bg-gray-100` → keep

- `AdminServiceForm.tsx`:
  - Form backdrop: `bg-black/50` → `bg-charcoal/50`
  - Form container: `bg-white` → `bg-surface`
  - Form header border: `border-gray-100` → `border-border/50`
  - Form title: `text-gray-900` → `text-charcoal`
  - Close button: `text-gray-400` → `text-muted/70`, `hover:bg-gray-100` → keep, `hover:text-gray-600` → `hover:text-muted`
  - Form body border: `border-gray-100` → `border-border/50`
  - Footer background: `bg-gray-50/50` → `bg-bg/50`
  - Cancel button: `text-gray-600` → `text-muted`, `hover:bg-gray-100` → keep
  - EN/AR badges: keep `bg-blue-100` / `bg-emerald-100` (semantic)
  - Character counter: `text-gray-400` → `text-muted/70`
  - Label text: `text-gray-700` → `text-charcoal/80`

- `AdminLoginForm.tsx`:
  - Already uses tokens — no changes needed (this is the reference)

### Acceptance Criteria:
- [ ] All admin components use design tokens for colors/borders/text
- [ ] No raw `text-gray-*` or `bg-gray-50` or `border-gray-200` in admin components
- [ ] `AdminLoginForm.tsx` unchanged (reference implementation)
- [ ] Semantic colors (`bg-blue-100`, `bg-red-50`) preserved

---

## [Step 5B] Radius and Shadow Normalization

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**Rationale**: Split from Step 5A because radius and shadow changes affect visual hierarchy. Not all `rounded-2xl` should become `rounded-xl` — modals benefit from larger radii for visual distinction from cards.

### Rules:
- **Modals** (form, delete dialog): Keep `rounded-2xl` — larger radius signals "overlay" vs "card"
- **Cards/containers** (table wrapper, empty state, login form): Use `rounded-xl` — consistent with design system
- **Buttons**: Use `rounded-xl` — already consistent
- **Inputs**: Use `rounded-xl` — already consistent
- **Badges/pills**: Use `rounded-md` or `rounded-lg` — already consistent
- **Shadows**:
  - Modals: `shadow-2xl` → `shadow-xl` (reduce from excessive, but keep prominent)
  - Cards: `shadow-sm` — already consistent (login form)
  - Table container: Remove `shadow` entirely — border is sufficient
  - Buttons: Remove `shadow-lg` — flat design is cleaner for admin UI

### Apply to:
- `AdminServiceForm.tsx`:
  - Modal container: Keep `rounded-2xl`, change `shadow-2xl` → `shadow-xl`
  - Input classes: Keep `rounded-xl`
  - Button classes: Keep `rounded-xl`

- `AdminServiceRow.tsx`:
  - Delete dialog container: Keep `rounded-2xl`, change `shadow-2xl` → `shadow-xl`

- `AdminServicesManager.tsx`:
  - Table container: `rounded-xl` — keep, no shadow change needed
  - Empty state: `rounded-xl` — keep
  - Header: No radius — keep
  - Filter tabs: `rounded-lg` — keep (pill shape is intentional)

- `AdminLoginForm.tsx`:
  - Already uses `rounded-2xl` + `shadow-sm` — keep as reference

### Acceptance Criteria:
- [ ] Modal containers use `rounded-2xl` + `shadow-xl`
- [ ] Card containers use `rounded-xl` (no `shadow-2xl`)
- [ ] Table container has no shadow (border-only)
- [ ] Buttons use `rounded-xl` (no `shadow-lg`)

---

# Phase 3: Interaction & Accessibility — Loading + Focus + i18n

**Goal**: Add toggle loading state, improve keyboard/screen reader support, translate all hardcoded strings.
**Status**: ⬜ Pending
**Dependencies**: Phase 2 must be complete before starting
**Files**: `AdminServiceRow.tsx`, `AdminServiceForm.tsx`, `AdminPagination.tsx`, `translations/en.json`, `translations/ar.json`

---

## [Step 6] Add Toggle Loading State with Error Handling

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

**File**: `app/_components/website/_admin/AdminServiceRow.tsx`

### Changes:
- Add state: `const [isToggling, setIsToggling] = useState(false)`
- Replace inline `onClick` with safe async handler:
  ```tsx
  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(service.id);
    } finally {
      setIsToggling(false);
    }
  };
  ```
- Update toggle button:
  ```tsx
  <button
    type="button"
    onClick={handleToggle}
    disabled={isToggling}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      service.is_active ? "bg-green" : "bg-gray-300"
    } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
    aria-label={service.is_active ? statusActive : statusInactive}
    aria-busy={isToggling}
    data-testid={`service-toggle-${service.id}`}
  >
    {isToggling ? (
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </span>
    ) : (
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          service.is_active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    )}
  </button>
  ```

### Error Handling:
- The parent's `handleToggleActive` already has try/catch and shows error toast via the hook
- The `finally` block ensures loading state always resets, even on failure
- No rollback needed — the hook's optimistic update is handled server-side

### Acceptance Criteria:
- [ ] Toggle shows spinner during API call
- [ ] Toggle is disabled during loading (no double-click)
- [ ] Loading state resets on success AND failure (`try/finally`)
- [ ] `aria-busy` attribute set during loading

---

## [Step 7] Accessibility Improvements

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

### 7A: Focus Management (No Manual Focus Trap)

**Rationale**: Manual focus traps are error-prone. Since `focus-trap-react`, Radix Dialog, and Headless UI are not installed, and adding new dependencies is a non-goal, use a **lightweight focus management pattern** that handles the most critical cases:

- On modal open: Move focus to the first interactive element (close button or first input)
- On modal close: Return focus to the element that opened the modal
- On Escape: Close modal (already implemented)

**File**: `AdminServiceForm.tsx`

```tsx
const openButtonRef = useRef<HTMLButtonElement | null>(null);

// Track what was focused before modal opened
useEffect(() => {
  if (isOpen) {
    openButtonRef.current = document.activeElement as HTMLButtonElement;
    // Focus first input after mount
    const firstInput = document.querySelector('[data-testid="service-form-icon"]');
    (firstInput as HTMLElement)?.focus();
  }
}, [isOpen]);

// Return focus on close
useEffect(() => {
  return () => {
    if (!isOpen && openButtonRef.current) {
      openButtonRef.current.focus();
    }
  };
}, [isOpen]);
```

**File**: `AdminServiceRow.tsx` (delete dialog)
- Same pattern: track opener, focus first button, return focus on close

### 7B: Sonner Accessibility Verification

**Action**: Sonner toasts are announced by screen readers via `aria-live="polite"` by default. No custom `aria-live` region needed.

**Verification**: Check that sonner's `Toaster` component is rendered with default settings (it is). No changes required.

### 7C: Pagination aria-current
- Add `aria-current="page"` to the active page button in `AdminPagination.tsx`

### Acceptance Criteria:
- [ ] Form modal focuses first input on open
- [ ] Form modal returns focus to opener on close
- [ ] Delete dialog focuses first button on open
- [ ] Delete dialog returns focus to opener on close
- [ ] Active pagination button has `aria-current="page"`
- [ ] Sonner toasts work without custom aria-live (verified)

---

## [Step 8] Translate Hardcoded Strings

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

### Translation Namespace Structure:

Organize new keys under clear namespaces to prevent translation sprawl:

```
admin.services.actions      — button labels, action text
admin.services.filters      — search, sort, filter labels
admin.services.dialogs      — confirmation dialogs, warnings
admin.services.form         — form labels, placeholders, validation
admin.services.picker       — icon picker specific strings
```

### Files to Update:

**`translations/en.json`** — add under `admin.services`:

```json
{
  "admin": {
    "services": {
      "actions": {
        "backToDashboard": "Back to Dashboard",
        "retry": "Retry",
        "cannotBeUndone": "This action cannot be undone."
      },
      "filters": {
        "searchPlaceholder": "Search services...",
        "sortByNameAsc": "Name A-Z",
        "sortByNameDesc": "Name Z-A",
        "sortByOrder": "Sort Order",
        "sortByStatusActive": "Active first",
        "sortByStatusInactive": "Inactive first"
      },
      "dialogs": {
        "confirmDelete": "Are you sure you want to delete this service?",
        "cannotBeUndone": "This action cannot be undone."
      },
      "picker": {
        "title": "Choose Icon",
        "searchPlaceholder": "Search icons...",
        "noResults": "No icons found",
        "close": "Close"
      }
    }
  }
}
```

**`translations/ar.json`** — add Arabic equivalents under the same structure.

### Strings to Replace in Code:
- "Back to Dashboard" → `admin.services.actions.backToDashboard`
- "Retry" → `admin.editor.popupCancel` (already exists) or `admin.services.actions.retry`
- "This cannot be undone" → `admin.services.dialogs.cannotBeUndone`
- IconPicker: "ابحث عن أيقونة..." → `admin.services.picker.searchPlaceholder`
- IconPicker: "إغلاق" → `admin.services.picker.close`
- Form toggle: "Active" / "Inactive" → `admin.common.statusActive` / `admin.common.statusInactive` (already exist)

### Acceptance Criteria:
- [ ] All hardcoded English strings replaced with translation keys
- [ ] All new keys added to `en.json` with proper namespace
- [ ] All new keys added to `ar.json` with Arabic translations
- [ ] No hardcoded text in admin components (except test IDs)

---

# Phase 4: Verification — Lint + Test + RTL Check

**Goal**: Ensure all changes compile, pass lint, and work in both LTR and RTL modes.
**Status**: ⬜ Pending
**Dependencies**: Phases 1, 2, 3 must be complete before starting

---

## [Step 9] Final Polish + Lint

**Status**: ⬜ Not Started → ⬜ In Progress → ✅ Done

### Checklist:
- [ ] Run `pnpm lint` — fix all ESLint errors
- [ ] Run `pnpm build` — verify TypeScript compilation succeeds
- [ ] Verify all `data-testid` attributes still present
- [ ] Check that IconPicker closes properly on overlay click and Escape
- [ ] Verify filter UI doesn't break pagination (test with 0 results, 1 result, full page)
- [ ] Ensure all focus states are visible and consistent
- [ ] Verify RTL layout for Arabic locale:
  - Search icon position (should flip in RTL)
  - Sort dropdown alignment
  - Filter tabs order
  - Form field directions (EN fields `dir="ltr"`, AR fields `dir="rtl"`)
  - Delete dialog button order

---

## Execution Order

```
Phase 1: Foundation
  ├── Step 1: IconPicker integration
  └── Step 2: Filter UI (search + sort)

Phase 2: Visual Cleanup
  ├── Step 3: Remove drag handle + fix row actions
  ├── Step 4: Color contrast fixes
  ├── Step 5A: Safe token migration (colors, borders, text, backgrounds)
  └── Step 5B: Radius and shadow normalization

Phase 3: Interaction & Accessibility
  ├── Step 6: Toggle loading state
  ├── Step 7: Accessibility improvements (focus, aria)
  └── Step 8: Translate hardcoded strings

Phase 4: Verification
  └── Step 9: Lint + build + RTL check
```

---

## Files Modified

| File | Phase | Steps | Changes |
|------|-------|-------|---------|
| `app/_components/website/_admin/AdminServiceForm.tsx` | 1, 2, 3 | 1, 4, 5A, 5B, 7 | IconPicker integration, color fixes, token migration, focus management |
| `app/_components/website/_admin/AdminServiceRow.tsx` | 2, 3 | 3, 4, 5A, 5B, 6, 7 | Remove drag handle, always-visible actions, color fixes, token migration, toggle loading, focus management |
| `app/_components/website/_admin/AdminServicesManager.tsx` | 1, 2, 3 | 2, 5A, 8 | Search + sort UI, debounced filtering, token migration, translation updates |
| `app/_components/website/_admin/AdminLoginForm.tsx` | 2 | 5A | Already uses tokens — verify consistency |
| `app/_components/IconPicker.tsx` | 1 | 1 | Controlled API, design token styling, memoization |
| `app/_components/website/_admin/AdminPagination.tsx` | 3 | 7 | Add `aria-current="page"` |
| `translations/en.json` | 1, 3 | 2, 8 | Add filter, action, dialog, picker translation keys |
| `translations/ar.json` | 1, 3 | 2, 8 | Add Arabic equivalents |

---

## Future Architecture Recommendations

**Not required in this implementation** — recommended if complexity continues growing:

### Custom Hooks Extraction

The `AdminServicesManager` component is becoming feature-heavy (filtering, sorting, pagination, CRUD, auth). Consider extracting into dedicated hooks:

- **`useServicesFilters`** — encapsulates status filter, search query, sort state, and the filtered/sorted/paginated computation
- **`useServiceActions`** — encapsulates create, update, delete, toggle operations with toast handling
- **`useServiceForm`** — encapsulates form state, validation, and submit logic

This would reduce `AdminServicesManager` from ~400 lines to ~150 lines of orchestration code.

### Backend Filtering

When backend filtering is ready, the filter UI will pass query params to the API:
- `?search=query&sort=name&direction=asc&status=active&page=1`
- The `useAdminServices` hook will handle the API call
- Client-side filtering/sorting logic will be removed from the manager

---

## What's Preserved (Existing Good Decisions)

- ✅ Search + sort together in the toolbar
- ✅ No confirmation dialog for activate/deactivate toggle (loading state is sufficient)
- ✅ IconPicker visual integration (replacing text input)
- ✅ Accessibility improvements (focus management, aria attributes)
- ✅ Translation cleanup (organized namespace structure)
- ✅ Client-side filtering for now (backend comes later)
- ✅ Bilingual form design (EN/AR paired fields with correct dir attributes)
- ✅ State coverage (loading, error, empty, saving states)
- ✅ Auth gate pattern (ServicesGate with httpOnly cookies)
