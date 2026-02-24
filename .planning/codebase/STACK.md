# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript 5.x - All application code (`tsconfig.json`, strict mode enabled)

**Secondary:**
- CSS - Tailwind CSS 4 with PostCSS (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js 23.x (current system)
- Next.js 16 server runtime (server components, edge runtime supported)

**Package Manager:**
- npm 11.x
- Lockfile: `package-lock.json` (v3) present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework with App Router (`next.config.ts`, `src/app/`)
- React 19.2.3 - UI component library with server/client boundary
- React DOM 19.2.3

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS (`@tailwindcss/postcss` plugin)
- Framer Motion 12.31.0 - Animations (`src/components/Skeleton.tsx`, `src/components/RankingFlow.tsx`)

**Testing:**
- Not implemented (no test framework configured)

**Build/Dev:**
- Next.js SWC - Rust-based compiler (built-in)
- ESLint 9 - Linting (`eslint-config-next` 16.1.6, flat config in `eslint.config.mjs`)
- Sharp - Image processing (via `@img/sharp-darwin-arm64`)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.93.3 - Database client (`src/lib/supabase/client.ts`)
- @supabase/ssr 0.8.0 - Server-side rendering integration (`src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`)

**Infrastructure:**
- @vercel/analytics 1.6.1 - Page view tracking (`src/app/layout.tsx`)
- @vercel/og 0.8.6 - Dynamic OG image generation (`src/app/api/og/[username]/route.tsx`)

## Configuration

**Environment:**
- `.env.local` - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- PostHog keys configured but currently empty

**Build:**
- `next.config.ts` - Image remotePatterns for OpenLibrary and Supabase
- `tsconfig.json` - ES2017 target, strict mode, path alias `@/*` -> `./src/*`

## Platform Requirements

**Development:**
- Any platform with Node.js 20+
- No external dependencies (no Docker, no local DB)

**Production:**
- Vercel - Next.js hosting with automatic deployments
- Supabase - Managed PostgreSQL + Auth + Storage

---

*Stack analysis: 2026-02-24*
*Update after major dependency changes*
