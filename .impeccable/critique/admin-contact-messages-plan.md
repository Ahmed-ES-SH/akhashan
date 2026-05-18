# Plan: Admin Contact Messages — Critique Fixes + Static Content

## Scope

Fix all 5 critique issues + minor observations + add two static data sections to give the page visual substance. No backend integration logic touched.

---

## 1. Extract shared `formatRelativeTime` utility

**File**: `app/helpers/formatRelativeTime.ts` (new)

- Move the duplicated `formatRelativeTime` function from `AdminMessageRow.tsx` and `AdminMessageDetail.tsx` into a shared helper.
- Support i18n: accept a `locale` prop or use relative time units that work in both EN/AR.
- Update both components to import from the helper.

---

## 2. Standardize icon vocabulary

**Files**: `AdminMessageDetail.tsx`, `AdminMessageRow.tsx`

- Replace inline SVGs with `react-icons` (FiArrowLeft, FiTrash2) to match the header's `FiArrowLeft`.
- `AdminMessageDetail.tsx:114-116`: inline chevron → `FiArrowLeft`
- `AdminMessageRow.tsx:109-111`: inline trash → `FiTrash2`

---

## 3. Fix low-contrast delete button hover

**File**: `AdminMessageRow.tsx:105`

- Change `text-gray-400` → `text-gray-500` for the default delete icon state.
- The hover state already uses `text-red-600` which is fine.

---

## 4. Enrich empty state

**File**: `AdminMessageList.tsx` (empty state block, ~line 91-97)

Current: plain text "No messages yet." / "No messages with this status."

Replace with a teaching empty state:
- Subtle icon (FiMail, large, muted)
- Primary message: "No messages yet"
- Secondary text: "Contact form submissions from visitors will appear here. You can filter, read, and manage inquiries."
- All strings from translations (add keys to `en.json` / `ar.json` under `admin.contactMessages.emptyState*`)

---

## 5. Add two static data sections

**File**: `AdminMessagesInbox.tsx` — insert between filter tabs and the list/detail content.

These sections are **static mock data only**, clearly separated from the API fetch logic. They sit above the inbox list to give the page visual weight and operational context.

### Section A: Inbox Summary Stats

A row of 4 compact stat cards showing message counts by status. Uses the brand's green/gold palette.

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Total     │    New      │   Replied   │  Archived   │
│    47       │     8       │     23      │     12      │
│  messages   │  unread     │   handled   │   stored    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

- Cards use `bg-white`, `border border-border`, `rounded-xl`
- Active status ("New") gets a subtle `bg-green/5` tint
- Numbers are bold charcoal, labels are muted
- Data is static/hardcoded (mock), not fetched

### Section B: Quick Actions

A compact panel with 3 action shortcuts for common admin tasks:

```
┌─────────────────────────────────────────────────────────┐
│  Quick Actions                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  FiDownload  │ │  FiCheck     │ │  FiUpload    │    │
│  │  Export CSV  │ │  Mark All    │ │  Import      │    │
│  │              │ │  as Read     │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

- Buttons are non-functional placeholders (no onClick handler, or a toast saying "Coming soon")
- Uses brand green for primary action, neutral for secondary
- All labels from translations

### Translation keys to add

In `en.json` and `ar.json` under `admin.contactMessages`:

```json
"summaryStats": {
  "title": "Overview",
  "total": "Total",
  "totalDesc": "messages",
  "new": "New",
  "newDesc": "unread",
  "replied": "Replied",
  "repliedDesc": "handled",
  "archived": "Archived",
  "archivedDesc": "stored"
},
"quickActions": {
  "title": "Quick Actions",
  "export": "Export CSV",
  "markAllRead": "Mark All as Read",
  "import": "Import"
},
"emptyState": {
  "title": "No messages yet",
  "description": "Contact form submissions from visitors will appear here. You can filter, read, and manage inquiries.",
  "titleFiltered": "No messages with this status",
  "descriptionFiltered": "Try selecting a different filter above."
}
```

---

## 6. Fix hardcoded header strings

**File**: `AdminContactMessagesPageClient.tsx`

- "Back to Dashboard" → use translation key `admin.services.actions.backToDashboard` (already exists)
- "Logout" → use translation key `userButton.logout` (already exists)

---

## 7. Brand color consistency in status badge

**File**: `AdminStatusBadge.tsx`

- "new" status currently uses `bg-blue-100 text-blue-800` and `AdminMessageRow.tsx` uses `bg-blue-500` dot.
- Change to brand green: `bg-green/10 text-green` for consistency with the brand palette.
- Keep "read" as neutral, "replied" as emerald (already brand-aligned), "archived" as amber.

---

## File Change Summary

| File | Change |
|------|--------|
| `app/helpers/formatRelativeTime.ts` | **New** — extracted utility |
| `app/_components/website/_admin/AdminMessageRow.tsx` | Import helper, fix icon, fix contrast |
| `app/_components/website/_admin/AdminMessageDetail.tsx` | Import helper, fix icon |
| `app/_components/website/_admin/AdminMessageList.tsx` | Enriched empty state |
| `app/_components/website/_admin/AdminMessagesInbox.tsx` | Add 2 static sections |
| `app/_components/website/_admin/AdminStatusBadge.tsx` | Brand color for "new" status |
| `app/_components/website/_admin/AdminContactMessagesPageClient.tsx` | Translate header strings |
| `translations/en.json` | Add translation keys |
| `translations/ar.json` | Add Arabic translation keys |

---

## Execution Order

1. Add translation keys to `en.json` / `ar.json`
2. Create `formatRelativeTime` helper, update both consumers
3. Fix icons in `AdminMessageRow` + `AdminMessageDetail`
4. Fix contrast in `AdminMessageRow`
5. Enrich empty state in `AdminMessageList`
6. Add two static sections in `AdminMessagesInbox`
7. Fix header strings in `AdminContactMessagesPageClient`
8. Update `AdminStatusBadge` colors
9. Run `pnpm lint` to verify
