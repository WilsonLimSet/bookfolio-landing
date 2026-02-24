# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
bookfolio-landing/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (fonts, analytics, CSS)
│   │   ├── page.tsx            # Homepage (/)
│   │   ├── globals.css         # Tailwind + PostCSS v4
│   │   ├── actions.ts          # Global server actions
│   │   ├── sitemap.ts          # SEO sitemap
│   │   ├── loading.tsx         # Root skeleton
│   │   ├── error.tsx           # Root error boundary
│   │   ├── api/                # Route handlers
│   │   ├── auth/               # Auth routes (callback, confirm, signout, setup)
│   │   ├── login/              # Login/signup
│   │   ├── feed/               # Authenticated feed
│   │   ├── profile/            # User profiles + edit
│   │   ├── book/               # Book detail pages
│   │   ├── review/             # Review detail pages
│   │   ├── lists/              # Book lists CRUD
│   │   ├── leaderboard/        # Rankings
│   │   ├── discover/           # User discovery
│   │   ├── import/             # Goodreads import
│   │   ├── share/              # Profile sharing
│   │   ├── blog/               # Blog pages
│   │   ├── privacy/            # Privacy policy
│   │   └── terms/              # Terms of service
│   │
│   ├── components/             # React components
│   │   ├── Header.tsx          # Navigation + search (client)
│   │   ├── HeaderWrapper.tsx   # Async server wrapper for Header
│   │   ├── FeedTabs.tsx        # Tabbed feed (friends/you/incoming)
│   │   ├── RankingFlow.tsx     # Multi-step ranking modal
│   │   ├── FollowButton.tsx    # Follow/unfollow
│   │   ├── LikeButton.tsx      # Review likes
│   │   ├── CommentSection.tsx  # Review comments
│   │   ├── BookSearch.tsx      # Book search
│   │   ├── BookCard.tsx        # Book display card
│   │   ├── BookCover.tsx       # Cover image
│   │   ├── EditionPicker.tsx   # Edition/cover selection
│   │   ├── Skeleton.tsx        # Loading skeletons
│   │   └── ...                 # Other components
│   │
│   └── lib/                    # Utilities & services
│       ├── supabase/
│       │   ├── server.ts       # SSR client (cookie-aware)
│       │   ├── client.ts       # Browser client
│       │   ├── middleware.ts   # Session refresh
│       │   └── cached.ts      # Cached queries
│       └── openLibrary.ts     # OpenLibrary API integration
│
├── public/                     # Static assets
├── middleware.ts               # Next.js middleware entry
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── eslint.config.mjs           # ESLint flat config
```

## Directory Purposes

**src/app/:**
- Purpose: Next.js App Router - pages, layouts, API routes, server actions
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `actions.ts`, `route.ts`
- Pattern: File-based routing with dynamic segments (`[username]`, `[key]`, `[id]`)

**src/components/:**
- Purpose: Reusable React components (both server and client)
- Contains: PascalCase `.tsx` files
- Key files: `RankingFlow.tsx` (1007 lines, most complex), `FeedTabs.tsx`, `Header.tsx`

**src/lib/:**
- Purpose: Shared utilities, service clients, API integrations
- Contains: camelCase `.ts` files
- Subdirectory: `supabase/` for all Supabase client configuration

**src/lib/supabase/:**
- Purpose: Supabase client factories and cached query functions
- Contains: `server.ts`, `client.ts`, `middleware.ts`, `cached.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout (fonts, analytics, metadata)
- `middleware.ts` - Session refresh middleware

**Configuration:**
- `next.config.ts` - Image remotePatterns, build config
- `tsconfig.json` - TypeScript options, path alias `@/*`
- `eslint.config.mjs` - ESLint 9 flat config
- `.env.local` - Environment variables (gitignored)

**Core Logic:**
- `src/lib/supabase/cached.ts` - Profile stats + leaderboard caching
- `src/lib/openLibrary.ts` - Book search, details, editions, category detection
- `src/components/RankingFlow.tsx` - Book ranking with binary search comparisons
- `src/components/FeedTabs.tsx` - Feed + notifications

**Auth:**
- `src/app/login/actions.ts` - Login/signup server actions
- `src/app/auth/callback/route.ts` - OAuth code exchange
- `src/app/auth/confirm/route.ts` - Email OTP verification
- `src/app/auth/setup-username/actions.ts` - Post-OAuth username creation

## Naming Conventions

**Files:**
- PascalCase.tsx - React components (`FollowButton.tsx`, `BookCard.tsx`)
- camelCase.ts - Utilities and services (`openLibrary.ts`, `cached.ts`)
- page.tsx / layout.tsx / loading.tsx / error.tsx - Next.js conventions
- route.ts - API route handlers
- actions.ts - Server actions

**Directories:**
- kebab-case - All directories (`setup-username`, `want-to-read`)
- `[param]` - Dynamic route segments

**Special Patterns:**
- `*Wrapper.tsx` - Async server component wrapping a client component
- `*Button.tsx` - Interactive action components with optimistic updates

## Where to Add New Code

**New Page:**
- Primary: `src/app/{route}/page.tsx`
- Loading: `src/app/{route}/loading.tsx`
- Error: `src/app/{route}/error.tsx`
- Actions: `src/app/{route}/actions.ts`

**New Component:**
- Implementation: `src/components/{ComponentName}.tsx`
- Add `"use client"` directive if interactive

**New API Route:**
- Implementation: `src/app/api/{endpoint}/route.ts`

**New Service/Utility:**
- Implementation: `src/lib/{serviceName}.ts`
- Supabase-related: `src/lib/supabase/{name}.ts`

## Special Directories

**.next/:**
- Purpose: Build output (generated by Next.js)
- Source: Auto-generated by `npm run build`
- Committed: No (gitignored)

**public/:**
- Purpose: Static assets served at root URL
- Committed: Yes

---

*Structure analysis: 2026-02-24*
*Update when directory structure changes*
