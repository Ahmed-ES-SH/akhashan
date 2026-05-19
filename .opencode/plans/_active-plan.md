# Plan: Admin Auth Refactor + Country Flag Select + Footer Dashboard Link

## Summary

This plan covers 5 tasks across multiple files:
1. Replace plain-text flag input with searchable country flag select (install `world-countries`)
2. Create a dedicated admin login page at `/{locale}/admin/login`
3. Remove inline login form gates from all admin pages, replace with redirect to login page
4. Add dashboard link in footer
5. Clean up unused `AdminLoginForm` component

---

## Phase 1 — Install `world-countries` & Create `CountryFlagSelect` Component

### Objective
Install a lightweight country data library and build a reusable searchable select component that shows country flags as emoji + name (EN/AR) so the admin can pick a flag instead of typing emoji manually.

### Files Affected
| File | Action |
|------|--------|
| `package.json` | Add `world-countries` dependency |
| `pnpm-lock.yaml` | Auto-updated on install |
| `app/_components/website/_admin/CountryFlagSelect.tsx` | **NEW** — reusable searchable country flag select |

### Code Changes

**1. Install package**
```bash
pnpm add world-countries
```

**2. Create `app/_components/website/_admin/CountryFlagSelect.tsx`**
```tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import countries from "world-countries";

// Derive emoji flag from ISO 3166-1 alpha-2 code
function getFlagEmoji(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

interface CountryOption {
  code: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
}

const allCountries: CountryOption[] = countries
  .filter((c) => c.cca2 && c.name?.common)
  .map((c) => ({
    code: c.cca2,
    nameEn: c.name.common,
    nameAr: (c.translations?.ara?.common as string) ?? c.name.common,
    emoji: getFlagEmoji(c.cca2),
  }))
  .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

interface CountryFlagSelectProps {
  value: string;
  onChange: (emoji: string) => void;
  locale: "en" | "ar";
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function CountryFlagSelect({
  value,
  onChange,
  locale,
  disabled = false,
  placeholder = "Search country...",
  className = "",
  error = false,
}: CountryFlagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => allCountries.find((c) => c.emoji === value) ?? null,
    [value],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allCountries;
    const q = search.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: CountryOption) => {
    onChange(option.emoji);
    setIsOpen(false);
    setSearch("");
  };

  const baseClasses =
    "w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:outline-none disabled:opacity-50";
  const borderClass = error
    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    : isOpen
      ? "border-gold ring-2 ring-gold/20"
      : "border-gray-200 hover:border-gray-300 focus:border-gold focus:ring-2 focus:ring-gold/20";

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${baseClasses} ${borderClass} flex items-center gap-3 cursor-pointer ${className}`}
      >
        {selected ? (
          <>
            <span className="text-xl leading-none">{selected.emoji}</span>
            <span className="text-gray-900">
              {locale === "ar" ? selected.nameAr : selected.nameEn}
            </span>
            <span className="ml-auto text-xs text-gray-400">
              {selected.code}
            </span>
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "ar" ? "ابحث عن دولة..." : "Search country..."}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none"
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                {locale === "ar" ? "لا توجد نتائج" : "No results found"}
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-gray-50 ${
                    option.emoji === value
                      ? "bg-gold/5 font-medium text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-xl leading-none">{option.emoji}</span>
                  <span>
                    {locale === "ar" ? option.nameAr : option.nameEn}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {option.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 2 — Replace Flag Input in `AdminCountryForm.tsx`

### Objective
Swap the plain `<input type="text">` for `flagEmoji` with the new `CountryFlagSelect` component. Remove manual flag_emoji validation since the select always returns valid emoji.

### Files Affected
| File | Action |
|------|--------|
| `app/_components/website/_admin/AdminCountryForm.tsx` | Modify — replace flag input |

### Code Changes

**In `AdminCountryForm.tsx`:**

1. Add import:
```tsx
import CountryFlagSelect from "./CountryFlagSelect";
```

2. Add `locale` prop to the component interface (it needs it for CountryFlagSelect):
```tsx
interface AdminCountryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateCountryPayload | AdminUpdateCountryPayload,
  ) => Promise<void>;
  initialData?: AdminCountry;
  isSaving: boolean;
  locale: "en" | "ar";  // ← ADD THIS
}
```

3. Destructure `locale` from props.

4. Replace the Flag Emoji section (lines 240-260) with:
```tsx
{/* Flag Emoji */}
<div className="space-y-1.5">
  <label className="text-sm font-medium text-gray-700">
    {fieldLabels.flagEmoji ?? "Flag Emoji"}
  </label>
  <CountryFlagSelect
    value={flagEmoji}
    onChange={setFlagEmoji}
    locale={locale}
    disabled={isSaving}
    placeholder={placeholders.flagEmoji ?? "Select a country..."}
    error={!!errors.flagEmoji}
  />
  {errors.flagEmoji && (
    <p className={errorTextClasses}>{errors.flagEmoji}</p>
  )}
</div>
```

5. Remove the `flagEmoji.length > 10` validation block (lines 87-92) — keep the rest of validation intact.

6. Update the `handleInputKeyDown` type to remove the `setFlagEmoji` reference (the CountryFlagSelect handles keyboard internally).

7. In `AdminCountriesManager.tsx`, pass `locale` to `AdminCountryForm`:
```tsx
<AdminCountryForm
  isOpen={isFormOpen}
  onClose={() => { ... }}
  onSave={handleSave}
  initialData={editingCountry}
  isSaving={isSaving}
  locale={locale}   // ← add this
/>
```

---

## Phase 3 — Create Admin Login Page

### Objective
Create a dedicated login page at `/{locale}/admin/login` so admin users have a proper login URL to visit. The admin layout will conditionally hide the Topbar on this route.

### Files Affected
| File | Action |
|------|--------|
| `app/[locale]/admin/login/page.tsx` | **NEW** — server component |
| `app/_components/website/_admin/AdminLoginPageClient.tsx` | **NEW** — login page client (reuses design from LoginPageClient) |
| `app/[locale]/admin/layout.tsx` | Modify — conditionally hide Topbar on login page |

### Code Changes

**1. Create `app/[locale]/admin/login/page.tsx`**
```tsx
import type { Metadata } from "next";
import { getServerTranslation } from "@/app/helpers/serverTranslation";
import { getSharedMetadata } from "@/app/helpers/SharedMetadata";
import AdminLoginPageClient from "@/app/_components/website/_admin/AdminLoginPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loginT = getServerTranslation(locale, "login");
  const meta = loginT?.meta as Record<string, string> | undefined;

  const title = meta?.title ?? "Admin Login";
  const description = meta?.description ?? "";
  const sharedMetaData = getSharedMetadata(title, description);

  return {
    title,
    description,
    ...sharedMetaData,
  };
}

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}) {
  const { locale } = await params;

  return <AdminLoginPageClient locale={locale} />;
}
```

**2. Create `app/_components/website/_admin/AdminLoginPageClient.tsx`**

A styled 2-column login page that uses the existing `useAuth` context (from admin layout's AuthProvider) directly — no nested AuthProvider:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useAdminLogin } from "@/app/hooks/admin/useAdminLogin";
import { AdminLoginForm } from "@/app/_components/website/_admin/AdminLoginForm";
import { useTranslation } from "@/app/hooks/useTranslation";
import { FiLock } from "react-icons/fi";

interface AdminLoginPageClientProps {
  locale: "en" | "ar";
}

export default function AdminLoginPageClient({
  locale,
}: AdminLoginPageClientProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { login, isLoading: isLoggingIn, error } = useAdminLogin();
  const router = useRouter();
  const adminT = useTranslation("admin");
  const loginSection = (adminT as Record<string, unknown>)?.login as
    | Record<string, string>
    | undefined;

  // Already authenticated — redirect to admin dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(`/${locale}/admin`);
    }
  }, [isAuthenticated, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green shadow-lg">
          <FiLock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {loginSection?.title ?? "Admin Login"}
          </h1>
          <p className="text-sm text-gray-500">
            {loginSection?.subtitle ?? "Sign in to access the admin panel"}
          </p>
        </div>
      </div>
      <AdminLoginForm
        onLogin={async (email, password) => {
          await login(email, password);
        }}
        isLoading={isLoggingIn}
        error={error}
      />
    </div>
  );
}
```

**3. Modify `app/[locale]/admin/layout.tsx`** — conditionally hide Topbar:

Add import:
```tsx
import { usePathname } from "next/navigation";
```

Inside component:
```tsx
const pathname = usePathname();
const isLoginPage = pathname?.endsWith("/login");
```

Wrap the Topbar render:
```tsx
{!isLoginPage && <Topbar />}
```

---

## Phase 4 — Remove Inline Login Form Gates, Replace with Redirect

### Objective
Replace the current pattern of showing an inline `AdminLoginForm` when unauthenticated with a redirect to `/{locale}/admin/login`. This removes the "form layer" from admin pages. After this, `AdminLoginForm` is no longer used and can be removed.

### Files Affected
| File | Action |
|------|--------|
| `app/_components/website/_admin/AdminCountriesPageClient.tsx` | Modify — replace gate with redirect |
| `app/_components/website/_admin/AdminServicesPageClient.tsx` | Modify — replace gate with redirect |
| `app/_components/website/_admin/AdminContactMessagesPageClient.tsx` | Modify — replace gate with redirect |
| `app/_components/website/_admin/AdminGate.tsx` | Modify — replace gate with redirect |
| `app/_components/website/_admin/AdminLoginForm.tsx` | **DELETE** — no longer used |

### Code Changes

For all 4 gate components, the pattern is the same:

**Before:**
```tsx
const { isLoading, isAuthenticated } = useAdminAuth();
const { login, isLoading: isLoggingIn, error: loginError } = useAdminLogin();

if (isLoading) {
  return <Spinner />;
}

if (!isAuthenticated) {
  return (
    <AdminLoginForm
      onLogin={async (email, password) => { await login(email, password); }}
      isLoading={isLoggingIn}
      error={loginError}
    />
  );
}

return <Content />;
```

**After:**
```tsx
const { isLoading, isAuthenticated } = useAdminAuth();
const router = useRouter();
const locale = useLocale();

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.replace(`/${locale}/admin/login`);
  }
}, [isLoading, isAuthenticated, locale, router]);

if (isLoading) {
  return <Spinner />;
}

if (!isAuthenticated) return null;

return <Content />;
```

**Specific changes per file:**

#### a) `AdminCountriesPageClient.tsx`
- Remove `useAdminLogin` import
- Add `useRouter` import from `next/navigation`
- Add `useLocale` import from `@/app/hooks/useLocale`
- Replace gate logic with redirect pattern
- Remove `AdminLoginForm` import

#### b) `AdminServicesPageClient.tsx`
- Same changes as above

#### c) `AdminContactMessagesPageClient.tsx`
- Same changes as above
- Note: this component doesn't take locale prop, but the gate uses `useLocale` hook

#### d) `AdminGate.tsx`
- Same changes as above
- Already imports `useLocale` from `@/app/hooks/useLocale`
- Remove `useAdminLogin` import
- Remove `AdminLoginForm` import
- Add `useRouter` import

#### e) Delete `AdminLoginForm.tsx`
- File: `app/_components/website/_admin/AdminLoginForm.tsx` — no longer referenced anywhere.

---

## Phase 5 — Add Dashboard Link in Footer

### Objective
Add a "Dashboard" link in the footer's Quick Links section that navigates to `/{locale}/admin`.

### Files Affected
| File | Action |
|------|--------|
| `translations/en.json` | Modify — add dashboard link to quickLinks |
| `translations/ar.json` | Modify — add dashboard link to quickLinks |

No component changes needed — Footer.tsx already renders the `quickLinks` array from translations.

### Code Changes

**In `translations/en.json`** — add to `home.footer.quickLinks` array:

After the privacy policy entry, add:
```json
{
  "href": "/admin",
  "label": { "en": "Dashboard", "ar": "لوحة التحكم" }
}
```

**In `translations/ar.json`** — same addition (the `label.ar` is already in Arabic in the same line):
```json
{
  "href": "/admin",
  "label": { "en": "Dashboard", "ar": "لوحة التحكم" }
}
```

---

## Verification Checklist

1. Run `pnpm lint` — must pass with no errors.
2. Run `pnpm build` — must succeed.
3. Open `/{locale}/admin` without being authenticated — should redirect to `/{locale}/admin/login`.
4. Open `/{locale}/admin/countries` without being authenticated — should redirect to login.
5. Open `/{locale}/admin/services` without being authenticated — should redirect to login.
6. Open `/{locale}/admin/contact-messages` without being authenticated — should redirect to login.
7. Login at `/{locale}/admin/login` — should authenticate and redirect to dashboard.
8. After login, navigate to countries page — open add/edit country modal — flag select should show all countries with search.
9. Select a country from the dropdown — emoji should be stored correctly.
10. Footer should display "Dashboard" / "لوحة التحكم" link that navigates to `/{locale}/admin`.