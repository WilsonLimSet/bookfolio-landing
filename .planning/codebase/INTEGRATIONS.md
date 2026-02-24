# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**Book Data:**
- Open Library API - Book search, metadata, editions, covers
  - Integration: Direct fetch with Next.js caching (`src/lib/openLibrary.ts`)
  - Endpoints: `/search.json`, `/{workKey}.json`, `/{workKey}/editions.json`, `/{authorKey}.json`
  - Covers: `https://covers.openlibrary.org/b/id/{coverId}-{size}.jpg`
  - Cache: 24h revalidate for work/edition/author data
  - Rate limits: None enforced, but editions capped at 200 results

- Google Books API - Fallback book descriptions
  - Integration: Direct fetch (`src/lib/openLibrary.ts`)
  - Endpoint: `https://www.googleapis.com/books/v1/volumes`
  - Cache: 7 days
  - Usage: When OpenLibrary description is missing or non-English

**Analytics:**
- Vercel Analytics - Page views and performance
  - Package: `@vercel/analytics/next` 1.6.1
  - Component: `<Analytics />` in `src/app/layout.tsx`

- PostHog - Product analytics (planned, not active)
  - Config: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (currently empty)

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client (server): `src/lib/supabase/server.ts` (cookie-aware)
  - Client (browser): `src/lib/supabase/client.ts` (singleton)
  - Cached queries: `src/lib/supabase/cached.ts` (`unstable_cache`, 60s revalidate)
  - RPC: `rank_book()`, `get_user_book_rank()`
  - Tables: profiles, user_books, follows, notifications, review_likes, review_comments, want_to_read, currently_reading, favorite_books, activity, referrals, book_lists, book_list_items

**File Storage:**
- Supabase Storage - User avatars
  - Bucket: `avatars`
  - Path: `{user_id}/avatar.{ext}`
  - Access: Public URLs via `getPublicUrl()`
  - Upload: `src/app/profile/edit/page.tsx` (upsert, max 2MB images)

**Caching:**
- Next.js `unstable_cache` - Server-side query caching
  - Profile stats: 60s, tag `profile-{id}` (`src/lib/supabase/cached.ts`)
  - Leaderboard: 60s, tag `leaderboard` (`src/lib/supabase/cached.ts`)
- Next.js fetch cache - External API responses (24h-7d)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password + OAuth
  - Implementation: `@supabase/ssr` with cookie-based sessions
  - Token storage: httpOnly cookies managed by middleware
  - Session management: JWT refresh on every request via `src/lib/supabase/middleware.ts`

**OAuth Integrations:**
- Google OAuth - Social sign-in
  - Configured in Supabase dashboard
  - Callback: `src/app/auth/callback/route.ts`
  - Post-OAuth username setup: `src/app/auth/setup-username/page.tsx`

## Monitoring & Observability

**Error Tracking:**
- None configured

**Analytics:**
- Vercel Analytics (active)
- PostHog (planned, not active)

**Logs:**
- Vercel logs (stdout/stderr)

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js app hosting
  - Deployment: Automatic on main branch push
  - Environment vars: Configured in Vercel dashboard

**CI Pipeline:**
- Not detected (no GitHub Actions workflows)

## Environment Configuration

**Development:**
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000`)
- Secrets: `.env.local` (gitignored)

**Production:**
- Secrets: Vercel environment variables
- Database: Supabase managed PostgreSQL

## Webhooks & Callbacks

**Incoming:**
- OAuth callback: `GET /auth/callback` - Exchanges OAuth code for session
- Email confirmation: `GET /auth/confirm` - Verifies email OTP token

**Outgoing:**
- None

## Social Sharing

**OG Image Generation:**
- Vercel OG (`@vercel/og` 0.8.6)
- Endpoint: `GET /api/og/[username]`
- Generates 800x420px images with avatar, username, book count, favorite covers
- Used for Twitter/OpenGraph social previews

---

*Integration audit: 2026-02-24*
*Update when adding/removing external services*
