# Plan: Align Subscription Code with Actual Backend Data Shape

## Objective

Update the frontend types, API, hook, and Topbar to match the real backend response shape.

## Changes Required

### 1. Types — `app/types/website/admin.types.ts`

**Current:**
```typescript
export interface AdminSubscriptionResponse {
  id: number;
  expires_at: string;
}

export interface AdminUpdateSubscriptionPayload {
  expires_at: string;
}
```

**New:**
```typescript
export interface AdminSubscriptionResponse {
  id: number;
  is_active: boolean;
  expiration_date: string;
  last_notified_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateSubscriptionPayload {
  expiration_date: string;
}
```

### 2. API — `app/helpers/api/adminApi.ts`

**Current:**
```typescript
export async function adminUpdateSubscription(
  data: AdminUpdateSubscriptionPayload,
): Promise<AdminSubscriptionResponse> {
  return api.put<
    AdminSubscriptionResponse,
    AdminUpdateSubscriptionPayload
  >("/api/admin/hosting-config", data, true);
}
```

Payload key must change from `expires_at` → `expiration_date` to match the type change above. Endpoint stays `/api/admin/hosting-config`.

### 3. Hook — `app/hooks/admin/useAdminSubscription.ts`

| Location | Old | New |
|---|---|---|
| state variable | `expiresAt` | `expirationDate` |
| field read from API response | `data.expires_at` | `data.expiration_date` |
| payload sent on update | `{ expires_at: newDate }` | `{ expiration_date: newDate }` |
| return property | `expiresAt` | `expirationDate` |

Also remove the `console.log(data)` on line 41.

### 4. Topbar — `app/_components/website/_admin/Topbar.tsx`

| Location | Old | New |
|---|---|---|
| destructured from hook | `expiresAt` | `expirationDate` |
| passed to SubscriptionPopup | `currentExpiry={expiresAt}` | `currentExpiry={expirationDate}` |
| line 26 | `console.log(expiresAt)` | remove |
| line 27 | `console.log(daysLeft)` | remove |

### 5. SubscriptionPopup — `SubscriptionPopup.tsx`

No changes needed — it already receives `currentExpiry: string | null` as a prop and works with any date string.

### Verification

- Run `pnpm lint` — should have 0 new errors/warnings from our files
- No console.log statements in production code