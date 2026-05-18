# HOSTING_NOTIFICATION_EXPIRED

> Akhashan Backend — Frontend Integration Plan for Hosting Expiration Notification System
> Last updated: 2026-05-18

---

## 1. Overview

This feature lets the admin **set a hosting expiration date**. The backend automatically sends an **Arabic email** to `ADMIN_MAIL` **5 days before** expiration, addressed to **عبدالله**, with the remaining days count.

### What the Frontend Needs to Build

- A **Hosting Settings** page in the admin dashboard
- Date picker for `expiration_date`
- Toggle for `is_active` status
- Display computed values: days remaining, next notification date, last notification time

---

## 2. API Endpoints

**Base Path:** `/api/admin/hosting-config`
**Auth:** JWT + Admin role required

### 2.1 Get Hosting Config

| Method | URL |
|---|---|
| `GET` | `/api/admin/hosting-config` |

**Response (200):**
```json
{
  "id": 1,
  "expiration_date": "2026-06-15T00:00:00.000Z",
  "last_notified_at": null,
  "is_active": true,
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:00:00.000Z"
}
```

**Response (404):** If no config exists — call the seed endpoint first.

---

### 2.2 Update Hosting Config

| Method | URL |
|---|---|
| `PUT` | `/api/admin/hosting-config` |

**Request Body (all fields optional):**
```json
{
  "expiration_date": "2026-06-15T00:00:00.000Z",
  "is_active": true
}
```

**Response (200):** Updated `HostingConfig` object.

**Important:**
- Setting a new `expiration_date` automatically resets `last_notified_at` to `null`, which allows the notification cycle to restart for the new date.
- Setting `is_active: false` disables all notifications.

---

### 2.3 Seed Hosting Config

| Method | URL |
|---|---|
| `POST` | `/api/admin/hosting-config/seed` |

**Response (201):** `HostingConfig` with default values (`expiration_date` = 30 days from now, `is_active` = true).

**When to call:** Only when `GET` returns `404`.

---

## 3. Frontend Data Flow

```
Page Load:
  1. GET /api/admin/hosting-config
  2. If 404 → POST /api/admin/hosting-config/seed → GET again
  3. Display data in form

User Saves:
  1. User picks date + toggles status → clicks Save
  2. PUT /api/admin/hosting-config { expiration_date, is_active }
  3. Show success toast
  4. Refresh displayed data
```

---

## 4. Computed Fields (Frontend)

Calculate these from the API response:

```typescript
const now = new Date();
const expirationDate = new Date(config.expiration_date);
const daysRemaining = Math.ceil(
  (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
);

const nextNotificationDate = config.last_notified_at
  ? null  // Already notified for this cycle
  : new Date(expirationDate.getTime() - 5 * 24 * 60 * 60 * 1000);

const isExpired = daysRemaining <= 0;
```

---

## 5. Recommended UI

```
┌─────────────────────────────────────────────────┐
│  إعدادات الاستضافة                               │
├─────────────────────────────────────────────────┤
│                                                  │
│  تاريخ انتهاء الاستضافة                          │
│  ┌──────────────────────────────────────────┐   │
│  │  📅  2026-06-15  00:00                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  الحالة:   [● نشطة]  [○ غير نشطة]               │
│                                                  │
│  ─────────────────────────────────────────────   │
│                                                  │
│  آخر إشعار:    لم يتم الإرسال بعد                │
│  الإشعار القادم:  2026-06-10 (بعد 5 أيام)       │
│  الأيام المتبقية:  28 يوم                        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │          حفظ التغييرات                   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 6. TypeScript Interfaces

```typescript
interface HostingConfig {
  id: number;
  expiration_date: string;     // ISO 8601
  last_notified_at: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateHostingConfigRequest {
  expiration_date?: string;
  is_active?: boolean;
}

interface HostingConfigWithComputed extends HostingConfig {
  days_remaining: number;
  next_notification_date: string | null;
  is_expired: boolean;
}
```

---

## 7. Error Handling

| Scenario | Frontend Action |
|---|---|
| `GET` returns `404` | Call `POST /seed`, then `GET` again |
| `PUT` returns `400` | Show validation error (invalid date format) |
| `PUT` returns `401` / `403` | Redirect to login |
| Network error | Show retry toast |

---

## 8. Quick Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/hosting-config` | Get current config |
| `PUT` | `/api/admin/hosting-config` | Update expiration date / status |
| `POST` | `/api/admin/hosting-config/seed` | Seed default config |

**No new environment variables needed on the frontend.**
