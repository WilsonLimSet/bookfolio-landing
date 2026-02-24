# Testing Patterns

**Analysis Date:** 2026-02-24

## Test Framework

**Status: No testing infrastructure present**

No test framework, test files, or testing dependencies exist in this codebase.

**Runner:**
- Not configured

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
npm run lint    # Only linting configured
```

## Test File Organization

**Location:**
- No test files exist (`*.test.ts`, `*.spec.ts`, `__tests__/` not found)

**Current structure has no tests:**
```
src/
  lib/
    openLibrary.ts          # No openLibrary.test.ts
    supabase/cached.ts      # No cached.test.ts
  components/
    RankingFlow.tsx          # No RankingFlow.test.tsx
    FeedTabs.tsx             # No FeedTabs.test.tsx
```

## Code Quality Tools

**ESLint:**
- ESLint 9 with flat config (`eslint.config.mjs`)
- Extends Next.js core-web-vitals + TypeScript rules
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Type checking via `next build` (no standalone `tsc` script)

## Coverage

**Requirements:**
- No coverage target
- No coverage tooling configured

## Test Types

**Unit Tests:**
- Not implemented
- High-value targets: `detectCategory()`, `editionPopularity()`, `extractTranslator()` in `src/lib/openLibrary.ts`

**Integration Tests:**
- Not implemented
- High-value targets: FeedTabs tab caching, follow/unfollow state, ranking flow

**E2E Tests:**
- Not implemented
- High-value targets: Auth flow, ranking flow, Goodreads import

## Recommended Setup (if implementing)

**Framework:** Vitest (ESM native, Next.js compatible) + React Testing Library

**Priority areas:**
1. `src/lib/openLibrary.ts` - Pure functions with clear inputs/outputs
2. `src/components/RankingFlow.tsx` - Binary search logic, score calculation
3. `src/app/import/page.tsx` - CSV parsing and validation
4. `src/lib/supabase/cached.ts` - Cache behavior

---

*Testing analysis: 2026-02-24*
*Update when test patterns change*
