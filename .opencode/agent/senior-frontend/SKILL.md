# IntegrationLogic Skill

## Trigger

Use when the request mentions: **data flow, Server Components, Client Components, Route Handlers, server actions, data fetching, mutation, auth integration, caching, revalidation, backend-for-frontend (BFF), API wiring, or Laravel/NestJS integration**.

---

## Scope

This skill handles everything about **how the Next.js app talks to data sources and orchestrates behavior**:

- Server Components vs Client Components decision-making
- `fetch()` with Next.js cache semantics (`force-cache`, `no-store`, `revalidate`)
- Route Handlers (`app/api/*/route.ts`)
- Server Actions (form mutations, progressive enhancement)
- Backend-for-Frontend: proxying Laravel/NestJS API through Next.js
- Auth flow integration (NextAuth, JWT, middleware-based guards)
- Revalidation strategies (`revalidatePath`, `revalidateTag`, `unstable_cache`)
- Streaming with `Suspense` and `loading.tsx`

---

## Server vs Client Component Decision Tree

```
Is this component interactive (onClick, onChange, useState, useEffect)?
  YES → "use client"
  NO  → Server Component (default, no directive needed)

Does it need browser APIs (window, document, localStorage)?
  YES → "use client"
  NO  → Server Component

Does it fetch data?
  YES → fetch() in Server Component, no useEffect needed
  NO  → Keep it server-side if possible
```

---

## Data Fetching Patterns

### Server Component fetch (preferred)

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getDashboardData(token: string) {
  const res = await fetch(`${process.env.API_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  })

  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const data = await getDashboardData(session.accessToken)

  return <DashboardView data={data} />
}
```

### Route Handler (BFF proxy to Laravel/NestJS)

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? '1'

  const res = await fetch(`${process.env.API_URL}/api/orders?page=${page}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'application/json',
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
```

### Server Action (form mutation)

```typescript
// app/orders/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export async function createOrder(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  const parsed = CreateOrderSchema.safeParse({
    productId: formData.get('productId'),
    quantity: Number(formData.get('quantity')),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const res = await fetch(`${process.env.API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed.data),
  })

  if (!res.ok) return { error: 'Failed to create order' }

  revalidatePath('/orders')
  return { success: true }
}
```

---

## Auth Flow Integration (NextAuth + Laravel)

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        if (!res.ok) return null
        const { user, token } = await res.json()
        return { ...user, accessToken: token }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = user.accessToken
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
}
```

---

## Caching & Revalidation

```typescript
// Tag-based revalidation
const data = await fetch(`${process.env.API_URL}/api/products`, {
  next: { tags: ['products'] },
})

// Trigger revalidation from a server action or route handler
import { revalidateTag } from 'next/cache'
revalidateTag('products')

// Path-based revalidation
import { revalidatePath } from 'next/cache'
revalidatePath('/products')

// No cache (always fresh)
const live = await fetch(`${process.env.API_URL}/api/stats`, {
  cache: 'no-store',
})
```

---

## Streaming with Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import OrdersSkeleton from '@/components/skeletons/OrdersSkeleton'
import OrdersTable from '@/components/OrdersTable'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersTable />
      </Suspense>
    </div>
  )
}
```

---

## Notes

- **Never fetch in Client Components on mount** — use Server Components or React Query for client-side needs
- **BFF pattern** — expose only what the UI needs, never raw API pass-through
- **Token refresh** — handle 401 responses in a central fetch wrapper and trigger NextAuth session update
- **Parallel fetching** — use `Promise.all()` in Server Components to avoid sequential waterfalls
- **Type your API responses** — define response types matching your Laravel/NestJS DTOs
