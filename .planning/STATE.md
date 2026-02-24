# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The ranking flow must feel incredible on iOS — haptic feedback on every comparison, buttery spring animations, gesture-driven interactions.
**Current focus:** Phase 2 complete — ready for Phase 3

## Current Position

Phase: 2 complete
Plan: 02-03 complete
Status: Ready to plan Phase 3
Last activity: 2026-02-24 — Plan 02-03 Apple Sign-In + Username Setup + Auth Routing complete

Progress: ████░░░░░░ 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 6.5min
- Total execution time: 39min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 18min | 6min |
| 02-authentication | 3/3 | 21min | 7min |

**Recent Trend:**
- Last 5 plans: 01-03 (5min), 02-01 (8min), 02-02 (5min), 02-03 (8min)
- Trend: Stable ~5-8min/plan

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Used xcodegen (project.yml) for Xcode project generation
- Global supabase singleton following supabase-swift docs pattern
- PKCE auth flow for mobile security
- Swift 6 with strict concurrency from start
- Used Double for Supabase numeric columns (score, bookScore)
- OLDescription uses singleValueContainer for polymorphic decoding
- Tables without id conform to Hashable instead of Identifiable
- TabRouters passed as @ObservedObject to tab views (let properties on AppRouter cannot produce writable bindings)
- Tab enum with computed title/icon centralizes tab configuration
- ErrorCode static constants for Supabase auth error matching (not raw strings)
- AuthService.AuthState includes .needsUsername for OAuth users
- iOS 16 compatible onChange(of:) with _ parameter
- GoogleSignIn-iOS v8 has no nonce parameter — ID token passed to Supabase without nonce (nonce is optional)
- GoogleAuthService isolated from AuthService — Google SDK logic separate, auth state handled by authStateChanges
- Apple Sign-In uses ASAuthorizationController delegate pattern bridged with CheckedContinuation for async/await
- Social-first auth UI: Apple + Google prominent, email collapsed as fallback (user preference)
- Nonce security for Apple Sign-In (hashed to Apple, raw to Supabase)
- AuthState is Equatable for animated transitions between auth states
- Username validation uses String.range(of:options:.regularExpression) instead of Regex literal for SourceKit compat
- Auth-state routing: BookfolioApp switches on AuthService.state for root view selection

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-24
Stopped at: Phase 2 complete, ready to plan Phase 3 (Feed & Profile)
Resume file: None
