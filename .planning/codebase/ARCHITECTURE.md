# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Next.js 16 Full-Stack App Router with Supabase Backend

**Key Characteristics:**
- Hybrid SSR + client-side interactive web application
- Server/client component boundary (React 19)
- Cookie-based auth with middleware session refresh
- Server-side caching with tag-based invalidation
- External API integration (OpenLibrary) with fetch caching

## Layers

**Middleware Layer:**
- Purpose: Session refresh on every request
- Contains: JWT token refresh via Supabase SSR
- Location: `middleware.ts`, `src/lib/supabase/middleware.ts`
- Used by: All routes

**Page Layer (Server Components):**
- Purpose: Data fetching, auth checks, SEO metadata
- Contains: Async server components that fetch data and render
- Location: `src/app/**/page.tsx`
- Depends on: Service layer, cached queries
- Used by: Browser (SSR output)

**API Layer:**
- Purpose: Auth callbacks, OG image generation
- Contains: Route handlers for non-page endpoints
- Location: `src/app/auth/**/route.ts`, `src/app/api/**/route.tsx`
- Depends on: Supabase auth SDK

**Component Layer (Client Components):**
- Purpose: Interactive UI, state management, mutations
- Contains: React components with `"use client"` directive
- Location: `src/components/*.tsx`
- Depends on: Browser Supabase client, component layer
- Used by: Page layer (composed into pages)

**Service Layer:**
- Purpose: Data access, external API integration, caching
- Contains: Supabase clients, cached query functions, OpenLibrary API
- Location: `src/lib/supabase/*.ts`, `src/lib/openLibrary.ts`
- Depends on: Supabase SDK, external APIs
- Used by: Page layer, component layer

**Server Actions:**
- Purpose: Server-side mutations triggered from client
- Contains: Auth actions, cache revalidation
- Location: `src/app/**/actions.ts`
- Depends on: Supabase server client
- Used by: Client components (form actions, onClick)

## Data Flow

**Page Load (Server-Rendered):**

1. Browser requests URL
2. Middleware refreshes JWT session (`middleware.ts`)
3. Server component fetches data via Supabase server client
4. Cached queries return data or hit DB (`src/lib/supabase/cached.ts`)
5. HTML streamed to browser with Suspense boundaries
6. Client components hydrate and become interactive

**Client Mutation (e.g., Follow):**

1. User clicks FollowButton
2. Optimistic UI update (immediate visual feedback)
3. Supabase insert/delete via browser client
4. Activity logged to `activity` table
5. Notification created in `notifications` table
6. `revalidateProfile()` server action invalidates cache tag
7. Next server request gets fresh data

**Book Search → Ranking:**

1. User searches via OpenLibrary API (`src/lib/openLibrary.ts`)
2. Selects book → navigates to `/book/[key]`
3. Book detail fetched (work + editions + author in parallel)
4. User clicks "Add to List" → RankingFlow modal opens
5. Steps: cover → category → tier → binary comparisons → review
6. `rank_book` RPC atomically inserts and recalculates scores
7. Activity logged, cache revalidated

**State Management:**
- Server: Supabase PostgreSQL (source of truth)
- Cache: `unstable_cache` with 60s TTL + tag-based invalidation
- Client: React useState/useRef for UI state, optimistic updates
- Tabs: FeedTabs caches loaded data via `useRef<Set>`

## Key Abstractions

**Supabase Server Client:**
- Purpose: Cookie-aware database access for server components
- Location: `src/lib/supabase/server.ts`
- Pattern: Factory function creating fresh client per request

**Supabase Browser Client:**
- Purpose: Client-side database access
- Location: `src/lib/supabase/client.ts`
- Pattern: Singleton (one client instance shared)

**Cached Query Functions:**
- Purpose: Expensive query results cached server-side
- Location: `src/lib/supabase/cached.ts`
- Pattern: `unstable_cache()` wrapper with revalidate tags
- Examples: `getProfileStats()`, `getLeaderboardData()`

**Server Actions:**
- Purpose: Server-side functions callable from client
- Location: `src/app/**/actions.ts`
- Pattern: `"use server"` directive, called via form actions or direct invocation

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Fonts, analytics, global CSS, metadata

**Middleware:**
- Location: `middleware.ts`
- Triggers: Every HTTP request (except static files)
- Responsibilities: Refresh Supabase JWT session

**Pages:**
- Location: `src/app/**/page.tsx`
- Triggers: URL navigation
- Responsibilities: Fetch data, render UI, SEO metadata

## Error Handling

**Strategy:** Mixed - no consistent pattern across codebase

**Patterns:**
- Server components: Try-catch with error boundaries (`error.tsx`)
- Client components: Try-catch in async handlers, some use `alert()` for errors
- Supabase: Check `.error` property on query results
- External APIs: Try-catch returning empty arrays/null on failure
- Loading states: `loading.tsx` files provide skeleton fallbacks

## Cross-Cutting Concerns

**Authentication:**
- Middleware-level JWT refresh on every request
- Server components check auth via `supabase.auth.getUser()`
- Client components check auth for conditional rendering
- Protected routes redirect to `/login` if unauthenticated

**Caching:**
- Server: `unstable_cache()` with 60s TTL and tag-based invalidation
- External: Next.js fetch cache with 24h-7d revalidate
- Client: useRef-based tab caching in FeedTabs

**Loading States:**
- `loading.tsx` at every route for instant navigation feedback
- Framer Motion skeleton components (`src/components/Skeleton.tsx`)
- Suspense boundaries for streamed server components

---

*Architecture analysis: 2026-02-24*
*Update when major patterns change*
