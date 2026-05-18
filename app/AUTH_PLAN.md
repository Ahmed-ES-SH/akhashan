# AUTH PLAN — Login Page + Auth Context

> Akhashan Frontend — Authentication Implementation Plan
> Created: 2026-05-16
> Status: Waiting Approval

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Phase 1 — Types & Translation Keys](#phase-1--types--translation-keys)
4. [Phase 2 — Auth Context (httpOnly Cookie)](#phase-2--auth-context-httponly-cookie)
5. [Phase 3 — Auth API Client](#phase-3--auth-api-client)
6. [Phase 4 — Login Hook + Logic](#phase-4--login-hook--logic)
7. [Phase 5 — Login UI Components](#phase-5--login-ui-components)
8. [Phase 6 — Login Page + Metadata](#phase-6--login-page--metadata)
9. [Phase 7 — UserButton Component](#phase-7--userbutton-component)
10. [Phase 8 — Wire Up AdminGate](#phase-8--wire-up-admingate)
11. [Phase 9 — E2E Tests (Playwright)](#phase-9--e2e-tests-playwright)
12. [File Structure Summary](#file-structure-summary)
13. [API Contract](#api-contract)
14. [Risk & Edge Cases](#risk--edge-cases)

---

## 1. Overview

This plan covers the implementation of a **public login page** at `/[locale]/login` with:

- **Token strategy**: httpOnly cookie — no `access_token` stored in `localStorage` or JS-accessible memory. The backend sets the cookie on login; all subsequent requests use `credentials: "include"` so the browser sends it automatically.
- **Auth Context**: Simple React Context that holds the current `user` object + `isAuthenticated` state. The context does NOT hold the token.
- **Login flow**: User submits email/password → backend validates → sets httpOnly cookie → frontend calls `/auth/current-user` to hydrate context → redirects to `/admin`.
- **UserButton**: Avatar + dropdown with user data, links to `/admin/services`, `/admin/contact-messages`, and logout action.
- **Testing**: Playwright E2E tests covering happy path, validation, error states, and session persistence.

---

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Token storage | **httpOnly cookie** (set by backend) | Mitigates XSS token theft; no JS access needed |
| Auth header | **`credentials: "include"`** on all authenticated requests | Browser automatically attaches the cookie |
| User state | **React Context** (`AuthContext`) | Simple, no extra deps; holds user object + isAuthenticated |
| Token in context | **NO** — context never stores the token | Token stays in httpOnly cookie only |
| Session check on mount | Call `GET /auth/current-user` with `credentials: "include"` | Hydrates context from existing cookie |
| Form validation | **HTML5 + custom validation** (no zod to keep it simple) | Login form has 2 fields; zod adds unnecessary complexity |
| Toast on error | **sonner** (already in project) | Consistent with existing pattern |
| Redirection after login | `router.push("/{locale}/admin")` | Navigates to admin dashboard |
| Logout | `POST /auth/logout` with `credentials: "include"` → clears cookie → clears context | Backend clears the httpOnly cookie |

---

## Phase 1 — Types & Translation Keys

### Objective
Define TypeScript types for auth entities and add all login/auth UI strings to translation files.

### Files Affected
- `app/types/website/login.types.ts` — **NEW**
- `translations/en.json` — **MODIFY**
- `translations/ar.json` — **MODIFY**

### 1.1 TypeScript Types

**File:** `app/types/website/login.types.ts`

```typescript
// ============================================================================
// Auth Types — Login, User, Session
// ============================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: "admin" | "user";
  isEmailVerified: boolean;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 1.2 Translation Keys

**Add to `translations/en.json`:**

```json
{
  "login": {
    "meta": {
      "title": "Login — Abdullah Khashan Al-Shammari Recruitment",
      "description": "Admin panel login for Abdullah Khashan Al-Shammari Recruitment Company"
    },
    "page": {
      "title": "Welcome Back",
      "subtitle": "Sign in to access the admin dashboard"
    },
    "form": {
      "emailLabel": "Email Address",
      "emailPlaceholder": "Enter your email",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "rememberMe": "Remember me",
      "submitButton": "Sign In",
      "submittingButton": "Signing in..."
    },
    "errors": {
      "invalidEmail": "Please enter a valid email address",
      "invalidPassword": "Password must be at least 8 characters",
      "unauthorized": "Invalid email or password",
      "rateLimited": "Too many login attempts. Please try again later.",
      "serverError": "An unexpected error occurred. Please try again.",
      "required": "This field is required"
    },
    "success": {
      "loggedIn": "Welcome back, {name}"
    }
  },
  "userButton": {
    "profile": "My Profile",
    "adminServices": "Services",
    "adminContactMessages": "Contact Messages",
    "logout": "Sign Out",
    "logoutSuccess": "You have been signed out successfully",
    "loading": "Loading..."
  }
}
```

**Add to `translations/ar.json`:**

```json
{
  "login": {
    "meta": {
      "title": "تسجيل الدخول — شركة عبدالله خشّان الشمري للاستقدام",
      "description": "تسجيل دخول لوحة التحكم لشركة عبدالله خشّان الشمري للاستقدام"
    },
    "page": {
      "title": "مرحباً بعودتك",
      "subtitle": "سجل الدخول للوصول إلى لوحة التحكم"
    },
    "form": {
      "emailLabel": "البريد الإلكتروني",
      "emailPlaceholder": "أدخل بريدك الإلكتروني",
      "passwordLabel": "كلمة المرور",
      "passwordPlaceholder": "أدخل كلمة المرور",
      "rememberMe": "تذكرني",
      "submitButton": "تسجيل الدخول",
      "submittingButton": "جاري تسجيل الدخول..."
    },
    "errors": {
      "invalidEmail": "الرجاء إدخال بريد إلكتروني صالح",
      "invalidPassword": "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      "unauthorized": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      "rateLimited": "محاولات تسجيل دخول كثيرة. الرجاء المحاولة لاحقاً.",
      "serverError": "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.",
      "required": "هذا الحقل مطلوب"
    },
    "success": {
      "loggedIn": "مرحباً بعودتك، {name}"
    }
  },
  "userButton": {
    "profile": "الملف الشخصي",
    "adminServices": "الخدمات",
    "adminContactMessages": "رسائل التواصل",
    "logout": "تسجيل الخروج",
    "logoutSuccess": "تم تسجيل الخروج بنجاح",
    "loading": "جاري التحميل..."
  }
}
```

### Verification Checklist
- [ ] TypeScript compiles without errors (`pnpm lint`)
- [ ] Translation keys load correctly in both EN and AR
- [ ] Types are importable from `@/app/types/website/login.types`

---

## Phase 2 — Auth Context (httpOnly Cookie)

### Objective
Create a lightweight React Context that holds the current user state. The context NEVER stores the token — it relies on the httpOnly cookie set by the backend. The context provides `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, and `refreshUser()`.

### Files Affected
- `app/contexts/AuthContext.tsx` — **NEW**
- `app/providers/AuthProvider.tsx` — **NEW** (optional, can be merged into context)

### Implementation Details

**Key rules:**
- No token is stored in localStorage, sessionStorage, cookies (JS-accessible), or React state
- On mount, context calls `GET /auth/current-user` with `credentials: "include"` to check if a valid session exists
- `login()` calls `POST /auth/login` with `credentials: "include"` — backend sets the httpOnly cookie
- `logout()` calls `POST /auth/logout` with `credentials: "include"` — backend clears the cookie
- All authenticated API calls use `credentials: "include"` globally via the extended API client

**File:** `app/contexts/AuthContext.tsx`

```typescript
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loginUser, getCurrentUser, logoutUser } from "@/app/helpers/api/authApi";
import type { User, LoginPayload } from "@/app/types/website/login.types";
import { toast } from "sonner";

///////////////////////////////////////////////////////////////////////
/////////////// Auth Context — httpOnly cookie based //////////////////
/////////////// No token stored in JS memory / localStorage ///////////
///////////////////////////////////////////////////////////////////////

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /////////////////////////////////////////////////////////////////////
  ///////////// Check existing session on mount ///////////////////////
  /////////////////////////////////////////////////////////////////////

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Login — backend sets httpOnly cookie //////////////////
  /////////////////////////////////////////////////////////////////////

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginUser(payload);
      setUser(response.user);
      toast.success("login.success.loggedIn"); // translation key
      router.push(`/${locale}/admin`);
    },
    [locale, router],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Logout — backend clears httpOnly cookie ///////////////
  /////////////////////////////////////////////////////////////////////

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

**Note:** The `app/providers/AuthProvider.tsx` is not needed separately since the provider is co-located with the context. The `AuthProvider` will be wrapped around the admin layout or the root layout (admin-only for now).

### Integration with Root Layout

The `AuthProvider` should wrap only admin-related pages, not the public site. This can be achieved by creating a separate admin layout or wrapping it at the page level.

For simplicity in this plan, the `AuthProvider` will be used inside admin-related client components that need auth context.

### Verification Checklist
- [ ] Context functions without errors on mount (no token expected yet = user null)
- [ ] `refreshUser()` works when a valid cookie exists
- [ ] No token is accessible from JS (check: `window.localStorage`, `document.cookie`)
- [ ] TypeScript strict passes

---

## Phase 3 — Auth API Client

### Objective
Extend the base API client to support `credentials: "include"` on all requests and add auth-specific endpoints. The base `apiClient.ts` gets a new config option for credentials. New functions in `authApi.ts` handle login, current-user, and logout.

### Files Affected
- `app/helpers/api/apiClient.ts` — **MODIFY** (add `credentials` support)
- `app/helpers/api/authApi.ts` — **NEW**

### 3.1 Extend Base API Client

**File:** `app/helpers/api/apiClient.ts`

Add `withCredentials` option to `RequestConfig`:

```typescript
interface RequestConfig<B = Record<string, unknown>> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: B;
  locale?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  withCredentials?: boolean;  // NEW — enables credentials: "include"
}
```

Modify the `request` function to include `credentials: "include"` when `withCredentials` is `true`:

```typescript
const fetchInit: RequestInit = {
  method,
  headers,
  cache,
  next,
  credentials: config.withCredentials ? "include" : "same-origin",
};
```

Add new exported methods:

```typescript
export const api = {
  get: <T>(path: string, locale?: string, withCredentials?: boolean) =>
    request<T>(path, { method: "GET", locale, withCredentials }),

  post: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    locale?: string,
    withCredentials?: boolean,
  ) => request<T, B>(path, { method: "POST", body, locale, withCredentials }),

  // NEW methods for admin/authenticated calls
  put: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    withCredentials?: boolean,
  ) => request<T, B>(path, { method: "PUT", body, withCredentials }),

  patch: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    withCredentials?: boolean,
  ) => request<T, B>(path, { method: "PATCH", body, withCredentials }),

  delete: <T>(path: string, withCredentials?: boolean) =>
    request<T>(path, { method: "DELETE", withCredentials }),
};
```

### 3.2 Auth API Functions

**File:** `app/helpers/api/authApi.ts`

```typescript
import { api } from "./apiClient";
import type { User, LoginPayload, LoginResponse } from "@/app/types/website/login.types";

///////////////////////////////////////////////////////////////////////
/////////////// Auth API — all requests use credentials: "include" ////
/////////////// Backend manages the httpOnly cookie ///////////////////
///////////////////////////////////////////////////////////////////////

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return api.post<LoginResponse, LoginPayload>("/auth/login", payload, undefined, true);
}

export async function getCurrentUser(): Promise<User> {
  return api.get<User>("/auth/current-user", undefined, true);
}

export async function logoutUser(): Promise<void> {
  return api.post<void, Record<string, never>>("/auth/logout", {}, undefined, true);
}

export async function checkSession(): Promise<User | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}
```

### Verification Checklist
- [ ] `apiClient.ts` compiles with new `withCredentials` option
- [ ] `authApi.ts` exports all 4 functions
- [ ] Backend calls include `credentials: "include"` (check network tab)
- [ ] `put`, `patch`, `delete` methods work for other admin needs

---

## Phase 4 — Login Hook + Logic

### Objective
Create a `useLogin` hook that encapsulates login form state, validation, and submission logic. The hook calls the auth context's `login()` method and handles loading/error states.

### Files Affected
- `app/hooks/useLogin.ts` — **NEW**

### Implementation

**File:** `app/hooks/useLogin.ts`

```typescript
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import type { LoginPayload } from "@/app/types/website/login.types";

///////////////////////////////////////////////////////////////////////
/////////////// Login Form Hook — state, validation, submission ///////
///////////////////////////////////////////////////////////////////////

interface UseLoginReturn {
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  fieldErrors: { email?: string; password?: string };
  setEmail: (val: string) => void;
  setPassword: (val: string) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "login.errors.required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "login.errors.invalidEmail";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "login.errors.required";
  if (password.length < 8) return "login.errors.invalidPassword";
  return null;
}

export function useLogin(): UseLoginReturn {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    clearError();

    // Validate
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: LoginPayload = {
        email: email.trim(),
        password,
      };
      await login(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "login.errors.serverError";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, clearError]);

  return {
    email,
    password,
    error,
    isSubmitting,
    fieldErrors,
    setEmail,
    setPassword,
    handleSubmit,
    clearError,
  };
}
```

### Verification Checklist
- [ ] Hook returns all required state and handlers
- [ ] Validation catches empty/invalid fields
- [ ] Error state is properly set on API failure
- [ ] `isSubmitting` blocks double submission

---

## Phase 5 — Login UI Components

### Objective
Build a polished login page UI following the **Modern Gulf Corporate Premium** design system.

### Files Affected
- `app/_components/website/_login/LoginForm.tsx` — **NEW**
- `app/_components/website/_login/LoginPageLayout.tsx` — **NEW**

### 5.1 Login Page Layout

**File:** `app/_components/website/_login/LoginPageLayout.tsx`

A centered, two-column layout (desktop) with:
- Left side: Brand section — logo, company name, tagline (visual identity)
- Right side: Login form card
- Mobile: Single column stack (form only, brand collapsed)

**Design tokens used:**
- Background: `bg-bg` (off-white `#F8F9FA`)
- Card: `bg-surface` with subtle border `border-border`, rounded-2xl (`20px`), soft shadow
- Brand green: `text-green`, gold accent: `text-gold`
- Typography: H1 `clamp(2rem, 3vw, 2.8rem)` for "Welcome Back"

### 5.2 Login Form Component

**File:** `app/_components/website/_login/LoginForm.tsx`

```typescript
"use client";

import { useLogin } from "@/app/hooks/useLogin";
import { useTranslation } from "@/app/hooks/useTranslation";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";

export default function LoginForm() {
  const t = useTranslation("login");
  const {
    email, password, error, isSubmitting, fieldErrors,
    setEmail, setPassword, handleSubmit, clearError,
  } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      className="w-full max-w-md mx-auto"
      noValidate
    >
      {/* Fields */}
      {/* ... email input, password input, submit button ... */}
    </form>
  );
}
```

**Component breakdown:**
- Email field: Icon + input with validation state
- Password field: Icon + input + show/hide toggle
- Remember me checkbox (optional)
- Submit button: full-width, green primary, loading spinner state
- Error display: toast via sonner (in hook) + inline error message
- Gold accent separator line above submit

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Desktop (min-width: 1024px)                       │
│  ┌──────────────┐  ┌────────────────────────────┐  │
│  │   Brand Side  │  │     Form Card              │  │
│  │   (50%)       │  │   ┌──────────────────┐    │  │
│  │               │  │   │ Logo + Title      │    │  │
│  │  Logo         │  │   │ Email input       │    │  │
│  │  Company Name │  │   │ Password input    │    │  │
│  │  Tagline      │  │   │ Submit button     │    │  │
│  │               │  │   └──────────────────┘    │  │
│  └──────────────┘  └────────────────────────────┘  │
│                                                     │
│  Mobile: single column stack, brand section hidden  │
│  or compact at top                                  │
└─────────────────────────────────────────────────────┘
```

### Verification Checklist
- [ ] Form renders correctly in both EN (LTR) and AR (RTL)
- [ ] Input fields show validation errors
- [ ] Submit button shows loading state
- [ ] Responsive: single column on mobile, two columns on desktop
- [ ] Colors match brand palette (green #0E5A43, gold #C8A96B, charcoal)

---

## Phase 6 — Login Page + Metadata

### Objective
Create the actual Next.js page at `app/[locale]/login/page.tsx` with proper metadata, loading, and error states.

### Files Affected
- `app/[locale]/login/page.tsx` — **MODIFY** (currently empty)
- `app/[locale]/login/loading.tsx` — **NEW**
- `app/[locale]/login/error.tsx` — **NEW**

### 6.1 Page Component

**File:** `app/[locale]/login/page.tsx`

```typescript
import { Metadata } from "next";
import { getServerTranslation } from "@/app/helpers/serverTranslation";
import { getSharedMetadata } from "@/app/helpers/SharedMetadata";
import LoginPageClient from "@/app/_components/website/_login/LoginPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerTranslation(locale, "login");
  const meta = t?.meta;

  const title = meta?.title ?? "";
  const description = meta?.description ?? "";
  const sharedMetaData = getSharedMetadata(title, description);

  return {
    title,
    description,
    ...sharedMetaData,
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LoginPageClient locale={locale} />;
}
```

### 6.2 Client Wrapper

**File:** `app/_components/website/_login/LoginPageClient.tsx`

A client component that wraps the login form with the AuthProvider:

```typescript
"use client";

import { AuthProvider } from "@/app/contexts/AuthContext";
import LoginForm from "./LoginForm";

export default function LoginPageClient({ locale }: { locale: string }) {
  return (
    <AuthProvider locale={locale}>
      <LoginForm />
    </AuthProvider>
  );
}
```

### 6.3 Loading State

**File:** `app/[locale]/login/loading.tsx`

Skeleton UI with a centered spinner placeholder matching the login page layout.

### 6.4 Error State

**File:** `app/[locale]/login/error.tsx`

Error boundary that shows a friendly error message with retry button, styled in the brand theme.

### Verification Checklist
- [ ] `generateMetadata` returns correct title/description per locale
- [ ] Page renders the login form
- [ ] Loading skeleton appears during client hydration
- [ ] Error boundary catches and displays errors gracefully

---

## Phase 7 — UserButton Component

### Objective
Create a `UserButton` component that shows the current user's avatar/name and a dropdown menu with links to admin pages and logout. This component will be used in the admin layout/header.

### Files Affected
- `app/_components/website/_admin/UserButton.tsx` — **NEW**

### Component Specification

**File:** `app/_components/website/_admin/UserButton.tsx`

```
┌──────────────────────┐
│  [Avatar] John Doe ▾ │  ← Always visible in header
└──────────────────────┘
         │
         ▼ (click)
┌──────────────────────┐
│  John Doe            │  ← User name + email
│  admin@example.com   │
│──────────────────────│
│  📊 Services         │  → /{locale}/admin/services
│  📬 Contact Messages │  → /{locale}/admin/contact-messages
│──────────────────────│
│  🚪 Sign Out         │  → logout() + redirect to login
└──────────────────────┘
```

**Props:** None — reads from `useAuth()` context

**States:**
- **Loading**: Skeleton circle + text pulse
- **Authenticated**: Avatar (initials fallback) + name + dropdown
- **Dropdown open**: Backdrop click or Escape to close
- **Logout**: Calls `auth.logout()` → redirects to login

**Interaction:**
- Click avatar/name to toggle dropdown
- Click outside or Escape to close
- "Sign Out" calls logout API and clears context
- Links navigate to admin pages via `next/navigation`

**Translation keys used:** `userButton.*`

### Verification Checklist
- [ ] Shows user initials when no avatar
- [ ] Dropdown opens/closes correctly
- [ ] Navigation links work
- [ ] Logout clears context and redirects
- [ ] RTL layout works (dropdown flips to right side)

---

## Phase 8 — Wire Up AdminGate

### Objective
Implement the existing `AdminGate` component's dependencies (`useAdminAuth`, `useAdminLogin` hooks) so the admin page works end-to-end. These hooks will now delegate to the `AuthContext` instead of managing their own state.

### Files Affected
- `app/hooks/admin/useAdminAuth.ts` — **NEW**
- `app/hooks/admin/useAdminLogin.ts` — **NEW**

### 8.1 useAdminAuth

```typescript
"use client";

import { useAuth } from "@/app/contexts/AuthContext";

export function useAdminAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
```

### 8.2 useAdminLogin

```typescript
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import type { LoginPayload } from "@/app/types/website/login.types";

export function useAdminLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const payload: LoginPayload = { email, password };
        await login(payload);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "login.errors.serverError");
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );

  return {
    login: handleLogin,
    isLoading,
    error,
  };
}
```

### Verification Checklist
- [ ] `AdminGate` component renders login form when not authenticated
- [ ] `AdminGate` renders dashboard when authenticated
- [ ] Login form calls hook and shows loading/error states
- [ ] Logout clears session and returns to login form

---

## Phase 9 — E2E Tests (Playwright)

### Objective
Add Playwright E2E tests covering the login flow:
1. Happy path — successful login → redirect to /admin
2. Validation — empty fields show errors
3. Invalid credentials — show error toast
4. Session persistence — logged-in user can navigate to /admin directly
5. Logout flow — logout → clear session → redirect to login

### Files Affected
- `e2e/specs/login.spec.ts` — **NEW**
- `e2e/pages/login.page.ts` — **NEW** (Page Object Model)
- `e2e/fixtures/login-auth.ts` — **NEW** (optional, if separate fixture needed)

### 9.1 Page Object

**File:** `e2e/pages/login.page.ts`

```typescript
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  // Brand elements
  readonly pageTitle: Locator;
  readonly brandLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error");
    this.pageTitle = page.getByTestId("login-page-title");
    this.brandLogo = page.getByTestId("login-brand-logo");
  }

  async navigate(locale: string = "ar") {
    await this.page.goto(`/${locale}/login`);
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async waitForRedirect(timeout: number = 10000): Promise<string> {
    await this.page.waitForURL(/\/admin/, { timeout });
    return this.page.url();
  }
}
```

### 9.2 Test Scenarios

**File:** `e2e/specs/login.spec.ts`

| # | Test | Description |
|---|---|---|
| 1 | Display login page | Page loads with form fields, brand elements, and submit button |
| 2 | Successful login | Valid credentials → redirect to /admin |
| 3 | Empty fields validation | Submit with empty fields → show validation errors |
| 4 | Invalid email format | Enter malformed email → show email error |
| 5 | Wrong credentials | Invalid email/password → show auth error toast |
| 6 | Password visibility toggle | Click eye icon → password becomes visible |
| 7 | Loading state during submission | Submit → button shows spinner, fields disabled |
| 8 | Session persistence | Login once → navigate to /admin directly → stays authenticated |
| 9 | Logout flow | Login → click UserButton → logout → redirected to login |
| 10 | RTL layout | Arabic locale → form is RTL aligned |

### 9.3 Test Data Setup

- Use a dedicated test admin account seeded in the backend
- Environment variables:
  ```env
  TEST_ADMIN_EMAIL=admin@test.com
  TEST_ADMIN_PASSWORD=password123
  API_URL=http://localhost:5000
  FRONTEND_URL=http://localhost:3000
  ```

### Verification Checklist
- [ ] All 10 test scenarios pass
- [ ] Tests run with `pnpm exec playwright test`
- [ ] Tests handle both EN and AR locales
- [ ] No flaky tests (retry logic for network-dependent tests)

---

## File Structure Summary

```
app/
├── types/
│   └── website/
│       └── login.types.ts                    # [NEW] Auth types
├── contexts/
│   └── AuthContext.tsx                        # [NEW] Auth context (httpOnly cookie based)
├── helpers/
│   └── api/
│       ├── apiClient.ts                      # [MODIFY] Add withCredentials, put/patch/delete
│       └── authApi.ts                        # [NEW] Auth API functions
├── hooks/
│   ├── useLogin.ts                           # [NEW] Login form logic hook
│   └── admin/
│       ├── useAdminAuth.ts                   # [NEW] Admin auth gate hook
│       └── useAdminLogin.ts                  # [NEW] Admin login hook
├── _components/
│   └── website/
│       ├── _login/
│       │   ├── LoginForm.tsx                 # [NEW] Login form UI
│       │   └── LoginPageClient.tsx            # [NEW] Client page wrapper with AuthProvider
│       └── _admin/
│           └── UserButton.tsx                 # [NEW] User avatar + dropdown
├── [locale]/
│   └── login/
│       ├── page.tsx                          # [MODIFY] Login page with generateMetadata
│       ├── loading.tsx                       # [NEW] Loading skeleton
│       └── error.tsx                         # [NEW] Error boundary

e2e/
├── pages/
│   └── login.page.ts                         # [NEW] Login page object
├── specs/
│   └── login.spec.ts                         # [NEW] Login E2E tests
└── fixtures/
    └── login-auth.ts                         # [NEW] Auth fixture for tests

translations/
├── en.json                                   # [MODIFY] Add login.* and userButton.*
└── ar.json                                   # [MODIFY] Add login.* and userButton.*
```

---

## API Contract

| Action | Method | Endpoint | Auth | Credentials |
|---|---|---|---|---|
| Login | POST | `/auth/login` | Public | `include` |
| Get current user | GET | `/auth/current-user` | httpOnly cookie | `include` |
| Logout | POST | `/auth/logout` | httpOnly cookie | `include` |

### Login Request
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Login Response (200)
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "avatar": null,
    "role": "admin",
    "isEmailVerified": true
  },
  "message": "Login successful"
}
```

### Current User Response (200)
```json
{
  "id": 1,
  "email": "admin@example.com",
  "name": "Admin User",
  "avatar": null,
  "role": "admin",
  "isEmailVerified": true
}
```

### Error Response (4xx/5xx)
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

---

## Risk & Edge Cases

| Risk | Impact | Mitigation |
|---|---|---|
| httpOnly cookie not set by backend | Auth never works | Verify backend sets `Set-Cookie` header with `HttpOnly; Secure; SameSite=Lax` |
| CORS blocks credentials | Login API fails | Backend must set `Access-Control-Allow-Origin` + `Access-Control-Allow-Credentials: true` |
| Session expires mid-session | API calls fail | Catch 401 responses globally → clear context → redirect to login |
| Rate limiting (5 per 6 hours) | User locked out | Show clear error message with retry time from backend |
| Cookie not sent on first request | SSR hydration mismatch | Auth check only runs client-side (`useEffect`) |
| Multiple tabs sharing cookie | Logout in one tab doesn't affect another | Polling or broadcast channel (future enhancement) |
| Backend sends empty user on 401 | Edge case | Handle gracefully — set user to null, no crash |
| RTL form layout issues | AR locale shows broken UI | Test RTL extensively; use `dir="auto"` on inputs if needed |

---

## Implementation Order

```
Phase 1: Types + Translation Keys            → Foundation
Phase 2: Auth Context (httpOnly Cookie)       → State management
Phase 3: Auth API Client                      → Data layer
Phase 4: Login Hook + Logic                   → Business logic
Phase 5: Login UI Components                  → UI
Phase 6: Login Page + Metadata                → Page assembly
Phase 7: UserButton Component                 → Admin nav component
Phase 8: Wire Up AdminGate                    → Integration
Phase 9: E2E Tests (Playwright)               → Quality assurance
```

Each phase is independently testable and can be reviewed separately.

---

## Success Criteria

- [ ] Admin can login at `/[locale]/login` with valid credentials
- [ ] Login sets httpOnly cookie (backend responsibility) — no token in JS
- [ ] After login, user is redirected to `/[locale]/admin`
- [ ] UserButton shows user data with links to `/admin/services`, `/admin/contact-messages`
- [ ] Logout clears session and redirects to login
- [ ] Unauthenticated users cannot access admin pages
- [ ] All UI strings are in translation files (EN + AR)
- [ ] TypeScript strict passes — no `any` types
- [ ] `pnpm lint` passes with zero errors
- [ ] Playwright E2E tests pass (login happy path + validation + session persistence)
- [ ] Responsive: login page works on mobile and desktop
