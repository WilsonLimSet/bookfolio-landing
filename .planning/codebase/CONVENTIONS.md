# Coding Conventions

**Analysis Date:** 2026-02-24

## Naming Patterns

**Files:**
- PascalCase.tsx for React components (`FeedTabs.tsx`, `FollowButton.tsx`)
- camelCase.ts for utilities (`openLibrary.ts`, `cached.ts`)
- Next.js conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, `actions.ts`

**Functions:**
- camelCase for all functions (`getProfileStats`, `searchBooks`, `fetchWorkSubjects`)
- `handle` prefix for event handlers (`handleToggle`, `handleChange`)
- No special prefix for async functions

**Variables:**
- camelCase for variables (`activeTab`, `friendsActivity`, `isFollowing`)
- camelCase for constants (`supabaseUrl`, `supabaseAnonKey`)
- snake_case preserved for database fields (`user_id`, `cover_url`, `open_library_key`)

**Types:**
- PascalCase for interfaces/types (`BookSearchResult`, `SuggestedUser`)
- `Props` suffix for component props (`FeedTabsProps`, `FollowButtonProps`)
- No `I` prefix for interfaces
- `import type` syntax for type-only imports

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons required
- Double quotes for strings (`"use server"`, `"use client"`)
- No Prettier config (relies on ESLint/Next.js defaults)

**Linting:**
- ESLint 9 with flat config (`eslint.config.mjs`)
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Run: `npm run lint`

## Import Organization

**Order:**
1. External packages (react, next, @supabase)
2. Internal modules (`@/lib/*`, `@/components/*`)
3. Type imports (`import type { ... }`)

**Path Aliases:**
- `@/*` maps to `./src/*`

## Error Handling

**Patterns:**
- Try-catch for async Supabase operations (inconsistently applied)
- Check `.error` property on Supabase query results
- Optional chaining (`?.`) for nullable data
- `console.error()` for logging
- `alert()` used in some components for user-facing errors (should be toast)

**Error Boundaries:**
- `error.tsx` files at route level for graceful fallback

## Logging

**Framework:**
- `console.error()` for errors
- `console.log()` occasionally for debugging
- No structured logging library

## Comments

**When to Comment:**
- Complex algorithms (edition scoring in `openLibrary.ts`)
- Multi-step logic uses numbered comments (`// 1. Fetch editions`, `// 2. Score by popularity`)
- "Why" over "what" style

**TODO Comments:**
- Rarely used in codebase

## Function Design

**Parameters:**
- Destructured props for components: `function Component({ prop1, prop2 }: Props)`
- Object parameters for complex functions

**Return Values:**
- Early returns for guard clauses (auth checks, null data)
- Components return JSX or null

## Module Design

**Exports:**
- Default exports for page components (Next.js convention)
- Named exports for utility functions and non-page components
- `"use client"` directive at top of client components
- `"use server"` directive at top of server action files

**Server/Client Boundary:**
- Server components: Default (no directive), async, can fetch data
- Client components: `"use client"` directive, useState/useEffect/events
- Wrapper pattern: `HeaderWrapper.tsx` (server) wraps `Header.tsx` (client)

---

*Convention analysis: 2026-02-24*
*Update when patterns change*
