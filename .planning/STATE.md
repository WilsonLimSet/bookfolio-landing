# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The ranking flow must feel incredible on iOS — haptic feedback on every comparison, buttery spring animations, gesture-driven interactions.
**Current focus:** Phase 3 in progress — Feed & Profile

## Current Position

Phase: 3 in progress
Plan: 03-03 complete
Status: Ready for plan 03-04
Last activity: 2026-02-24 — Plan 03-03 Edit profile with avatar upload, favorites management complete

Progress: ██████░░░░ 45%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 6.7min
- Total execution time: 60min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 18min | 6min |
| 02-authentication | 3/3 | 21min | 7min |
| 03-feed-and-profile | 3/4 | 21min | 7min |

**Recent Trend:**
- Last 5 plans: 02-03 (8min), 03-01 (8min), 03-02 (8min), 03-03 (5min)
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
- FeedService uses private Decodable row types for lightweight Supabase query responses
- Review likes fetched separately and merged in Swift (no complex JOINs)
- Inner tab content uses Group+switch instead of nested TabView to avoid conflicts
- Tab caching via loadedTabs Set to avoid re-fetching on tab switch
- ProfileService uses static methods on enum (no instance state needed)
- FollowWithProfile struct for Supabase foreign-key join queries
- Week streak calculated client-side from activity dates grouped by ISO week
- foregroundColor instead of foregroundStyle for ternary Color/HierarchicalShapeStyle compat
- Avatar upload: compress UIImage to JPEG (0.7) then upload to Supabase Storage avatars bucket with upsert
- NewFavoriteBook private Encodable struct for inserting favorites (avoids sending server-generated id)
- PhotosPicker with PhotosPickerItem.loadTransferable for iOS 16+ image selection

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-24
Stopped at: Plan 03-03 complete, ready for 03-04
Resume file: None
