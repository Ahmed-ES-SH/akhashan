---
target: app/[locale]/admin/services/page.tsx
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-05-17T11-04-27Z
slug: app-locale-admin-services-page-tsx
---
# Critique: Admin Services Management Page

**Target**: `app/[locale]/admin/services/page.tsx`
**Register**: Product (admin CRUD interface)
**Date**: 2026-05-17

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading skeletons, error+retry, toasts present. Toggle switch has no in-flight state — click fires immediately with no visual feedback until toast. |
| 2 | Match System / Real World | 2 | "Icon" field asks for `"FiUsers"` (developer jargon). "Metric Value/Suffix/Label" are data model terms. `sort_order` exposes a database column name. |
| 3 | User Control and Freedom | 3 | Cancel, Escape, delete confirmation, back link present. No undo on delete. Form changes lost if modal closed accidentally. |
| 4 | Consistency and Standards | 2 | Login form uses `bg-surface`/`text-charcoal`/`rounded-lg`; admin uses `bg-gray-50`/`text-gray-900`/`rounded-xl`. Filter tabs are pill-shaped, buttons are `rounded-xl` — different shapes for similar interactive elements. |
| 5 | Error Prevention | 2 | Delete confirmation, maxLength, submit-time validation present. No required-field validation — can create empty service. No confirmation on toggle. No draft/autosave. |
| 6 | Recognition Rather Than Recall | 3 | All actions visible, filter tabs labeled, EN/AR badges clear. Icon field requires memorizing icon names — no picker or preview. No required vs optional field indicators. |
| 7 | Flexibility and Efficiency of Use | 1 | Only Ctrl+Enter and Escape accelerators. No keyboard shortcuts for add/edit/delete, no bulk actions, no inline editing, no text search, no column sorting. |
| 8 | Aesthetic and Minimalist Design | 2 | 12+ fields in form modal with no grouping. `shadow-2xl`, `backdrop-blur-sm`, gold icon backgrounds are decorative noise. 7 table columns including non-functional drag handle. |
| 9 | Error Recovery | 3 | Inline validation errors, error state with retry, toast errors. Validation only runs on submit, not on blur. Error messages generic. Form doesn't scroll to first error. |
| 10 | Help and Documentation | 1 | No help text, tooltips, or guidance. Icon placeholder says "e.g. FiUsers" but doesn't explain available icons. No help link. |
| **Total** | | **22/40** | **Acceptable (20–27 range)** |

---

## Anti-Patterns Verdict

**Does this look AI-generated?** Yes — it fails the product slop test. This reads like a Tailwind admin template with brand colors swapped in, not an interface a user fluent in Linear or Stripe would trust.

### LLM Assessment
- **`rounded-2xl` / `shadow-2xl` / `backdrop-blur-sm` on modals** — oversized radii and blur are decorative tells of template generation
- **`opacity-0 group-hover:opacity-100` on row actions** — ubiquitous Tailwind admin pattern; hides actions from touch and keyboard users
- **`FiMenu` drag handle that does nothing** — invented affordance for a standard task; the UI promises drag-and-drop it doesn't deliver
- **"Icon" field accepting `"FiUsers"` as text** — developer-facing pattern leaked into product admin
- **`bg-gold/10` icon backgrounds** — decorative where product UI should be neutral
- **Two colliding design vocabularies** — login form uses custom tokens (`bg-surface`, `text-charcoal`); all other components use raw Tailwind (`bg-gray-50`, `text-gray-900`)

### Deterministic Scan Results
6 findings across 2 files:

| File | Issue | Line |
|------|-------|------|
| AdminServiceRow.tsx | Pure black background (`bg-black`) | 175 |
| AdminServiceRow.tsx | Gray text on colored background (`text-gray-400` on `bg-blue-50`) | 150 |
| AdminServiceRow.tsx | Gray text on colored background (`text-gray-400` on `bg-red-50`) | 159 |
| AdminServiceForm.tsx | Pure black background (`bg-black`) | 253 |
| AdminServiceForm.tsx | Gray text on colored background (`text-gray-900` on `bg-red-50`) | 248 |
| AdminServiceForm.tsx | Gray text on colored background (`text-gray-400` on `bg-red-50`) | 248 |

Both assessments agree: the interface uses generic Tailwind patterns without intentional design decisions. The detector caught specific color contrast issues the LLM flagged as part of the broader consistency problem.

---

## Overall Impression

The page is structurally sound — auth gate, loading/error/empty states, CRUD operations all work. But it feels like a template, not a product. The biggest opportunity: **reduce the form from 12 overwhelming fields to grouped, scannable sections** and **unify the design vocabulary** between login and admin surfaces.

---

## What's Working

1. **Bilingual form design is thoughtful.** EN/AR badges with correct `dir="ltr"` / `dir="rtl"` on inputs, paired fields, and Arabic placeholders show genuine consideration for the Saudi context. This isn't an afterthought.

2. **State coverage is thorough.** Loading skeleton, error state with retry, empty state with CTA, saving state in form — all four critical states are handled. The skeleton approximates the table structure rather than a generic spinner.

3. **Auth gate is clean.** The `ServicesGate` pattern (loading → login → manager) inside an `AuthProvider` is architecturally sound. httpOnly cookies, no token in JS memory.

---

## Priority Issues

### [P1] Non-functional drag handle
**What**: `FiMenu` grip icon renders in every row (`AdminServiceRow.tsx:165`), implying drag-to-reorder. The `reorderServices` hook exists but is never connected.
**Why it matters**: This is a UI lie. It promises an interaction the interface doesn't deliver, breaking trust. Power users will try it and be frustrated.
**Fix**: Either implement drag-and-drop (`@dnd-kit/sortable`) or remove the icon entirely.
**Suggested command**: `impeccable polish`

### [P1] 12-field form with no grouping or progressive disclosure
**What**: The modal presents 12+ fields in one scrollable column (`AdminServiceForm.tsx:283-617`). No visual grouping, no sections, no "advanced" collapse.
**Why it matters**: 12 simultaneous decisions exceeds working memory (Cowan's limit of 4). Admins will skip fields, make errors, or abandon.
**Fix**: Group into sections: "Basic Info" (icon, titles), "Content" (descriptions, button labels), "Metrics" (value, suffix, labels, active). Use fieldsets or visual dividers.
**Suggested command**: `impeccable layout`

### [P1] Toggle switch has no confirmation or loading state
**What**: Clicking the toggle immediately calls `toggleActive(id)` with no confirmation and no in-flight visual state (`AdminServiceRow.tsx:127-141`).
**Why it matters**: This changes whether a service appears on the live website. One misclick and a service disappears or appears publicly. No loading state means the user doesn't know if the action succeeded until the toast.
**Fix**: Add optimistic loading state on the toggle (disable it, show spinner). Consider confirmation for deactivation.
**Suggested command**: `impeccable harden`

### [P2] Icon field asks admins to type component names
**What**: The icon input is a text field with placeholder "e.g. FiUsers" (`AdminServiceForm.tsx:289-301`).
**Why it matters**: This is a developer interface leaked into a product admin. Non-technical admins cannot use this.
**Fix**: Replace with a visual icon picker grid showing available icons with preview.
**Suggested command**: `impeccable shape`

### [P2] Two design vocabularies (login vs admin)
**What**: `AdminLoginForm.tsx` uses `bg-surface`, `text-charcoal`, `border-border`, `rounded-lg`. All other admin components use `bg-gray-50`, `text-gray-900`, `border-gray-200`, `rounded-xl`/`rounded-2xl`.
**Why it matters**: Feels like two different products. Undermines the "earned familiarity" bar.
**Fix**: Unify to a single token system. Pick one radius scale, one neutral palette, apply everywhere.
**Suggested command**: `impeccable colorize`

---

## Persona Red Flags

### Alex (Power User) — "I manage 50 services, I need to work fast"

1. **No inline editing** — Must open a modal, scroll through 12 fields, find the one to change, save, close. Repeat. For a single-field edit this is 8+ clicks per service.
2. **No keyboard shortcuts** — Only Escape and Ctrl+Enter work. No `N` for new, no quick-edit, no bulk actions.
3. **Non-functional drag handle** — Sees grip icon, tries to drag, nothing happens. Actively misleading.
4. **No text search** — 50 services, needs to find one by name. Must scan or filter by status only.
5. **Modal scroll tax** — 12 fields in `max-h-[65vh]` scrollable area means scrolling past 8 irrelevant fields to change one.

### Sam (Accessibility-Dependent User) — "I navigate with keyboard and screen reader"

1. **Hidden row actions** — `opacity-0 group-hover:opacity-100` on actions container. Keyboard tab reaches them but they're visually invisible.
2. **No visible focus indicators** — Form inputs have `focus:ring-2` (good). Row action buttons, filter tabs, logout button have no `focus:` styles.
3. **Focus not trapped in dialogs** — Modal opens, focus isn't moved into dialog. Can tab out of modal into background page.
4. **Color-only status on toggle** — Green vs gray for active/inactive. Low-vision users must rely on toggle position (4px translate difference).
5. **"Icon" column is noise** — Screen reader announces "Icon" then icon name string for every row. Zero useful information.

---

## Cognitive Load Assessment

**7/8 failures — HIGH cognitive load (critical fix needed)**

| # | Item | Result |
|---|------|--------|
| 1 | Single focus | FAIL — 12+ fields in form, 7 columns in table, competing elements |
| 2 | Chunking | FAIL — No visual grouping, EN/AR sequential but not grouped |
| 3 | Grouping | FAIL — Only `space-y-4` separates fields |
| 4 | Visual hierarchy | PARTIAL — Header clear, but every form field has equal weight |
| 5 | One thing at a time | FAIL — 12 decisions at once in form, 7 columns per row in table |
| 6 | Minimal choices | FAIL — 12+ visible fields (limit 4), 4 interactive elements per row |
| 7 | Working memory | FAIL — Must remember icon name format, what changed before saving |
| 8 | Progressive disclosure | FAIL — All fields shown, no "advanced" section, no optional collapsing |

---

## Minor Observations

1. `toastsRef` pattern is a workaround for useCallback dependency issues — functional but a code smell
2. Translation accessor pattern (`as Record<string, unknown>`) copy-pasted across three components — should be a typed hook
3. `eslint-disable react-hooks/set-state-in-effect` on form sync effect — a keyed form would be cleaner
4. Pagination buttons lack `aria-current="page"` on active page
5. "Back to Dashboard" link text is hardcoded English — should use translations
6. Form modal's `max-h-[65vh]` may exceed viewport on small screens
7. Delete confirmation missing "This cannot be undone" warning
8. No `aria-live` region for toast announcements — screen readers may not announce sonner toasts
9. `sort_order` column displays a number in a rounded badge — visually cute but adds no actionable information
10. Empty state microcopy is good: actionable and clear

---

## Questions to Consider

1. **Who is the "Icon" string field for?** If this is for a non-technical admin, asking them to type `"FiUsers"` is a failure. If it's for a developer, why is there an admin UI at all?

2. **Why are there 12 form fields for a service?** Does a recruitment company admin really need to set `metric_value`, `metric_suffix`, `metric_label_en`, and `metric_label_ar` independently? Or is the data model leaking into the UI?

3. **What happens when the admin has 200 services?** Pagination exists, but there's no search, no sort, no bulk actions. Status filter is the only narrowing mechanism.

4. **Is the toggle switch casual enough for its power?** One click changes whether a service appears on the live website. No confirmation, no undo, no loading state.
