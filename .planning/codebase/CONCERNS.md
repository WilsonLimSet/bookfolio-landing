# Codebase Concerns

**Analysis Date:** 2026-02-24

## Tech Debt

**Large components without decomposition:**
- Issue: Several components exceed 500+ lines with complex state management
- Files: `src/components/RankingFlow.tsx` (1007 lines, 17 useState hooks), `src/app/profile/edit/page.tsx` (851 lines), `src/app/import/page.tsx` (574 lines)
- Impact: Hard to maintain, test, and modify without unintended side effects
- Fix approach: Extract sub-components (e.g., CoverStep, TierStep, ComparisonStep from RankingFlow)

**`alert()` for error messages:**
- Issue: Browser `alert()` used for user-facing errors instead of toast/inline messages
- Files: `src/app/profile/edit/page.tsx`, `src/components/AddToListModal.tsx`, `src/components/CommentSection.tsx`
- Impact: Jarring UX, blocks UI thread, not dismissible
- Fix approach: Implement toast notification system

**Inconsistent error handling:**
- Issue: Different patterns used across codebase (try-catch, .error check, silent failures)
- Files: `src/components/RankingFlow.tsx` (no try-catch in saveBook), `src/lib/openLibrary.ts` (silent catch returning []), `src/app/login/actions.ts` (.error property)
- Impact: Silent failures, inconsistent user feedback, hard to debug
- Fix approach: Standardize on try-catch with consistent error return pattern

## Known Bugs

**No critical bugs identified during static analysis.**

## Security Considerations

**Missing server-side input validation:**
- Risk: Client-side validation only for username, reading goal, ratings
- Files: `src/app/login/actions.ts` (username not re-validated server-side), `src/app/profile/edit/page.tsx` (reading goal unbounded), `src/app/import/page.tsx` (rating not validated 1-5)
- Current mitigation: Supabase RLS policies protect data access
- Recommendations: Add server-side validation in all server actions

**Missing `.env.example`:**
- Risk: No documentation of required environment variables for new developers
- Current mitigation: None
- Recommendations: Create `.env.example` with placeholder values

## Performance Bottlenecks

**Feed loading query pattern:**
- Problem: Multiple sequential queries for feed data (reviews → profiles → like counts)
- File: `src/components/FeedTabs.tsx`
- Cause: Cannot join across tables easily with Supabase client SDK
- Improvement path: Use Supabase views or RPC for aggregated feed queries

## Fragile Areas

**RankingFlow binary comparison:**
- File: `src/components/RankingFlow.tsx`
- Why fragile: Complex binary search algorithm with async state, multiple useRef for cancellation
- Common failures: Stale state during rapid user clicks, edge cases with 0-1 existing books
- Safe modification: Extract comparison logic into pure function, add unit tests
- Test coverage: None

**OpenLibrary API dependency:**
- File: `src/lib/openLibrary.ts`
- Why fragile: External API with no SLA, errors return empty arrays silently
- Common failures: API downtime shows books without covers/descriptions
- Safe modification: Add retry logic, better error surfacing to user
- Test coverage: None

## Scaling Limits

**Supabase plan:**
- Current capacity: Dependent on Supabase plan tier
- Limit: Feed queries fetch up to 50 items per tab, leaderboard fetches 200
- Scaling path: Add pagination, implement cursor-based loading

## Dependencies at Risk

**None critical** - All dependencies are actively maintained (Next.js 16, React 19, Supabase SDK)

## Test Coverage Gaps

**Entire codebase untested:**
- What's not tested: All application code (0% coverage)
- Risk: Regressions undetected, refactoring risky
- Priority: High for `openLibrary.ts` pure functions, `RankingFlow` comparison logic
- Difficulty: No test infrastructure exists, needs initial setup

---

*Concerns audit: 2026-02-24*
*Update as issues are fixed or new ones discovered*
